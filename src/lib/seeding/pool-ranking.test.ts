import { describe, expect, it } from "vitest";
import { rankPool, type PoolMatchResult } from "./pool-ranking";

describe("rankPool", () => {
  it("ranks players purely by win count when there is no tie", () => {
    const [A, B, C] = ["A", "B", "C"];
    const matches: PoolMatchResult<string>[] = [
      { player1: A, player2: B, winner: A, player1SetsWon: 3, player2SetsWon: 1, player1PointsWon: 66, player2PointsWon: 50 },
      { player1: A, player2: C, winner: A, player1SetsWon: 3, player2SetsWon: 0, player1PointsWon: 33, player2PointsWon: 20 },
      { player1: B, player2: C, winner: B, player1SetsWon: 3, player2SetsWon: 2, player1PointsWon: 70, player2PointsWon: 65 },
    ];

    const ranking = rankPool([A, B, C], matches);
    expect(ranking.map((r) => r.player)).toEqual([A, B, C]);
    expect(ranking[0]).toMatchObject({ wins: 2, losses: 0 });
    expect(ranking[2]).toMatchObject({ wins: 0, losses: 2 });
  });

  it("breaks a 2-way tie using head-to-head result", () => {
    // Poule à 4 : A et B finissent à 1 victoire chacun, départagés par leur
    // confrontation directe (A a battu B). C (2 victoires) et D (0 victoire)
    // ne sont pas concernés par le départage.
    const [A, B, C, D] = ["A", "B", "C", "D"];
    const matches: PoolMatchResult<string>[] = [
      { player1: A, player2: B, winner: A, player1SetsWon: 3, player2SetsWon: 1, player1PointsWon: 60, player2PointsWon: 50 },
      { player1: C, player2: D, winner: C, player1SetsWon: 3, player2SetsWon: 0, player1PointsWon: 33, player2PointsWon: 20 },
      { player1: A, player2: C, winner: C, player1SetsWon: 1, player2SetsWon: 3, player1PointsWon: 40, player2PointsWon: 66 },
      { player1: B, player2: D, winner: B, player1SetsWon: 3, player2SetsWon: 2, player1PointsWon: 70, player2PointsWon: 65 },
    ];
    const ranking = rankPool([A, B, C, D], matches);
    expect(ranking.map((r) => r.player)).toEqual([C, A, B, D]);
  });

  it("falls back to set difference when head-to-head is circular (3-way tie)", () => {
    const [A, B, C] = ["A", "B", "C"];
    // Circular: A beats B, B beats C, C beats A -> all 1 win / 1 loss, mini-classement circular
    const matches: PoolMatchResult<string>[] = [
      { player1: A, player2: B, winner: A, player1SetsWon: 3, player2SetsWon: 0, player1PointsWon: 33, player2PointsWon: 10 },
      { player1: B, player2: C, winner: B, player1SetsWon: 3, player2SetsWon: 2, player1PointsWon: 60, player2PointsWon: 55 },
      { player1: C, player2: A, winner: C, player1SetsWon: 3, player2SetsWon: 1, player1PointsWon: 55, player2PointsWon: 40 },
    ];
    // set diff within subgroup:
    // A: sets won 3(vsB)+1(vsC)=4, sets lost 0(vsB)+3(vsC)=3 -> diff +1
    // B: sets won 0(vsA)+3(vsC)=3, lost 3(vsA)+2(vsC)=5 -> diff -2
    // C: sets won 2(vsB)+3(vsA)=5, lost 3(vsB)+1(vsA)=4 -> diff +1
    // A and C tied at +1 set diff -> point diff: A = 73-65 = +8, C = 110-100 = +10
    // => C ranks above A, B last (worst set diff)
    const ranking = rankPool([A, B, C], matches);
    expect(ranking.map((r) => r.player)).toEqual([C, A, B]);
  });

  it("uses the initial seed order as the final tie-break", () => {
    const [A, B] = ["A", "B"];
    // No matches played between them (edge case) -> both 0 wins, fully tied stats
    const matches: PoolMatchResult<string>[] = [];
    const ranking = rankPool([A, B], matches, [B, A]);
    expect(ranking.map((r) => r.player)).toEqual([B, A]);
  });
});
