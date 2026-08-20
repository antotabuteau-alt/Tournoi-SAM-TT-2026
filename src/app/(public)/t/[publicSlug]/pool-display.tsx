import type { PublicPool } from "@/lib/public-tournament-state";

export function PoolDisplay({ pool }: { pool: PublicPool }) {
  return (
    <div className="rounded-md border border-black/10 p-4">
      <h3 className="mb-2 font-semibold">{pool.name}</h3>
      <table className="w-full text-sm">
        <tbody>
          {pool.ranking.map((row) => (
            <tr key={row.playerName} className="border-t border-black/5">
              <td className="py-1 pr-2 text-foreground/50">{row.rank}</td>
              <td className="py-1">{row.playerName}</td>
              <td className="py-1 text-right text-foreground/60">
                {row.wins}V-{row.losses}D
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
