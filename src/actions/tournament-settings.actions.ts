"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createTournamentSchema } from "@/lib/validators/tournament.schema";
import type { ActionResult } from "@/lib/action-result";

export async function updateTournamentSettingsAction(
  orgSlug: string,
  tournamentId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
  });
  if (!tournament) return { error: "Tournoi introuvable." };

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      location: parsed.data.location || null,
    },
  });

  redirect(`/${orgSlug}/tournaments/${tournamentId}`);
}

export async function duplicateTournamentAction(
  orgSlug: string,
  tournamentId: string
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
    include: { categories: true },
  });
  if (!tournament) return { error: "Tournoi introuvable." };

  const copy = await prisma.$transaction(async (tx) => {
    const newTournament = await tx.tournament.create({
      data: {
        organizationId: organization.id,
        name: `${tournament.name} (copie)`,
        date: tournament.date,
        location: tournament.location,
        publicSlug: nanoid(12),
      },
    });

    if (tournament.categories.length > 0) {
      await tx.category.createMany({
        data: tournament.categories.map((c) => ({
          organizationId: organization.id,
          tournamentId: newTournament.id,
          name: c.name,
          format: c.format,
          poolTargetSize: c.poolTargetSize,
          poolQualifiersCount: c.poolQualifiersCount,
          bestOfSets: c.bestOfSets,
          poolCount: c.poolCount,
          tableRangeStart: c.tableRangeStart,
          tableRangeEnd: c.tableRangeEnd,
          repechage: c.repechage,
          bracketType: c.bracketType,
        })),
      });
    }

    return newTournament;
  });

  revalidatePath(`/${orgSlug}`, "layout");
  redirect(`/${orgSlug}/tournaments/${copy.id}`);
}
