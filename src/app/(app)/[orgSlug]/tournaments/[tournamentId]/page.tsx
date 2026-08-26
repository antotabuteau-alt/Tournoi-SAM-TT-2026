import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TournamentToolbar } from "./tournament-toolbar";
import { CategoryCardsList } from "./category-cards-list";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string }>;
}) {
  const { orgSlug, tournamentId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
    include: {
      categories: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { registrations: true } },
          registrations: {
            orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
            include: { player: { select: { id: true, firstName: true, lastName: true, rankingPoints: true } } },
          },
        },
      },
      _count: { select: { players: true } },
    },
  });
  if (!tournament) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="flex flex-col gap-3">
          <CategoryCardsList
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            tournamentDate={tournament.date}
            playerCount={tournament._count.players}
            categories={tournament.categories.map((c) => ({
              id: c.id,
              name: c.name,
              format: c.format,
              status: c.status,
              scheduledAt: c.scheduledAt,
              bracketType: c.bracketType,
              poolQualifiersCount: c.poolQualifiersCount,
              repechage: c.repechage,
              poolCount: c.poolCount,
              tableRangeStart: c.tableRangeStart,
              tableRangeEnd: c.tableRangeEnd,
              registrationCount: c._count.registrations,
              registeredPlayers: c.registrations.map((r) => ({
                id: r.player.id,
                firstName: r.player.firstName,
                lastName: r.player.lastName,
                rankingPoints: r.player.rankingPoints,
              })),
            }))}
          />
        </section>
      </div>
    </div>
  );
}
