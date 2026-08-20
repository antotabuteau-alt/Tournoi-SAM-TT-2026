"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computeMatchOutcome, type SetInput } from "@/lib/match-scoring";
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

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`
  );
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
    await prisma.match.update({
      where: { id: match.nextMatchId },
      data:
        match.nextMatchSlot === 1
          ? { player1Id: result.winnerId }
          : { player2Id: result.winnerId },
    });
  }

  revalidatePath(
    `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`
  );
  return { success: true };
}
