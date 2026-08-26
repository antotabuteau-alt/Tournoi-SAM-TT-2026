"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  createTournamentSchema,
} from "@/lib/validators/tournament.schema";
import { weekendDatesOf } from "@/lib/category-day";
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

  revalidatePath(`/${orgSlug}`, "layout");
  redirect(`/${orgSlug}/tournaments/${tournament.id}`);
}

export interface CreatedCategorySummary {
  id: string;
  name: string;
  format: string;
  status: string;
  scheduledAt: Date | null;
  bracketType: "CLASSIC" | "INTEGRAL_BY_LEVEL" | "INTEGRAL_OFFICIAL_FFTT" | "MAIN_PLUS_CONSOLATION";
  poolQualifiersCount: number;
  repechage: boolean;
  poolCount: number | null;
  tableRangeStart: number | null;
  tableRangeEnd: number | null;
}

export async function createCategoryAction(
  orgSlug: string,
  tournamentId: string,
  _prev: (ActionResult & { category?: CreatedCategorySummary }) | null,
  formData: FormData
): Promise<ActionResult & { category?: CreatedCategorySummary }> {
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
    day: formData.get("day") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  let scheduledAt: Date | null = null;
  if (parsed.data.day !== "NONE") {
    const { saturday, sunday } = weekendDatesOf(tournament.date);
    const day = parsed.data.day === "SATURDAY" ? saturday : sunday;
    scheduledAt = new Date(day.getTime() + 8 * 60 * 60 * 1000); // 08h00 par défaut, ajustable ensuite
  }

  const category = await prisma.category.create({
    data: {
      organizationId: organization.id,
      tournamentId: tournament.id,
      name: parsed.data.name,
      format: parsed.data.format,
      poolTargetSize: parsed.data.poolTargetSize,
      poolQualifiersCount: parsed.data.poolQualifiersCount,
      bestOfSets: parsed.data.bestOfSets,
      scheduledAt,
    },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      scheduledAt: true,
      bracketType: true,
      poolQualifiersCount: true,
      repechage: true,
      poolCount: true,
      tableRangeStart: true,
      tableRangeEnd: true,
    },
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`, "layout");
  return { success: true, category };
}
