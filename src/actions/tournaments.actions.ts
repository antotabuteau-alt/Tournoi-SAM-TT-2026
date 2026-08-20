"use server";

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  createTournamentSchema,
} from "@/lib/validators/tournament.schema";
import type { ActionResult } from "@/lib/action-result";

export async function createTournamentAction(
  orgSlug: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  const tournament = await prisma.tournament.create({
    data: {
      organizationId: organization.id,
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      location: parsed.data.location || null,
      publicSlug: nanoid(12),
    },
  });

  redirect(`/${orgSlug}/tournaments/${tournament.id}`);
}

export async function createCategoryAction(
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

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    format: formData.get("format"),
    poolTargetSize: formData.get("poolTargetSize") || undefined,
    poolQualifiersCount: formData.get("poolQualifiersCount") || undefined,
    bestOfSets: formData.get("bestOfSets"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  await prisma.category.create({
    data: {
      organizationId: organization.id,
      tournamentId: tournament.id,
      name: parsed.data.name,
      format: parsed.data.format,
      poolTargetSize: parsed.data.poolTargetSize,
      poolQualifiersCount: parsed.data.poolQualifiersCount,
      bestOfSets: parsed.data.bestOfSets,
    },
  });

  redirect(`/${orgSlug}/tournaments/${tournamentId}`);
}
