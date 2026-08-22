import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { BracketBoard } from "./bracket-board";
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
        <BracketBoard
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          bestOfSets={category.bestOfSets}
          matches={category.bracket.matches.map((m) => ({
            id: m.id,
            round: m.round ?? 0,
            player1Id: m.player1Id,
            player2Id: m.player2Id,
            player1Name: m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : "",
            player2Name: m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : "",
            status: m.status,
            refereeName: m.refereeName,
            sets: m.sets.map((s) => ({
              player1Points: s.player1Points,
              player2Points: s.player2Points,
            })),
          }))}
        />
      )}
    </div>
  );
}
