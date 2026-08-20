// Les horaires de tableau sont saisis et affichés comme des heures "murales"
// (heure de la salle, en France) sans jamais passer par une conversion de
// fuseau horaire : on stocke/relit toujours les mêmes chiffres via UTC pour
// éviter toute dérive entre la saisie (navigateur, souvent en heure locale
// française) et le rendu (serveur Vercel, en UTC).

export function wallClockDateInput(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function wallClockTimeInput(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function formatWallClockDateTime(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} à ${h}h${m}`;
}

// Date/heure locale du navigateur (heure française pour nos utilisateurs),
// formatée comme une heure "murale" pour préremplir les champs.
export function nowAsWallClockDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowAsWallClockTimeInput(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
