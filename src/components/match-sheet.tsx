export function MatchSheet({
  contextLabel,
  player1Name,
  player2Name,
  player1Club,
  player2Club,
  tableNumber,
  refereeName,
  maxSets,
  sets,
  winnerName,
  isDone,
}: {
  contextLabel: string;
  player1Name: string;
  player2Name: string;
  player1Club?: string | null;
  player2Club?: string | null;
  tableNumber: number | null;
  refereeName: string | null;
  maxSets: number;
  sets: ({ player1Points: number; player2Points: number } | null)[];
  winnerName: string | null;
  isDone: boolean;
}) {
  const rows = Array.from({ length: maxSets }, (_, i) => sets[i] ?? null);

  return (
    <div>
      <p className="mb-3 text-center text-xs font-bold tracking-widest text-navy-400 uppercase">
        {contextLabel}
      </p>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold">{player1Name}</p>
          {player1Club && <p className="text-xs text-navy-400">{player1Club}</p>}
        </div>
        <p className="text-lg font-medium text-navy-400">vs</p>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold">{player2Name}</p>
          {player2Club && <p className="text-xs text-navy-400">{player2Club}</p>}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between text-sm">
        <span>
          <span className="text-navy-400">Table : </span>
          <span className="font-semibold">{tableNumber ?? "…………"}</span>
        </span>
        <span>
          <span className="text-navy-400">Arbitre : </span>
          <span className="font-semibold">{refereeName || "………………………"}</span>
        </span>
      </div>

      <table className="w-full border-collapse text-center">
        <thead>
          <tr>
            <th className="border border-navy-950 bg-surface-muted py-2 text-xs font-semibold uppercase">
              Manche
            </th>
            {rows.map((_, i) => (
              <th key={i} className="border border-navy-950 bg-surface-muted py-2 text-xs font-semibold">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-navy-950 py-3 pl-2 text-left text-sm font-medium">
              {player1Name}
            </td>
            {rows.map((s, i) => (
              <td key={i} className="h-12 border border-navy-950 text-lg font-semibold">
                {s ? s.player1Points : ""}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-navy-950 py-3 pl-2 text-left text-sm font-medium">
              {player2Name}
            </td>
            {rows.map((s, i) => (
              <td key={i} className="h-12 border border-navy-950 text-lg font-semibold">
                {s ? s.player2Points : ""}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span>
          <span className="text-navy-400">Vainqueur : </span>
          <span className="font-semibold">{isDone ? winnerName : "………………………"}</span>
        </span>
        <span className="text-navy-400">Signature arbitre : ……………………</span>
      </div>
    </div>
  );
}
