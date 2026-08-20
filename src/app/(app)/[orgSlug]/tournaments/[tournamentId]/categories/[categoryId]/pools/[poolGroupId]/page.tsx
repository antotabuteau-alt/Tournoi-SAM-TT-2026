import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PoolScoreBoard } from "./pool-score-board";
import { LinkButton } from "@/components/ui/link-button";

export default async function PoolMatchesPage({
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

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
  });
  if (!category) notFound();

  const poolGroup = await prisma.poolGroup.findFirst({
    where: { id: poolGroupId, categoryId, category: { organizationId: organization.id } },
    include: {
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{poolGroup.name}</h1>
        <LinkButton
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`}
          variant="outline"
          size="sm"
        >
          ← Retour aux poules
        </LinkButton>
      </div>

      <PoolScoreBoard
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        poolGroupName={poolGroup.name}
        bestOfSets={category.bestOfSets}
        matches={poolGroup.matches.map((m) => ({
          id: m.id,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          player1Name: m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : "?",
          player2Name: m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : "?",
          status: m.status,
          refereeName: m.refereeName,
          sets: m.sets.map((s) => ({ player1Points: s.player1Points, player2Points: s.player2Points })),
        }))}
      />
    </div>
  );
}
