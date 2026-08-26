"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computeQualifiers, createBracketRounds } from "@/lib/bracket-service";
import { loadBracketBoardData, type BracketBoardMatch } from "@/lib/bracket-board-data";
import type { ActionResult } from "@/lib/action-result";

export async function generateBracketAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string
): Promise<ActionResult & { matches?: BracketBoardMatch[] }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
    include: {
      registrations: { orderBy: [{ seed: "asc" }, { createdAt: "asc" }] },
      bracket: true,
      poolGroups: {
        include: {
          members: { select: { registrationId: true, seedInPool: true } },
          matches: { include: { sets: true } },
        },
      },
    },
  });
  if (!category) return { error: "Catégorie introuvable." };
  if (category.bracket) return { error: "Le tableau final a déjà été généré." };
  if (category.format === "POOLS_ONLY") {
    return { error: "Cette catégorie n'a pas de tableau final (poules uniquement)." };
  }

  let qualifierIds: string[];

  if (category.format === "DIRECT_BRACKET") {
    qualifierIds = category.registrations.map((r) => r.id);
  } else {
    if (category.poolGroups.length === 0) {
      return { error: "Génère d'abord les poules." };
    }
    const allDone = category.poolGroups.every((g) =>
      g.matches.every((m) => m.status === "DONE")
    );
    if (!allDone) {
      return { error: "Toutes les poules doivent être terminées avant de générer le tableau final." };
    }
    qualifierIds = computeQualifiers(category.poolGroups, category.poolQualifiersCount);
  }

  if (qualifierIds.length < 2) {
    return { error: "Pas assez de qualifiés pour générer un tableau final." };
  }

  await createBracketRounds(organization.id, categoryId, qualifierIds);

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "BRACKET_IN_PROGRESS" },
  });

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`
  );
  const matches = await loadBracketBoardData(categoryId);
  return { success: true, matches };
}
