import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { MatchScoreForm } from "../../match-score-form";

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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{poolGroup.name}</h1>
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`}
          className="text-sm hover:underline"
        >
          Retour aux poules
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {poolGroup.matches.map((m) => (
          <MatchScoreForm
            key={m.id}
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            categoryId={categoryId}
            matchId={m.id}
            kind="pool"
            bestOfSets={category.bestOfSets}
            player1Name={`${m.player1?.player.firstName} ${m.player1?.player.lastName}`}
            player2Name={`${m.player2?.player.firstName} ${m.player2?.player.lastName}`}
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
    </div>
  );
}
