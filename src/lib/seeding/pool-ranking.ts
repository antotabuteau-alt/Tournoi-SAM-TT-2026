export interface PoolMatchResult<P> {
  player1: P;
  player2: P;
  winner: P; // doit être player1 ou player2 (===)
  player1SetsWon: number;
  player2SetsWon: number;
  player1PointsWon: number;
  player2PointsWon: number;
}

export interface PoolRankingRow<P> {
  player: P;
  rank: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

interface Stats {
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

function computeStats<P>(
  players: readonly P[],
  matches: readonly PoolMatchResult<P>[]
): Map<P, Stats> {
  const stats = new Map<P, Stats>(
    players.map((p) => [
      p,
      { wins: 0, losses: 0, setsWon: 0, setsLost: 0, pointsWon: 0, pointsLost: 0 },
    ])
  );

  for (const m of matches) {
    const s1 = stats.get(m.player1);
    const s2 = stats.get(m.player2);
    if (!s1 || !s2) continue; // match impliquant un joueur hors du groupe considéré

    s1.setsWon += m.player1SetsWon;
    s1.setsLost += m.player2SetsWon;
    s1.pointsWon += m.player1PointsWon;
    s1.pointsLost += m.player2PointsWon;

    s2.setsWon += m.player2SetsWon;
    s2.setsLost += m.player1SetsWon;
    s2.pointsWon += m.player2PointsWon;
    s2.pointsLost += m.player1PointsWon;

    if (m.winner === m.player1) {
      s1.wins += 1;
      s2.losses += 1;
    } else {
      s2.wins += 1;
      s1.losses += 1;
    }
  }

  return stats;
}

/**
 * Classe un groupe de joueurs à égalité de victoires globales, en ne
 * considérant que les confrontations directes entre eux ("mini-classement").
 * Départage ensuite par différence de sets puis de points au sein du
 * sous-groupe, et enfin par l'ordre de tête de série initial (stable).
 */
function breakTies<P>(
  tiedPlayers: readonly P[],
  allMatches: readonly PoolMatchResult<P>[],
  initialOrderIndex: Map<P, number>
): P[] {
  if (tiedPlayers.length <= 1) return [...tiedPlayers];

  const subMatches = allMatches.filter(
    (m) => tiedPlayers.includes(m.player1) && tiedPlayers.includes(m.player2)
  );
  const miniStats = computeStats(tiedPlayers, subMatches);

  const byMiniWins = new Map<number, P[]>();
  for (const p of tiedPlayers) {
    const wins = miniStats.get(p)!.wins;
    const group = byMiniWins.get(wins) ?? [];
    group.push(p);
    byMiniWins.set(wins, group);
  }

  const sortedWinCounts = [...byMiniWins.keys()].sort((a, b) => b - a);
  const result: P[] = [];

  for (const winCount of sortedWinCounts) {
    const group = byMiniWins.get(winCount)!;
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Toujours à égalité après le mini-classement : différence de sets puis
    // de points au sein du sous-groupe, puis ordre de tête de série initial.
    const stillTied = [...group].sort((a, b) => {
      const sa = miniStats.get(a)!;
      const sb = miniStats.get(b)!;
      const diffA = sa.setsWon - sa.setsLost;
      const diffB = sb.setsWon - sb.setsLost;
      if (diffA !== diffB) return diffB - diffA;

      const ptsA = sa.pointsWon - sa.pointsLost;
      const ptsB = sb.pointsWon - sb.pointsLost;
      if (ptsA !== ptsB) return ptsB - ptsA;

      return (initialOrderIndex.get(a) ?? 0) - (initialOrderIndex.get(b) ?? 0);
    });

    result.push(...stillTied);
  }

  return result;
}

/**
 * Calcule le classement complet d'une poule.
 * `initialSeedOrder` sert uniquement de départage final déterministe
 * (ordre des têtes de série au moment de la constitution de la poule).
 */
export function rankPool<P>(
  players: readonly P[],
  matches: readonly PoolMatchResult<P>[],
  initialSeedOrder: readonly P[] = players
): PoolRankingRow<P>[] {
  const stats = computeStats(players, matches);
  const initialOrderIndex = new Map(initialSeedOrder.map((p, i) => [p, i]));

  const byWins = new Map<number, P[]>();
  for (const p of players) {
    const wins = stats.get(p)!.wins;
    const group = byWins.get(wins) ?? [];
    group.push(p);
    byWins.set(wins, group);
  }

  const sortedWinCounts = [...byWins.keys()].sort((a, b) => b - a);
  const orderedPlayers: P[] = [];

  for (const winCount of sortedWinCounts) {
    const group = byWins.get(winCount)!;
    if (group.length === 1) {
      orderedPlayers.push(group[0]);
    } else {
      orderedPlayers.push(...breakTies(group, matches, initialOrderIndex));
    }
  }

  return orderedPlayers.map((player, index) => {
    const s = stats.get(player)!;
    return {
      player,
      rank: index + 1,
      wins: s.wins,
      losses: s.losses,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      pointsWon: s.pointsWon,
      pointsLost: s.pointsLost,
    };
  });
}
