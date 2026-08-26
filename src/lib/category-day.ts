export type CategoryDay = "SATURDAY" | "SUNDAY" | "OTHER";

// Jour de la semaine dérivé de scheduledAt en lisant les chiffres "muraux"
// (getUTCDay), cohérent avec le reste de l'app qui ne fait jamais de vraie
// conversion de fuseau horaire sur ces dates de tableau.
export function categoryDay(scheduledAt: Date | string | null): CategoryDay {
  if (!scheduledAt) return "OTHER";
  const d = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const day = d.getUTCDay();
  if (day === 6) return "SATURDAY";
  if (day === 0) return "SUNDAY";
  return "OTHER";
}

// Samedi et dimanche du week-end contenant `anchor` (ex: la date principale
// du tournoi), pour proposer un choix rapide "Samedi"/"Dimanche" à la
// création d'un tableau sans obliger à ressaisir une date complète.
export function weekendDatesOf(anchor: Date): { saturday: Date; sunday: Date } {
  const base = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
  const day = anchor.getUTCDay();
  const satOffsetDays = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
  const saturday = new Date(base + satOffsetDays * 86_400_000);
  const sunday = new Date(saturday.getTime() + 86_400_000);
  return { saturday, sunday };
}

export function formatShortWallClockDate(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}
