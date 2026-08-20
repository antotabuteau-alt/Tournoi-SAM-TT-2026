import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { MatchScoreForm } from "../match-score-form";
import { GenerateBracketButton } from "./generate-bracket-button";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string; categoryId: string }>;
}) {
  const { orgSlug, tournamentId, categoryId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
    include: {
      bracket: {
        include: {
          matches: {
            include: {
              player1: { include: { player: true } },
              player2: { include: { player: true } },
              sets: { orderBy: { setNumber: "asc" } },
            },
            orderBy: [{ round: "asc" }, { position: "asc" }],
          },
        },
      },
    },
  });
  if (!category) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau final — {category.name}</h1>
        <LinkButton
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`}
          variant="outline"
          size="sm"
        >
          ← Retour à la catégorie
        </LinkButton>
      </div>

      {!category.bracket ? (
        <Card className="px-6 py-10 text-center">
          <GenerateBracketButton
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            categoryId={categoryId}
          />
        </Card>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {Object.entries(
            Object.groupBy(category.bracket.matches, (m) => m.round ?? 0)
          ).map(([round, matches]) => (
            <div key={round} className="flex w-72 shrink-0 flex-col gap-3">
              <h2 className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
                Tour {round}
              </h2>
              {matches?.map((m) => (
                <MatchScoreForm
                  key={m.id}
                  orgSlug={orgSlug}
                  tournamentId={tournamentId}
                  categoryId={categoryId}
                  matchId={m.id}
                  kind="bracket"
                  bestOfSets={category.bestOfSets}
                  player1Name={
                    m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : ""
                  }
                  player2Name={
                    m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : ""
                  }
                  status={m.status}
                  winnerId={m.winnerId}
                  player1Id={m.player1Id}
                  player2Id={m.player2Id}
                  tableNumber={m.tableNumber}
                  refereeName={m.refereeName}
                  existingSets={m.sets.map((s) => ({
                    player1Points: s.player1Points,
                    player2Points: s.player2Points,
                  }))}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
