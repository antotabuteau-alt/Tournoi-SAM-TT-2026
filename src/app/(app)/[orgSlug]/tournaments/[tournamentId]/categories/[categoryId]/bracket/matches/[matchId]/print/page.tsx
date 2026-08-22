import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PrintTrigger } from "./print-trigger";

export default async function BracketMatchPrintPage({
  params,
}: {
  params: Promise<{
    orgSlug: string;
    tournamentId: string;
    categoryId: string;
    matchId: string;
  }>;
}) {
  const { orgSlug, tournamentId, categoryId, matchId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      organizationId: organization.id,
      bracket: { categoryId, category: { tournamentId } },
    },
    include: {
      player1: { include: { player: true } },
      player2: { include: { player: true } },
      bracket: {
        include: { category: { include: { tournament: { select: { name: true } } } } },
      },
      sets: { orderBy: { setNumber: "asc" } },
    },
  });
  if (!match) notFound();

  const bestOfSets = match.bracket?.category.bestOfSets ?? 3;
  const maxSets = bestOfSets * 2 - 1;
  const rows = Array.from({ length: maxSets }, (_, i) => match.sets[i] ?? null);

  const player1Name = match.player1
    ? `${match.player1.player.firstName} ${match.player1.player.lastName}`
    : "?";
  const player2Name = match.player2
    ? `${match.player2.player.firstName} ${match.player2.player.lastName}`
    : "?";
  const player1Club = match.player1?.player.club;
  const player2Club = match.player2?.player.club;

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 print:px-0 print:py-0">
      <PrintTrigger />
      <div className="mb-6 flex items-baseline justify-between border-b-2 border-navy-950 pb-3">
        <div>
          <h1 className="text-lg font-bold">{match.bracket?.category.tournament.name}</h1>
          <p className="text-sm text-navy-400">
            {match.bracket?.category.name} — Tour {match.round}
          </p>
        </div>
        <p className="text-xs text-navy-400">{new Date().toLocaleDateString("fr-FR")}</p>
      </div>

      <p className="mb-4 text-center text-xs font-bold tracking-widest text-navy-400 uppercase">
        Feuille de match
      </p>

      <div className="mb-6 flex items-center justify-between gap-4">
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

      <div className="mb-6 flex items-center justify-between text-sm">
        <span>
          <span className="text-navy-400">Table : </span>
          <span className="font-semibold">
            {match.tableNumber ?? "…………"}
          </span>
        </span>
        <span>
          <span className="text-navy-400">Arbitre : </span>
          <span className="font-semibold">{match.refereeName || "………………………"}</span>
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
            <td className="border border-navy-950 py-4 pl-2 text-left text-sm font-medium">
              {player1Name}
            </td>
            {rows.map((s, i) => (
              <td key={i} className="h-14 border border-navy-950 text-lg font-semibold">
                {s ? s.player1Points : ""}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-navy-950 py-4 pl-2 text-left text-sm font-medium">
              {player2Name}
            </td>
            {rows.map((s, i) => (
              <td key={i} className="h-14 border border-navy-950 text-lg font-semibold">
                {s ? s.player2Points : ""}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span>
          <span className="text-navy-400">Vainqueur : </span>
          <span className="font-semibold">
            {match.status === "DONE"
              ? match.winnerId === match.player1Id
                ? player1Name
                : player2Name
              : "………………………"}
          </span>
        </span>
        <span className="text-navy-400">Signature arbitre : ……………………</span>
      </div>
    </div>
  );
}
