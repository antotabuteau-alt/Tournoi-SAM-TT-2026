"use server";

import { revalidatePath, refresh } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computeMatchOutcome, type SetInput } from "@/lib/match-scoring";
import { propagateBracketWinner } from "@/lib/bracket-service";
import type { ActionResult } from "@/lib/action-result";

async function persistMatchResult(
  matchId: string,
  player1Id: string,
  player2Id: string,
  sets: SetInput[],
  setsToWin: number
): Promise<{ error: string } | { winnerId: string }> {
  const outcome = computeMatchOutcome(sets, setsToWin);
  if (!outcome.valid) return { error: outcome.error! };

  const winnerId = outcome.winner === 1 ? player1Id : player2Id;

  await prisma.$transaction([
    prisma.setScore.deleteMany({ where: { matchId } }),
    prisma.setScore.createMany({
      data: sets.map((s, i) => ({
        matchId,
        setNumber: i + 1,
        player1Points: s.player1Points,
        player2Points: s.player2Points,
      })),
    }),
    prisma.match.update({
      where: { id: matchId },
      data: { winnerId, status: "DONE" },
    }),
  ]);

  return { winnerId };
}

export async function submitPoolScoreAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  matchId: string,
  sets: SetInput[]
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
  });
  if (!category) return { error: "Catégorie introuvable." };

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      poolGroup: { categoryId },
    },
  });
  if (!match || !match.player1Id || !match.player2Id) {
    return { error: "Match invalide." };
  }

  const result = await persistMatchResult(
    matchId,
    match.player1Id,
    match.player2Id,
    sets,
    category.bestOfSets
  );
  if ("error" in result) return result;

  if (category.status === "POOLS_IN_PROGRESS") {
    const remaining = await prisma.match.count({
      where: { poolGroup: { categoryId }, status: { notIn: ["DONE", "BYE"] } },
    });
    if (remaining === 0) {
      await prisma.category.update({
        where: { id: categoryId },
        data: { status: "POOLS_DONE" },
      });
    }
  }

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  refresh();
  return { success: true };
}

export async function submitBracketScoreAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  matchId: string,
  sets: SetInput[]
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
  });
  if (!category) return { error: "Catégorie introuvable." };

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      bracket: { categoryId },
    },
  });
  if (!match || !match.player1Id || !match.player2Id) {
    return { error: "Match invalide (bye ou joueurs pas encore connus)." };
  }

  const result = await persistMatchResult(
    matchId,
    match.player1Id,
    match.player2Id,
    sets,
    category.bestOfSets
  );
  if ("error" in result) return result;

  if (match.nextMatchId && match.nextMatchSlot) {
    await propagateBracketWinner(match.nextMatchId, match.nextMatchSlot, result.winnerId);
  } else {
    // Pas de nextMatchId : c'était la finale.
    await prisma.category.update({
      where: { id: categoryId },
      data: { status: "FINISHED" },
    });
  }

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`
  );
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { success: true };
}

export async function setMatchTableAction(
  orgSlug: string,
  categoryId: string,
  matchId: string,
  tableNumber: number | null
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  if (tableNumber !== null && (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 200)) {
    return { error: "Numéro de table invalide." };
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      OR: [{ poolGroup: { categoryId } }, { bracket: { categoryId } }],
    },
  });
  if (!match) return { error: "Match introuvable." };

  await prisma.match.update({ where: { id: matchId }, data: { tableNumber } });
  return { success: true };
}

export async function setMatchRefereeAction(
  orgSlug: string,
  categoryId: string,
  matchId: string,
  refereeName: string
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const trimmed = refereeName.trim().slice(0, 80);

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      OR: [{ poolGroup: { categoryId } }, { bracket: { categoryId } }],
    },
  });
  if (!match) return { error: "Match introuvable." };

  await prisma.match.update({
    where: { id: matchId },
    data: { refereeName: trimmed || null },
  });
  return { success: true };
}

export async function submitForfeitAction(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  matchId: string,
  kind: "pool" | "bracket",
  forfeitingSlot: 1 | 2
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      ...(kind === "pool" ? { poolGroup: { categoryId } } : { bracket: { categoryId } }),
    },
  });
  if (!match || !match.player1Id || !match.player2Id) {
    return { error: "Match invalide." };
  }

  const winnerId = forfeitingSlot === 1 ? match.player2Id : match.player1Id;

  await prisma.$transaction([
    prisma.setScore.deleteMany({ where: { matchId } }),
    prisma.match.update({
      where: { id: matchId },
      data: { winnerId, status: "WALKOVER" },
    }),
  ]);

  if (kind === "bracket" && match.nextMatchId && match.nextMatchSlot) {
    await propagateBracketWinner(match.nextMatchId, match.nextMatchSlot, winnerId);
  }

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/${kind === "pool" ? "pools" : "bracket"}`
  );
  return { success: true };
}
