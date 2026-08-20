export function categoryCta(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  status: string,
  format: string,
  registrationCount: number
): { label: string; href: string } {
  const base = `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`;
  if (registrationCount === 0) return { label: "Ajouter des joueurs", href: base };
  if (format === "DIRECT_BRACKET") {
    if (status === "BRACKET_IN_PROGRESS") return { label: "Saisir les finales →", href: `${base}/bracket` };
    if (status === "FINISHED") return { label: "Voir le classement →", href: `${base}/bracket` };
    return { label: "Générer le tableau final →", href: `${base}/bracket` };
  }
  if (status === "DRAFT") return { label: "Générer les poules →", href: `${base}/pools` };
  if (status === "POOLS_IN_PROGRESS") return { label: "Saisir les poules →", href: `${base}/pools` };
  if (format === "POOLS_ONLY") return { label: "Voir les résultats →", href: `${base}/pools` };
  if (status === "POOLS_DONE") return { label: "Générer le tableau final →", href: `${base}/bracket` };
  if (status === "BRACKET_IN_PROGRESS") return { label: "Saisir les finales →", href: `${base}/bracket` };
  return { label: "Voir le classement →", href: `${base}/bracket` };
}
