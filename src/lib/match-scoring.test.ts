import { describe, expect, it } from "vitest";
import { computeMatchOutcome, isValidSetScore } from "./match-scoring";

describe("isValidSetScore", () => {
  it("accepts a standard 11-x score", () => {
    expect(isValidSetScore(11, 5)).toBe(true);
    expect(isValidSetScore(11, 9)).toBe(true);
  });

  it("rejects a score below 11 with no deuce", () => {
    expect(isValidSetScore(10, 8)).toBe(false);
  });

  it("requires a 2-point gap in deuce", () => {
    expect(isValidSetScore(11, 10)).toBe(false);
    expect(isValidSetScore(12, 10)).toBe(true);
    expect(isValidSetScore(15, 13)).toBe(true);
  });

  it("rejects negative or non-integer scores", () => {
    expect(isValidSetScore(-1, 11)).toBe(false);
    expect(isValidSetScore(11.5, 5)).toBe(false);
  });
});

describe("computeMatchOutcome", () => {
  it("declares a winner once setsToWin is reached (best of 5)", () => {
    const outcome = computeMatchOutcome(
      [
        { player1Points: 11, player2Points: 5 },
        { player1Points: 9, player2Points: 11 },
        { player1Points: 11, player2Points: 8 },
        { player1Points: 11, player2Points: 7 },
      ],
      3
    );
    expect(outcome).toMatchObject({ valid: true, winner: 1, player1Sets: 3, player2Sets: 1 });
  });

  it("rejects an incomplete match", () => {
    const outcome = computeMatchOutcome(
      [{ player1Points: 11, player2Points: 5 }],
      3
    );
    expect(outcome.valid).toBe(false);
  });

  it("rejects extra sets played after the match was already decided", () => {
    const outcome = computeMatchOutcome(
      [
        { player1Points: 11, player2Points: 5 },
        { player1Points: 11, player2Points: 5 },
        { player1Points: 11, player2Points: 5 },
        { player1Points: 5, player2Points: 11 },
      ],
      3
    );
    expect(outcome.valid).toBe(false);
    expect(outcome.error).toMatch(/surnuméraire/);
  });

  it("rejects an invalid set score inside the sequence", () => {
    const outcome = computeMatchOutcome(
      [
        { player1Points: 11, player2Points: 5 },
        { player1Points: 10, player2Points: 9 },
      ],
      3
    );
    expect(outcome.valid).toBe(false);
  });
});
