/**
 * Répartition "en serpent" (boustrophédon) d'une liste de joueurs déjà triés
 * par tête de série (index 0 = meilleur joueur) dans `poolCount` poules.
 * Ordre classique : poule 1,2,3,4, puis 4,3,2,1, puis 1,2,3,4, ...
 * — pour éviter que les meilleurs joueurs se retrouvent tous dans la même poule.
 */
export function generateSnakePools<T>(
  sortedPlayers: readonly T[],
  poolCount: number
): T[][] {
  if (poolCount <= 0) {
    throw new Error("poolCount must be greater than 0");
  }

  const pools: T[][] = Array.from({ length: poolCount }, () => []);
  let poolIndex = 0;
  let direction = 1;

  for (const player of sortedPlayers) {
    pools[poolIndex].push(player);
    poolIndex += direction;
    if (poolIndex === poolCount) {
      poolIndex = poolCount - 1;
      direction = -1;
    } else if (poolIndex === -1) {
      poolIndex = 0;
      direction = 1;
    }
  }

  return pools;
}

/** Nombre de poules recommandé pour atteindre une taille cible par poule. */
export function computePoolCount(
  playerCount: number,
  targetPoolSize: number
): number {
  if (targetPoolSize <= 0) throw new Error("targetPoolSize must be > 0");
  return Math.max(1, Math.ceil(playerCount / targetPoolSize));
}

function countClubConflicts<T>(pool: T[], clubOf: (item: T) => string | null | undefined): number {
  const counts = new Map<string, number>();
  let conflicts = 0;
  for (const item of pool) {
    const club = clubOf(item);
    if (!club) continue;
    const next = (counts.get(club) ?? 0) + 1;
    counts.set(club, next);
    if (next > 1) conflicts++;
  }
  return conflicts;
}

/**
 * Passe d'optimisation gloutonne : échange des joueurs entre poules (par
 * paires) tant qu'un échange réduit strictement le nombre de joueurs d'un
 * même club dans une même poule, sans jamais dégrader le total. Ne
 * garantit pas un optimum global mais élimine la grande majorité des
 * doublons de club en pratique, sans casser le tri par tête de série plus
 * que nécessaire (un échange n'est conservé que s'il aide).
 */
export function avoidSameClubCollisions<T>(
  pools: readonly T[][],
  clubOf: (item: T) => string | null | undefined
): T[][] {
  const result = pools.map((pool) => [...pool]);
  const maxIterations = 500;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let swapped = false;

    outer: for (let a = 0; a < result.length; a++) {
      for (let i = 0; i < result[a].length; i++) {
        const clubA = clubOf(result[a][i]);
        if (!clubA) continue;
        const sameClubInA = result[a].filter((x) => clubOf(x) === clubA).length;
        if (sameClubInA <= 1) continue;

        for (let b = 0; b < result.length; b++) {
          if (b === a) continue;
          for (let j = 0; j < result[b].length; j++) {
            const clubB = clubOf(result[b][j]);
            if (clubB === clubA) continue;

            const before = countClubConflicts(result[a], clubOf) + countClubConflicts(result[b], clubOf);
            [result[a][i], result[b][j]] = [result[b][j], result[a][i]];
            const after = countClubConflicts(result[a], clubOf) + countClubConflicts(result[b], clubOf);

            if (after < before) {
              swapped = true;
              break outer;
            }
            [result[a][i], result[b][j]] = [result[b][j], result[a][i]];
          }
        }
      }
    }

    if (!swapped) break;
  }

  return result;
}
