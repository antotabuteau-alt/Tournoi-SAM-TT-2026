import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { MatchSheet } from "@/components/match-sheet";
import { PrintTrigger } from "./print-trigger";

export default async function PoolMatchesPrintPage({
  params,
}: {
  params: Promise<{
    orgSlug: string;
    tournamentId: string;
    categoryId: string;
    poolGroupId: string;
  }>;
}) {
  const { orgSlug, tournamentId, categoryId, poolGroupId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const poolGroup = await prisma.poolGroup.findFirst({
    where: {
      id: poolGroupId,
      categoryId,
      category: { organizationId: organization.id, tournamentId },
    },
    include: {
      category: { include: { tournament: { select: { name: true } } } },
      matches: {
        orderBy: { createdAt: "asc" },
        include: {
          player1: { include: { player: true } },
          player2: { include: { player: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });
  if (!poolGroup) notFound();

  const bestOfSets = poolGroup.category.bestOfSets;
  const maxSets = bestOfSets * 2 - 1;

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 print:px-0 print:py-0">
      <PrintTrigger />

      {poolGroup.matches.length === 0 && (
        <p className="text-navy-400">Aucun match généré pour cette poule.</p>
      )}

      {poolGroup.matches.map((match, i) => {
        const player1Name = match.player1
          ? `${match.player1.player.firstName} ${match.player1.player.lastName}`
          : "?";
        const player2Name = match.player2
          ? `${match.player2.player.firstName} ${match.player2.player.lastName}`
          : "?";

        return (
          <div key={match.id} className={i > 0 ? "break-before-page" : undefined}>
            <div className="mb-6 flex items-baseline justify-between border-b-2 border-navy-950 pb-3">
              <div>
                <h1 className="text-lg font-bold">{poolGroup.category.tournament.name}</h1>
                <p className="text-sm text-navy-400">
                  {poolGroup.category.name} — {poolGroup.name}
                </p>
              </div>
              <p className="text-xs text-navy-400">{new Date().toLocaleDateString("fr-FR")}</p>
            </div>

            <MatchSheet
              contextLabel={`Feuille de match — ${i + 1} / ${poolGroup.matches.length}`}
              player1Name={player1Name}
              player2Name={player2Name}
              player1Club={match.player1?.player.club}
              player2Club={match.player2?.player.club}
              tableNumber={match.tableNumber}
              refereeName={match.refereeName}
              maxSets={maxSets}
              sets={match.sets}
              isDone={match.status === "DONE"}
              winnerName={match.winnerId === match.player1Id ? player1Name : player2Name}
            />
          </div>
        );
      })}
    </div>
  );
}
