import { rankPool, type PoolMatchResult } from "./seeding/pool-ranking";
import { aggregateSets } from "./match-scoring";
import { nextPowerOfTwo, seedBracket } from "./seeding/bracket-seeding";
import { prisma } from "./prisma";

interface PoolMatchWithSets {
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  sets: { player1Points: number; player2Points: number }[];
}

interface PoolGroupData {
  members: { registrationId: string; seedInPool: number | null }[];
  matches: PoolMatchWithSets[];
}

interface QualifierCandidate {
  registrationId: string;
  wins: number;
  setDiff: number;
  pointDiff: number;
}

/**
 * Détermine l'ordre global des qualifiés pour le tableau final : d'abord tous
 * les 1ers de poule (départagés par performance), puis tous les 2èmes, etc.
 */
export function computeQualifiers(
  poolGroups: readonly PoolGroupData[],
  qualifiersPerPool: number
): string[] {
  const rankGroups: QualifierCandidate[][] = [];

  for (const group of poolGroups) {
    const registrationIds = group.members.map((m) => m.registrationId);

    const matches: PoolMatchResult<string>[] = group.matches
      .filter((m) => m.player1Id && m.player2Id && m.winnerId)
      .map((m) => {
        const agg = aggregateSets(m.sets);
        return {
          player1: m.player1Id as string,
          player2: m.player2Id as string,
          winner: m.winnerId as string,
          player1SetsWon: agg.player1Sets,
          player2SetsWon: agg.player2Sets,
          player1PointsWon: agg.player1Points,
          player2PointsWon: agg.player2Points,
        };
      });

    const initialSeedOrder = [...group.members]
      .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
      .map((m) => m.registrationId);

    const ranking = rankPool(registrationIds, matches, initialSeedOrder);

    for (const row of ranking.slice(0, qualifiersPerPool)) {
      const groupIndex = row.rank - 1;
      rankGroups[groupIndex] ??= [];
      rankGroups[groupIndex].push({
        registrationId: row.player,
        wins: row.wins,
        setDiff: row.setsWon - row.setsLost,
        pointDiff: row.pointsWon - row.pointsLost,
      });
    }
  }

  const ordered: string[] = [];
  for (const group of rankGroups) {
    if (!group) continue;
    const sorted = [...group].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.setDiff !== b.setDiff) return b.setDiff - a.setDiff;
      return b.pointDiff - a.pointDiff;
    });
    ordered.push(...sorted.map((c) => c.registrationId));
  }
  return ordered;
}

function resolveByeStatus(player1Id: string | null, player2Id: string | null) {
  if (player1Id && player2Id) {
    return { winnerId: null as string | null, status: "SCHEDULED" as const };
  }
  if (player1Id || player2Id) {
    return { winnerId: player1Id ?? player2Id, status: "BYE" as const };
  }
  return { winnerId: null as string | null, status: "BYE" as const };
}

/**
 * Crée le Bracket et tous ses Match (avec propagation automatique des BYE),
 * à partir d'une liste de qualifiés déjà ordonnée par rang. Réutilisé par
 * l'action de génération du tableau et par le générateur de données de démo.
 */
export async function createBracketRounds(
  organizationId: string,
  categoryId: string,
  qualifierIds: string[]
): Promise<{ bracketId: string; drawSize: number }> {
  const drawSize = nextPowerOfTwo(qualifierIds.length);
  const slots = seedBracket(qualifierIds, drawSize);

  const bracket = await prisma.bracket.create({
    data: { categoryId, drawSize },
  });

  let previousRound: { id: string; winnerId: string | null }[] = [];
  const round1Count = drawSize / 2;

  for (let i = 0; i < round1Count; i++) {
    const p1 = slots[2 * i].player;
    const p2 = slots[2 * i + 1].player;
    const { winnerId, status } = resolveByeStatus(p1, p2);
    const match = await prisma.match.create({
      data: {
        organizationId,
        type: "BRACKET",
        bracketId: bracket.id,
        round: 1,
        position: i,
        player1Id: p1,
        player2Id: p2,
        winnerId,
        status,
      },
    });
    previousRound.push({ id: match.id, winnerId });
  }

  let round = 2;
  while (previousRound.length > 1) {
    const thisRoundCount = previousRound.length / 2;
    const thisRound: { id: string; winnerId: string | null }[] = [];

    for (let i = 0; i < thisRoundCount; i++) {
      const left = previousRound[2 * i];
      const right = previousRound[2 * i + 1];
      const { winnerId, status } = resolveByeStatus(left.winnerId, right.winnerId);

      const match = await prisma.match.create({
        data: {
          organizationId,
          type: "BRACKET",
          bracketId: bracket.id,
          round,
          position: i,
          player1Id: left.winnerId,
          player2Id: right.winnerId,
          winnerId,
          status,
        },
      });

      await prisma.match.update({
        where: { id: left.id },
        data: { nextMatchId: match.id, nextMatchSlot: 1 },
      });
      await prisma.match.update({
        where: { id: right.id },
        data: { nextMatchId: match.id, nextMatchSlot: 2 },
      });

      thisRound.push({ id: match.id, winnerId });
    }

    previousRound = thisRound;
    round += 1;
  }

  return { bracketId: bracket.id, drawSize };
}

/**
 * Fait avancer le vainqueur d'un match vers le slot correspondant du match
 * suivant. Un match du tour N+1 est créé avec le statut "BYE" tant que ses
 * deux adversaires ne sont pas encore connus (les deux valent null au moment
 * de la génération du tableau) — dès que les deux places sont remplies par
 * de vrais vainqueurs, il faut repasser son statut à "SCHEDULED" pour que la
 * saisie de score redevienne possible.
 */
export async function propagateBracketWinner(
  nextMatchId: string,
  slot: number,
  winnerId: string
): Promise<void> {
  const updated = await prisma.match.update({
    where: { id: nextMatchId },
    data: slot === 1 ? { player1Id: winnerId } : { player2Id: winnerId },
    select: { player1Id: true, player2Id: true, status: true },
  });

  if (updated.player1Id && updated.player2Id && updated.status === "BYE") {
    await prisma.match.update({
      where: { id: nextMatchId },
      data: { status: "SCHEDULED" },
    });
  }
}
