"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";

async function loadCategoryForOrg(organizationId: string, tournamentId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, organizationId, tournamentId },
  });
}

export async function updateCategoryScheduleAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult & { scheduledAt?: Date }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  const date = formData.get("date");
  const time = formData.get("time");
  if (typeof date !== "string" || !date || typeof time !== "string" || !time) {
    return { error: "Date et heure requises." };
  }
  // Les chiffres saisis (heure de la salle, en France) sont stockés tels quels,
  // sans conversion de fuseau horaire, pour ne jamais dériver entre la saisie
  // et l'affichage quel que soit le fuseau du serveur (Vercel tourne en UTC).
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return { error: "Date invalide." };
  }
  const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Date invalide." };
  }

  await prisma.category.update({ where: { id: categoryId }, data: { scheduledAt } });
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true, scheduledAt };
}

export async function updateCategoryBracketTypeAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  const bracketType = formData.get("bracketType");
  const validTypes = ["CLASSIC", "INTEGRAL_BY_LEVEL", "INTEGRAL_OFFICIAL_FFTT", "MAIN_PLUS_CONSOLATION"];
  if (typeof bracketType !== "string" || !validTypes.includes(bracketType)) {
    return { error: "Type de tableau invalide." };
  }

  const qualifiersRaw = formData.get("poolQualifiersCount");
  const poolQualifiersCount = Number(qualifiersRaw);
  if (!Number.isInteger(poolQualifiersCount) || poolQualifiersCount < 1 || poolQualifiersCount > 8) {
    return { error: "Nombre de qualifiés par poule invalide." };
  }

  const repechage = formData.get("repechage") === "on";

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      bracketType: bracketType as
        | "CLASSIC"
        | "INTEGRAL_BY_LEVEL"
        | "INTEGRAL_OFFICIAL_FFTT"
        | "MAIN_PLUS_CONSOLATION",
      poolQualifiersCount,
      repechage,
    },
  });
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true };
}

export async function updateCategoryPoolRulesAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  const poolCountRaw = formData.get("poolCount");
  const poolCount = Number(poolCountRaw);
  if (!Number.isInteger(poolCount) || poolCount < 1 || poolCount > 16) {
    return { error: "Nombre de poules invalide (16 maximum)." };
  }

  const tableStartRaw = formData.get("tableRangeStart");
  const tableEndRaw = formData.get("tableRangeEnd");
  const tableRangeStart = tableStartRaw ? Number(tableStartRaw) : null;
  const tableRangeEnd = tableEndRaw ? Number(tableEndRaw) : null;
  if (
    (tableRangeStart !== null && (!Number.isInteger(tableRangeStart) || tableRangeStart < 1)) ||
    (tableRangeEnd !== null && (!Number.isInteger(tableRangeEnd) || tableRangeEnd < 1)) ||
    (tableRangeStart !== null && tableRangeEnd !== null && tableRangeStart > tableRangeEnd)
  ) {
    return { error: "Plage de tables invalide." };
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { poolCount, tableRangeStart, tableRangeEnd },
  });
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true };
}

export async function deleteCategoryAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true };
}
