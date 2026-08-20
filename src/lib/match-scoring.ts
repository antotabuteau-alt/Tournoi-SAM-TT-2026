export interface SetInput {
  player1Points: number;
  player2Points: number;
}

export interface MatchOutcome {
  valid: boolean;
  error?: string;
  winner?: 1 | 2;
  player1Sets: number;
  player2Sets: number;
}

/** Agrège une liste de manches en totaux (manches et points gagnés par joueur). */
export function aggregateSets(sets: readonly SetInput[]) {
  let player1Sets = 0;
  let player2Sets = 0;
  let player1Points = 0;
  let player2Points = 0;
  for (const s of sets) {
    player1Points += s.player1Points;
    player2Points += s.player2Points;
    if (s.player1Points > s.player2Points) player1Sets += 1;
    else player2Sets += 1;
  }
  return { player1Sets, player2Sets, player1Points, player2Points };
}

/** Une manche est valide si un joueur atteint au moins 11 points avec 2 points d'écart. */
export function isValidSetScore(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0) return false;
  if (a < 11 && b < 11) return false;
  return Math.abs(a - b) >= 2;
}

/**
 * Valide une série de manches et détermine le vainqueur du match.
 * `setsToWin` = nombre de manches gagnantes nécessaires (3 = au meilleur des 5).
 */
export function computeMatchOutcome(
  sets: readonly SetInput[],
  setsToWin: number
): MatchOutcome {
  let player1Sets = 0;
  let player2Sets = 0;

  for (let i = 0; i < sets.length; i++) {
    const { player1Points, player2Points } = sets[i];

    if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
      return {
        valid: false,
        error: "Manche surnuméraire : le match était déjà terminé.",
        player1Sets,
        player2Sets,
      };
    }

    if (!isValidSetScore(player1Points, player2Points)) {
      return {
        valid: false,
        error: `Score de manche ${i + 1} invalide.`,
        player1Sets,
        player2Sets,
      };
    }

    if (player1Points > player2Points) player1Sets += 1;
    else player2Sets += 1;
  }

  if (player1Sets >= setsToWin) {
    return { valid: true, winner: 1, player1Sets, player2Sets };
  }
  if (player2Sets >= setsToWin) {
    return { valid: true, winner: 2, player1Sets, player2Sets };
  }
  return {
    valid: false,
    error: "Match incomplet : aucun joueur n'a atteint le nombre de manches requis.",
    player1Sets,
    player2Sets,
  };
}
