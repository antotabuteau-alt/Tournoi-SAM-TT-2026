"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { nextPowerOfTwo, seedBracket } from "@/lib/seeding/bracket-seeding";
import { computeQualifiers } from "@/lib/bracket-service";
import type { ActionResult } from "@/lib/action-result";

function resolveByeStatus(player1Id: string | null, player2Id: string | null) {
  if (player1Id && player2Id) {
    return { winnerId: null as string | null, status: "SCHEDULED" as const };
  }
  if (player1Id || player2Id) {
    return { winnerId: player1Id ?? player2Id, status: "BYE" as const };
  }
  return { winnerId: null as string | null, status: "BYE" as const };
}

export async function generateBracketAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string
): Promise<ActionResult> {
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

  const drawSize = nextPowerOfTwo(qualifierIds.length);
  const slots = seedBracket(qualifierIds, drawSize);

  const bracket = await prisma.bracket.create({
    data: { categoryId, drawSize },
  });

  let previousRound: { id: string; winnerId: string | null }[] = [];
  const round1Count = drawSize / 2;

  for (let i = 0; i < round1Count; i++) {
    const p1 = slots[2 * i].player;
    const p2 = slots[2 * i + 1].player;
    const { winnerId, status } = resolveByeStatus(p1, p2);
    const match = await prisma.match.create({
      data: {
        organizationId: organization.id,
        type: "BRACKET",
        bracketId: bracket.id,
        round: 1,
        position: i,
        player1Id: p1,
        player2Id: p2,
        winnerId,
        status,
      },
    });
    previousRound.push({ id: match.id, winnerId });
  }

  let round = 2;
  while (previousRound.length > 1) {
    const thisRoundCount = previousRound.length / 2;
    const thisRound: { id: string; winnerId: string | null }[] = [];

    for (let i = 0; i < thisRoundCount; i++) {
      const left = previousRound[2 * i];
      const right = previousRound[2 * i + 1];
      const { winnerId, status } = resolveByeStatus(left.winnerId, right.winnerId);

      const match = await prisma.match.create({
        data: {
          organizationId: organization.id,
          type: "BRACKET",
          bracketId: bracket.id,
          round,
          position: i,
          player1Id: left.winnerId,
          player2Id: right.winnerId,
          winnerId,
          status,
        },
      });

      await prisma.match.update({
        where: { id: left.id },
        data: { nextMatchId: match.id, nextMatchSlot: 1 },
      });
      await prisma.match.update({
        where: { id: right.id },
        data: { nextMatchId: match.id, nextMatchSlot: 2 },
      });

      thisRound.push({ id: match.id, winnerId });
    }

    previousRound = thisRound;
    round += 1;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "BRACKET_IN_PROGRESS" },
  });

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`
  );
  return { success: true };
}
