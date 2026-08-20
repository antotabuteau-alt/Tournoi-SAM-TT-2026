import type { PublicMatch } from "@/lib/public-tournament-state";
import { cn } from "@/lib/cn";

function MatchBox({ match, dark }: { match: PublicMatch; dark: boolean }) {
  const finalScore = match.sets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ");
  const done = match.status === "DONE";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        dark ? "border-white/10 bg-white/5" : "border-border bg-surface shadow-sm"
      )}
    >
      <div className={cn(done ? "font-semibold" : "font-normal", dark ? "text-white" : "text-foreground")}>
        {match.player1Name ?? "?"}
      </div>
      <div className={cn(done ? "font-semibold" : "font-normal", dark ? "text-white" : "text-foreground")}>
        {match.player2Name ?? "?"}
      </div>
      {done && (
        <div className={cn("mt-1 text-xs", dark ? "text-navy-300" : "text-navy-400")}>{finalScore}</div>
      )}
      {match.status === "BYE" && (
        <div className={cn("mt-1 text-xs", dark ? "text-navy-400" : "text-navy-300")}>exempt</div>
      )}
    </div>
  );
}

export function BracketDisplay({
  rounds,
  dark = false,
}: {
  rounds: { round: number; matches: PublicMatch[] }[];
  dark?: boolean;
}) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rounds.map((r) => (
        <div key={r.round} className="flex w-56 shrink-0 flex-col gap-3">
          <h3
            className={cn(
              "text-xs font-semibold tracking-wide uppercase",
              dark ? "text-navy-300" : "text-navy-400"
            )}
          >
            Tour {r.round}
          </h3>
          {r.matches.map((m) => (
            <MatchBox key={m.id} match={m} dark={dark} />
          ))}
        </div>
      ))}
    </div>
  );
}
