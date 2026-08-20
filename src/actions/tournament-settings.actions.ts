"use server";

import { redirect } from "next/navigation";
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
