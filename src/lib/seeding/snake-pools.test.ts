import { describe, expect, it } from "vitest";
import { computePoolCount, generateSnakePools } from "./snake-pools";

describe("generateSnakePools", () => {
  it("distributes players in boustrophedon order across 4 pools", () => {
    const players = Array.from({ length: 16 }, (_, i) => i + 1); // seeds 1..16
    const pools = generateSnakePools(players, 4);

    expect(pools).toHaveLength(4);
    expect(pools[0]).toEqual([1, 8, 9, 16]);
    expect(pools[1]).toEqual([2, 7, 10, 15]);
    expect(pools[2]).toEqual([3, 6, 11, 14]);
    expect(pools[3]).toEqual([4, 5, 12, 13]);
  });

  it("handles a player count not divisible by the pool count", () => {
    const players = Array.from({ length: 10 }, (_, i) => i + 1);
    const pools = generateSnakePools(players, 3);

    expect(pools.map((p) => p.length).sort()).toEqual([3, 3, 4]);
    expect(pools.flat().sort((a, b) => a - b)).toEqual(players);
  });

  it("handles a single pool", () => {
    const players = [1, 2, 3];
    expect(generateSnakePools(players, 1)).toEqual([[1, 2, 3]]);
  });

  it("handles more pools than players", () => {
    const players = [1, 2];
    const pools = generateSnakePools(players, 4);
    expect(pools.flat()).toEqual(players);
    expect(pools.filter((p) => p.length === 0)).toHaveLength(2);
  });

  it("throws for a non-positive pool count", () => {
    expect(() => generateSnakePools([1, 2], 0)).toThrow();
  });
});

describe("computePoolCount", () => {
  it("rounds up to cover all players at the target size", () => {
    expect(computePoolCount(16, 4)).toBe(4);
    expect(computePoolCount(17, 4)).toBe(5);
    expect(computePoolCount(1, 4)).toBe(1);
  });
});
