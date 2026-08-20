import type { PublicMatch } from "@/lib/public-tournament-state";
import { cn } from "@/lib/cn";

const CARD_HEIGHT = 84; // px — doit rester cohérent avec la taille réelle de MatchBox
const ROUND_WIDTH = 208; // px
const CONNECTOR_WIDTH = 28; // px

function roundLabel(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundIndex;
  if (fromEnd === 1) return "Finale";
  if (fromEnd === 2) return "1/2 finale";
  if (fromEnd === 3) return "1/4 finale";
  if (fromEnd === 4) return "1/8 finale";
  return `Tour ${roundIndex + 1}`;
}

function MatchBox({ match, dark }: { match: PublicMatch; dark: boolean }) {
  const finalScore = match.sets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ");
  const done = match.status === "DONE";
  const p1Won = done && match.sets.length > 0 &&
    match.sets.filter((s) => s.player1Points > s.player2Points).length >
      match.sets.filter((s) => s.player2Points > s.player1Points).length;

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-0.5 rounded-lg border px-3 py-2 text-sm leading-tight",
        dark ? "border-white/10 bg-white/5" : "border-border bg-surface shadow-sm"
      )}
      style={{ height: CARD_HEIGHT - 10 }}
    >
      <div
        className={cn(
          "truncate",
          done && p1Won ? "font-bold" : "font-normal",
          dark ? "text-white" : "text-foreground"
        )}
      >
        {match.player1Name ?? <span className={dark ? "text-navy-400" : "text-navy-300"}>—</span>}
      </div>
      <div
        className={cn(
          "truncate",
          done && !p1Won ? "font-bold" : "font-normal",
          dark ? "text-white" : "text-foreground"
        )}
      >
        {match.player2Name ?? <span className={dark ? "text-navy-400" : "text-navy-300"}>—</span>}
      </div>
      {done && (
        <div className={cn("text-[11px]", dark ? "text-navy-300" : "text-navy-400")}>
          {finalScore}
        </div>
      )}
      {match.status === "BYE" && (
        <div className={cn("text-[11px]", dark ? "text-navy-400" : "text-navy-300")}>exempt</div>
      )}
    </div>
  );
}

function Connectors({
  pairCount,
  totalHeight,
  dark,
}: {
  pairCount: number;
  totalHeight: number;
  dark: boolean;
}) {
  const lineColor = dark ? "border-white/20" : "border-navy-300";
  return (
    <div className="flex flex-col justify-around shrink-0" style={{ height: totalHeight, width: CONNECTOR_WIDTH }}>
      {Array.from({ length: pairCount }, (_, i) => (
        <div key={i} className="flex flex-1 flex-col">
          <div className={cn("flex-1 border-t-2 border-r-2 rounded-tr-md", lineColor)} />
          <div className={cn("flex-1 border-b-2 border-r-2 rounded-br-md", lineColor)} />
        </div>
      ))}
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
  const sortedRounds = [...rounds].sort((a, b) => a.round - b.round);
  const round1Count = sortedRounds[0]?.matches.length ?? 0;
  const totalHeight = round1Count * CARD_HEIGHT;

  if (round1Count === 0) return null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex" style={{ minWidth: sortedRounds.length * (ROUND_WIDTH + CONNECTOR_WIDTH) }}>
        {sortedRounds.map((r, ri) => (
          <div key={r.round} className="flex shrink-0">
            <div className="flex flex-col" style={{ width: ROUND_WIDTH }}>
              <h3
                className={cn(
                  "mb-2 text-xs font-semibold tracking-wide uppercase",
                  dark ? "text-navy-300" : "text-navy-400"
                )}
              >
                {roundLabel(ri, sortedRounds.length)}
              </h3>
              <div className="flex flex-1 flex-col justify-around" style={{ height: totalHeight }}>
                {r.matches.map((m) => (
                  <MatchBox key={m.id} match={m} dark={dark} />
                ))}
              </div>
            </div>
            {ri < sortedRounds.length - 1 && (
              <div className="mt-6">
                <Connectors pairCount={r.matches.length / 2} totalHeight={totalHeight} dark={dark} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
