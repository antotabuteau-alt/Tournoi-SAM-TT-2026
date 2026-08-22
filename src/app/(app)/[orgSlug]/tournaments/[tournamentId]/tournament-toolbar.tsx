import Link from "next/link";

export function TournamentToolbar({
  orgSlug,
  tournamentId,
  tournamentName,
}: {
  orgSlug: string;
  tournamentId: string;
  tournamentName: string;
  publicSlug?: string;
}) {
  const base = `/${orgSlug}/tournaments/${tournamentId}`;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`${base}/settings`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          ⚙ Paramètres salle
        </Link>
        <a
          href={`/api/tournaments/${tournamentId}/export`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          💾 Sauvegarder
        </a>
      </div>

      <h1 className="mx-2 flex-1 truncate text-lg font-bold">{tournamentName}</h1>

      <div className="flex items-center gap-2">
        <Link
          href={`${base}/qrcode`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-muted"
          title="QR code"
        >
          📶
        </Link>
      </div>
    </div>
  );
}
