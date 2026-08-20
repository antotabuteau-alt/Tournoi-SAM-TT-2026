import type { PublicPool } from "@/lib/public-tournament-state";
import { cn } from "@/lib/cn";

export function PoolDisplay({ pool, dark = false }: { pool: PublicPool; dark?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        dark ? "border-white/10 bg-white/5" : "border-border bg-surface shadow-sm"
      )}
    >
      <h3 className={cn("mb-2 font-semibold", dark ? "text-white" : "text-foreground")}>
        {pool.name}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {pool.ranking.map((row) => (
            <tr
              key={row.playerName}
              className={cn("border-t", dark ? "border-white/10" : "border-border")}
            >
              <td className={cn("py-1.5 pr-2", dark ? "text-navy-300" : "text-navy-400")}>
                {row.rank}
              </td>
              <td className={cn("py-1.5 font-medium", dark ? "text-white" : "text-foreground")}>
                {row.playerName}
              </td>
              <td className={cn("py-1.5 text-right", dark ? "text-navy-300" : "text-navy-400")}>
                {row.wins}V-{row.losses}D
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
