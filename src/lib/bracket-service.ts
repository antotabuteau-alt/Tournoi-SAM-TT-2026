import { rankPool, type PoolMatchResult } from "./seeding/pool-ranking";
import { aggregateSets } from "./match-scoring";

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
