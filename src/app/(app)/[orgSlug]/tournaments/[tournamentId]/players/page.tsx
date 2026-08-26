import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AddPlayerForm } from "./add-player-form";
import { PlayersPageClient } from "./players-page-client";
import { TournamentToolbar } from "../tournament-toolbar";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string }>;
}) {
  const { orgSlug, tournamentId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
  });
  if (!tournament) notFound();

  const players = await prisma.player.findMany({
    where: { tournamentId, organizationId: organization.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      registrations: {
        include: {
          category: { select: { name: true } },
          matchesAsP1: { where: { status: "SCHEDULED", player2Id: { not: null } }, select: { id: true } },
          matchesAsP2: { where: { status: "SCHEDULED", player1Id: { not: null } }, select: { id: true } },
        },
      },
    },
  });

  const playerRows = players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    club: p.club,
    checkedInAt: p.checkedInAt,
    conflictCategories: p.registrations
      .filter((r) => r.matchesAsP1.length > 0 || r.matchesAsP2.length > 0)
      .map((r) => r.category.name),
  }));
  for (const row of playerRows) {
    if (row.conflictCategories.length < 2) row.conflictCategories = [];
  }

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-8">
        <PlayersPageClient
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          initialPlayers={playerRows}
          addPlayerForm={<AddPlayerForm orgSlug={orgSlug} tournamentId={tournamentId} />}
        />
      </div>
    </div>
  );
}
