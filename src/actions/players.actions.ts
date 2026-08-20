"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { addPlayerSchema, csvPlayerRowSchema } from "@/lib/validators/player.schema";
import { checkCsvImportRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/action-result";

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function addPlayerAction(
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

  const parsed = addPlayerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    club: formData.get("club") || undefined,
    licenseNumber: formData.get("licenseNumber") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  await prisma.player.create({
    data: {
      organizationId: organization.id,
      tournamentId: tournament.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      club: parsed.data.club || null,
      licenseNumber: parsed.data.licenseNumber || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}/players`);
  return { success: true };
}

export async function importPlayersAction(
  orgSlug: string,
  tournamentId: string,
  rows: unknown[]
): Promise<ActionResult & { imported?: number }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
  });
  if (!tournament) return { error: "Tournoi introuvable." };

  const ip = await getClientIp();
  const { success: withinLimit } = await checkCsvImportRateLimit(
    `${organization.id}:${ip}`
  );
  if (!withinLimit) {
    return { error: "Trop d'imports récents. Réessaie dans une minute." };
  }

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 2000) {
    return { error: "Fichier vide ou trop volumineux (max 2000 lignes)." };
  }

  const validRows = [];
  for (const row of rows) {
    const parsed = csvPlayerRowSchema.safeParse(row);
    if (parsed.success) validRows.push(parsed.data);
  }
  if (validRows.length === 0) {
    return { error: "Aucune ligne valide dans le fichier." };
  }

  await prisma.player.createMany({
    data: validRows.map((row) => ({
      organizationId: organization.id,
      tournamentId: tournament.id,
      firstName: row.firstName,
      lastName: row.lastName,
      club: row.club || null,
      licenseNumber: row.licenseNumber || null,
      email: row.email || null,
      phone: row.phone || null,
    })),
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}/players`);
  return { success: true, imported: validRows.length };
}

export async function registerPlayersToCategoryAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  playerIds: string[]
): Promise<ActionResult> {
  if (!Array.isArray(playerIds) || playerIds.length === 0 || playerIds.length > 500) {
    return { error: "Sélection invalide." };
  }

  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      organizationId: organization.id,
      tournamentId,
    },
  });
  if (!category) return { error: "Catégorie introuvable." };

  const players = await prisma.player.findMany({
    where: {
      id: { in: playerIds },
      organizationId: organization.id,
      tournamentId,
    },
  });
  if (players.length === 0) return { error: "Aucun joueur sélectionné." };

  await prisma.categoryRegistration.createMany({
    data: players.map((p) => ({ categoryId: category.id, playerId: p.id })),
    skipDuplicates: true,
  });

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`
  );
  return { success: true };
}
