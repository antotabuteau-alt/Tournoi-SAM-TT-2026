import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AddPlayerForm } from "./add-player-form";
import { GenerateTestPlayersButton } from "./generate-test-players-button";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
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
  });

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">📝 Inscriptions / Joueurs</h2>
            <p className="text-sm text-navy-400">{players.length} joueur(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <GenerateTestPlayersButton orgSlug={orgSlug} tournamentId={tournamentId} />
            <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players/import`} variant="outline">
              📄 Importer un CSV
            </LinkButton>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-4">
            {players.length === 0 ? (
              <p className="py-6 text-center text-sm text-navy-400">Aucun joueur pour le moment.</p>
            ) : (
              <ul className="grid gap-x-4 sm:grid-cols-2">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
                  >
                    <span>
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="truncate text-xs text-navy-400">{p.club}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-navy-400 uppercase">
              Ajouter un joueur
            </h2>
            <AddPlayerForm orgSlug={orgSlug} tournamentId={tournamentId} />
          </Card>
        </div>
      </div>
    </div>
  );
}
