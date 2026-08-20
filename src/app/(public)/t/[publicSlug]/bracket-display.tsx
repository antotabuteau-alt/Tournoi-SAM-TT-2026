import type { PublicMatch } from "@/lib/public-tournament-state";

function MatchBox({ match }: { match: PublicMatch }) {
  const finalScore = match.sets
    .map((s) => `${s.player1Points}-${s.player2Points}`)
    .join(", ");

  return (
    <div className="rounded-md border border-black/10 px-3 py-2 text-sm">
      <div className={match.status === "DONE" ? "font-medium" : ""}>
        {match.player1Name ?? "?"}
      </div>
      <div className={match.status === "DONE" ? "font-medium" : ""}>
        {match.player2Name ?? "?"}
      </div>
      {match.status === "DONE" && (
        <div className="mt-1 text-xs text-foreground/50">{finalScore}</div>
      )}
      {match.status === "BYE" && (
        <div className="mt-1 text-xs text-foreground/40">exempt</div>
      )}
    </div>
  );
}

export function BracketDisplay({
  rounds,
}: {
  rounds: { round: number; matches: PublicMatch[] }[];
}) {
  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {rounds.map((r) => (
        <div key={r.round} className="flex w-56 shrink-0 flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground/70">
            Tour {r.round}
          </h3>
          {r.matches.map((m) => (
            <MatchBox key={m.id} match={m} />
          ))}
        </div>
      ))}
    </div>
  );
}
