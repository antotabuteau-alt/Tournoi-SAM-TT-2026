import { rankPool, type PoolMatchResult, type PoolRankingRow } from "./seeding/pool-ranking";
import { aggregateSets, type SetInput } from "./match-scoring";

interface MatchWithSets {
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  sets: SetInput[];
}

export function computePoolRanking(
  registrationIds: string[],
  matches: readonly MatchWithSets[],
  initialSeedOrder: string[]
): PoolRankingRow<string>[] {
  const poolMatches: PoolMatchResult<string>[] = matches
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

  return rankPool(registrationIds, poolMatches, initialSeedOrder);
}
