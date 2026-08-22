"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { addPlayerSchema, csvPlayerRowSchema } from "@/lib/validators/player.schema";
import { checkCsvImportRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/action-result";

const TEST_FIRST_NAMES = [
  "Lucas", "Emma", "Hugo", "Léa", "Louis", "Chloé", "Jules", "Manon",
  "Adam", "Camille", "Nathan", "Sarah", "Enzo", "Julie", "Théo", "Inès",
  "Gabriel", "Zoé", "Raphaël", "Jade", "Arthur", "Louise", "Léon", "Alice",
  "Maël", "Rose", "Noah", "Anna", "Tom", "Lina",
];
const TEST_LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
  "Roux", "Vincent", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine",
  "Rousseau", "Blanc", "Guerin", "Muller", "Henry", "Roussel",
];
const TEST_CLUBS = ["SAM Tennis de Table", "AS Bordeaux TT", "Pongiste Club Mérignac", "TT Talence", null];

export async function generateTestPlayersAction(
  orgSlug: string,
  tournamentId: string,
  count: number
): Promise<ActionResult & { created?: number }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
  });
  if (!tournament) return { error: "Tournoi introuvable." };

  if (!Number.isInteger(count) || count < 1 || count > 128) {
    return { error: "Nombre de joueurs invalide (1 à 128)." };
  }

  const existingCount = await prisma.player.count({ where: { tournamentId } });
  const offset = existingCount + Math.floor(Math.random() * 1000);

  const data = Array.from({ length: count }, (_, i) => {
    const n = offset + i;
    return {
      organizationId: organization.id,
      tournamentId,
      firstName: TEST_FIRST_NAMES[n % TEST_FIRST_NAMES.length],
      lastName: TEST_LAST_NAMES[Math.floor(n / TEST_FIRST_NAMES.length) % TEST_LAST_NAMES.length] ?? TEST_LAST_NAMES[n % TEST_LAST_NAMES.length],
      club: TEST_CLUBS[n % TEST_CLUBS.length],
      licenseNumber: String(900000 + n),
    };
  });

  await prisma.player.createMany({ data });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}/players`);
  return { success: true, created: count };
}

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

export async function toggleCheckInAction(
  orgSlug: string,
  tournamentId: string,
  playerId: string,
  checkedIn: boolean
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const player = await prisma.player.findFirst({
    where: { id: playerId, organizationId: organization.id, tournamentId },
  });
  if (!player) return { error: "Joueur introuvable." };

  await prisma.player.update({
    where: { id: playerId },
    data: { checkedInAt: checkedIn ? new Date() : null },
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}/players`);
  return { success: true };
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
