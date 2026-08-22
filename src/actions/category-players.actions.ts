"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";

const TEST_FIRST_NAMES = [
  "Lucas", "Emma", "Hugo", "Léa", "Louis", "Chloé", "Jules", "Manon",
  "Adam", "Camille", "Nathan", "Sarah", "Enzo", "Julie", "Théo", "Inès",
  "Gabriel", "Zoé", "Raphaël", "Jade", "Arthur", "Louise", "Léon", "Alice",
];
const TEST_LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
  "Roux", "Vincent", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine",
];

async function loadCategoryForOrg(organizationId: string, tournamentId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, organizationId, tournamentId },
  });
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Reclasse les têtes de série de la catégorie par classement (rankingPoints)
 * décroissant — reproduit "le classement officiel devient le niveau (têtes
 * de série & handicaps)" vu sur ping-tournoi.fr. Les joueurs sans classement
 * gardent une tête de série mais passent après ceux qui en ont un.
 */
async function recomputeCategorySeeds(categoryId: string): Promise<void> {
  const registrations = await prisma.categoryRegistration.findMany({
    where: { categoryId },
    include: { player: { select: { rankingPoints: true } } },
    orderBy: { createdAt: "asc" },
  });

  const sorted = [...registrations].sort((a, b) => {
    const pa = a.player.rankingPoints;
    const pb = b.player.rankingPoints;
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pb - pa;
  });

  await prisma.$transaction(
    sorted.map((r, i) =>
      prisma.categoryRegistration.update({ where: { id: r.id }, data: { seed: i + 1 } })
    )
  );
}

export async function addPlayerToCategoryManuallyAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Nom requis." };
  }
  const pointsRaw = formData.get("points");
  const points = pointsRaw && String(pointsRaw).trim() !== "" ? Number(pointsRaw) : null;
  if (points !== null && (!Number.isFinite(points) || points < 0)) {
    return { error: "Points invalides." };
  }

  const { firstName, lastName } = splitName(name);

  const player = await prisma.player.create({
    data: {
      organizationId: organization.id,
      tournamentId,
      firstName,
      lastName,
      rankingPoints: points,
    },
  });
  await prisma.categoryRegistration.create({
    data: { categoryId, playerId: player.id },
  });
  await recomputeCategorySeeds(categoryId);

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true };
}

interface CreatedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  rankingPoints: number | null;
}

export async function generateTestPlayersForCategoryAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  count: number
): Promise<ActionResult & { created?: CreatedPlayer[] }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  if (!Number.isInteger(count) || count < 1 || count > 64) {
    return { error: "Nombre de joueurs invalide (1 à 64)." };
  }

  const existingCount = await prisma.player.count({ where: { tournamentId } });
  const offset = existingCount + Math.floor(Math.random() * 1000);

  const players = await Promise.all(
    Array.from({ length: count }, (_, i) => {
      const n = offset + i;
      return prisma.player.create({
        data: {
          organizationId: organization.id,
          tournamentId,
          firstName: TEST_FIRST_NAMES[n % TEST_FIRST_NAMES.length],
          lastName: TEST_LAST_NAMES[Math.floor(n / TEST_FIRST_NAMES.length) % TEST_LAST_NAMES.length],
          rankingPoints: 500 + Math.floor(Math.random() * 1500),
        },
      });
    })
  );

  await prisma.categoryRegistration.createMany({
    data: players.map((p) => ({ categoryId, playerId: p.id })),
    skipDuplicates: true,
  });
  await recomputeCategorySeeds(categoryId);

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return {
    success: true,
    created: players.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      rankingPoints: p.rankingPoints,
    })),
  };
}

export async function importCsvPlayersToCategoryAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  rows: { name: string; points?: number }[]
): Promise<ActionResult & { imported?: CreatedPlayer[] }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Tableau introuvable." };

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    return { error: "Fichier vide ou trop volumineux (max 500 lignes)." };
  }

  const valid = rows.filter((r) => r.name && r.name.trim());
  if (valid.length === 0) return { error: "Aucune ligne valide." };

  const players = await Promise.all(
    valid.map((r) => {
      const { firstName, lastName } = splitName(r.name);
      return prisma.player.create({
        data: {
          organizationId: organization.id,
          tournamentId,
          firstName,
          lastName,
          rankingPoints: Number.isFinite(r.points) ? (r.points as number) : null,
        },
      });
    })
  );

  await prisma.categoryRegistration.createMany({
    data: players.map((p) => ({ categoryId, playerId: p.id })),
    skipDuplicates: true,
  });
  await recomputeCategorySeeds(categoryId);

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return {
    success: true,
    imported: players.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      rankingPoints: p.rankingPoints,
    })),
  };
}
