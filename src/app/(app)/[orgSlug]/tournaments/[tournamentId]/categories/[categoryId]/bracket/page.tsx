import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { MatchScoreForm } from "../match-score-form";
import { GenerateBracketButton } from "./generate-bracket-button";

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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau final — {category.name}</h1>
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`}
          className="text-sm hover:underline"
        >
          Retour à la catégorie
        </Link>
      </div>

      {!category.bracket ? (
        <GenerateBracketButton
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
        />
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-4">
          {Object.entries(
            Object.groupBy(category.bracket.matches, (m) => m.round ?? 0)
          ).map(([round, matches]) => (
            <div key={round} className="flex w-64 shrink-0 flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground/70">
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
