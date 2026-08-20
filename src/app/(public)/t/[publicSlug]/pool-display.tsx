import type { PublicPool } from "@/lib/public-tournament-state";
import { cn } from "@/lib/cn";

export function PoolDisplay({ pool, dark = false }: { pool: PublicPool; dark?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        dark ? "border-white/10 bg-white/5" : "border-border bg-surface shadow-sm"
      )}
    >
      <h3
        className={cn(
          "px-4 py-2.5 font-semibold",
          dark ? "border-b border-white/10 text-white" : "border-b border-border text-foreground"
        )}
      >
        {pool.name}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {pool.ranking.map((row) => (
            <tr
              key={row.playerName}
              className={cn("border-b last:border-0", dark ? "border-white/10" : "border-border")}
            >
              <td className={cn("w-6 py-1.5 pl-4", dark ? "text-navy-300" : "text-navy-400")}>
                {row.rank}
              </td>
              <td className={cn("py-1.5 font-medium", dark ? "text-white" : "text-foreground")}>
                {row.playerName}
              </td>
              <td className={cn("py-1.5 pr-4 text-right", dark ? "text-navy-300" : "text-navy-400")}>
                {row.wins}V-{row.losses}D
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pool.matches.length > 0 && (
        <div className={cn("flex flex-col gap-1 p-3", dark ? "border-t border-white/10" : "border-t border-border")}>
          {pool.matches.map((m) => {
            const done = m.status === "DONE";
            const score = m.sets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ");
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-xs",
                  done ? (dark ? "bg-success-500/10" : "bg-success-50") : dark ? "bg-white/5" : "bg-surface-muted"
                )}
              >
                <span className={cn("truncate", dark ? "text-navy-200" : "text-foreground")}>
                  {m.player1Name} <span className="text-navy-400">vs</span> {m.player2Name}
                </span>
                <span
                  className={cn(
                    "shrink-0 pl-2",
                    done ? "font-semibold text-success-600" : "text-navy-400"
                  )}
                >
                  {done ? score : "à jouer"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
