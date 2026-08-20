import { describe, expect, it } from "vitest";
import { nextPowerOfTwo, seedBracket, seedPositions } from "./bracket-seeding";

describe("nextPowerOfTwo", () => {
  it("returns the smallest power of 2 >= n", () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(16)).toBe(16);
    expect(nextPowerOfTwo(17)).toBe(32);
  });
});

describe("seedPositions", () => {
  it("computes the standard seeding order", () => {
    expect(seedPositions(1)).toEqual([1]);
    expect(seedPositions(2)).toEqual([1, 2]);
    expect(seedPositions(4)).toEqual([1, 4, 2, 3]);
    expect(seedPositions(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("throws when drawSize is not a power of 2", () => {
    expect(() => seedPositions(6)).toThrow();
  });
});

describe("seedBracket", () => {
  it("places all players when the draw size matches exactly", () => {
    const players = ["A", "B", "C", "D"];
    const slots = seedBracket(players, 4);
    expect(slots.map((s) => s.player)).toEqual(["A", "D", "B", "C"]);
  });

  it("fills excess slots with byes, placed against the top seeds", () => {
    // 5 qualifiés -> tableau de 8, seeds 6/7/8 sont des BYE
    const players = ["A", "B", "C", "D", "E"];
    const slots = seedBracket(players, 8);

    expect(slots).toHaveLength(8);
    // seed order for drawSize=8: [1,8,4,5,2,7,3,6]
    // -> positions with seeds 6,7,8 (players D... wait only 5 players) are byes
    const byeCount = slots.filter((s) => s.player === null).length;
    expect(byeCount).toBe(3);
    // seed 1 (position 0) always faces a bye when there are exactly 5 players
    expect(slots[0].player).toBe("A");
    expect(slots[1].player).toBeNull();
  });

  it("throws when there are more players than the draw size", () => {
    expect(() => seedBracket(["A", "B", "C"], 2)).toThrow();
  });
});
