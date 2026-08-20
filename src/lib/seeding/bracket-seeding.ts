/** Plus petite puissance de 2 supérieure ou égale à n. */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Ordre de positionnement standard d'un tableau à élimination directe de
 * taille `drawSize` (puissance de 2), en rangs de tête de série (1 = meilleur).
 * Garantit que les meilleures têtes de série ne peuvent se rencontrer qu'au
 * tour le plus tardif possible. Résultat : liste ordonnée des rangs, position
 * par position dans le tableau (ex: [1, 4, 2, 3] pour drawSize=4).
 */
export function seedPositions(drawSize: number): number[] {
  if (drawSize < 1 || (drawSize & (drawSize - 1)) !== 0) {
    throw new Error("drawSize must be a power of 2");
  }
  if (drawSize === 1) return [1];

  const previous = seedPositions(drawSize / 2);
  const result: number[] = [];
  for (const seed of previous) {
    result.push(seed);
    result.push(drawSize + 1 - seed);
  }
  return result;
}

export interface BracketSlot<T> {
  position: number; // 0-indexed, position dans le premier tour
  player: T | null; // null = BYE
}

/**
 * Place les qualifiés (triés par rang, index 0 = meilleur) dans un tableau de
 * taille `drawSize`, en laissant des BYE (null) sur les positions excédentaires.
 * Les BYE sont automatiquement positionnés face aux meilleures têtes de série
 * grâce à `seedPositions`.
 */
export function seedBracket<T>(
  rankedPlayers: readonly T[],
  drawSize: number
): BracketSlot<T>[] {
  if (rankedPlayers.length > drawSize) {
    throw new Error("drawSize is smaller than the number of players");
  }
  const order = seedPositions(drawSize);
  return order.map((seed, position) => ({
    position,
    player: seed <= rankedPlayers.length ? rankedPlayers[seed - 1] : null,
  }));
}
