"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { avoidSameClubCollisions, computePoolCount, generateSnakePools } from "@/lib/seeding/snake-pools";
import { roundRobinPairs } from "@/lib/round-robin";
import {
  loadPoolDndData,
  loadPoolBoardData,
  type DndPoolGroup,
  type DndMember,
  type BoardPoolGroup,
} from "@/lib/pool-board-data";
import type { ActionResult } from "@/lib/action-result";

function poolLetterName(index: number): string {
  return `Poule ${String.fromCharCode(65 + index)}`;
}

async function loadCategoryForOrg(
  organizationId: string,
  tournamentId: string,
  categoryId: string
) {
  return prisma.category.findFirst({
    where: { id: categoryId, organizationId, tournamentId },
    include: {
      registrations: {
        orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
        include: { player: { select: { club: true } } },
      },
      poolGroups: { include: { members: true } },
    },
  });
}

export async function generatePoolsAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  mode: "auto" | "manual",
  poolCount?: number
): Promise<ActionResult & { poolGroups?: DndPoolGroup[]; unassigned?: DndMember[] }> {
  if (poolCount !== undefined && (!Number.isInteger(poolCount) || poolCount < 1 || poolCount > 64)) {
    return { error: "Nombre de poules invalide." };
  }

  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Catégorie introuvable." };
  if (category.poolGroups.length > 0) {
    return { error: "Les poules existent déjà. Réinitialise-les avant d'en régénérer." };
  }
  if (category.registrations.length < 2) {
    return { error: "Il faut au moins 2 joueurs inscrits." };
  }

  const count =
    poolCount && poolCount > 0
      ? poolCount
      : computePoolCount(category.registrations.length, category.poolTargetSize ?? 3);

  if (mode === "manual") {
    await prisma.poolGroup.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        categoryId,
        name: poolLetterName(i),
      })),
    });
  } else {
    const snakePools = generateSnakePools(category.registrations, count);
    const pools = avoidSameClubCollisions(snakePools, (reg) => reg.player.club);
    for (let i = 0; i < pools.length; i++) {
      const group = await prisma.poolGroup.create({
        data: { categoryId, name: poolLetterName(i) },
      });
      if (pools[i].length > 0) {
        await prisma.poolMember.createMany({
          data: pools[i].map((reg, seedInPool) => ({
            poolGroupId: group.id,
            registrationId: reg.id,
            seedInPool: seedInPool + 1,
          })),
        });
      }
    }
  }

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
  const dnd = await loadPoolDndData(categoryId);
  return { success: true, poolGroups: dnd.poolGroups, unassigned: dnd.unassigned };
}

export async function movePoolMemberAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  registrationId: string,
  targetPoolGroupId: string | null
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Catégorie introuvable." };

  const poolGroupIds = new Set(category.poolGroups.map((g) => g.id));
  if (targetPoolGroupId && !poolGroupIds.has(targetPoolGroupId)) {
    return { error: "Poule invalide." };
  }
  const registrationValid = category.registrations.some((r) => r.id === registrationId);
  if (!registrationValid) return { error: "Inscription invalide." };

  const matchCount = await prisma.match.count({
    where: { poolGroupId: { in: [...poolGroupIds] } },
  });
  if (matchCount > 0) {
    return { error: "Les matchs de poule ont déjà été générés : réinitialise d'abord." };
  }

  await prisma.$transaction([
    prisma.poolMember.deleteMany({
      where: { registrationId, poolGroupId: { in: [...poolGroupIds] } },
    }),
    ...(targetPoolGroupId
      ? [
          prisma.poolMember.create({
            data: { poolGroupId: targetPoolGroupId, registrationId },
          }),
        ]
      : []),
  ]);

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
  return { success: true };
}

export async function generatePoolMatchesAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string
): Promise<ActionResult & { poolGroups?: BoardPoolGroup[] }> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Catégorie introuvable." };
  if (category.poolGroups.length === 0) return { error: "Aucune poule à générer." };

  const poolGroupIds = category.poolGroups.map((g) => g.id);
  const existingMatches = await prisma.match.count({
    where: { poolGroupId: { in: poolGroupIds } },
  });
  if (existingMatches > 0) {
    return { error: "Les matchs de poule ont déjà été générés." };
  }

  for (const group of category.poolGroups) {
    const registrationIds = group.members.map((m) => m.registrationId);
    const pairs = roundRobinPairs(registrationIds);
    if (pairs.length === 0) continue;
    await prisma.match.createMany({
      data: pairs.map(([p1, p2]) => ({
        organizationId: organization.id,
        type: "POOL" as const,
        poolGroupId: group.id,
        player1Id: p1,
        player2Id: p2,
        status: "SCHEDULED" as const,
      })),
    });
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "POOLS_IN_PROGRESS" },
  });

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
  const poolGroups = await loadPoolBoardData(categoryId);
  return { success: true, poolGroups };
}

export async function resetPoolsAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");
  const category = await loadCategoryForOrg(organization.id, tournamentId, categoryId);
  if (!category) return { error: "Catégorie introuvable." };

  await prisma.$transaction([
    prisma.poolGroup.deleteMany({ where: { categoryId } }), // cascade -> members, matches, sets
    prisma.category.update({ where: { id: categoryId }, data: { status: "DRAFT" } }),
  ]);

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
  return { success: true };
}
