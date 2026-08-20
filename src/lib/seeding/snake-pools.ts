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
