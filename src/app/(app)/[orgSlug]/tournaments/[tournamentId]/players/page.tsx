import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AddPlayerForm } from "./add-player-form";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Joueurs — {tournament.name}</h1>
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/players/import`}
          className="rounded-md border border-black/10 px-4 py-2 text-sm"
        >
          Importer un CSV
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        {players.length === 0 ? (
          <p className="text-foreground/70">Aucun joueur pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex justify-between rounded-md border border-black/10 px-4 py-2"
              >
                <span>
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-foreground/60">{p.club}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-md border border-black/10 p-4">
        <summary className="cursor-pointer font-medium">
          Ajouter un joueur manuellement
        </summary>
        <div className="mt-4">
          <AddPlayerForm orgSlug={orgSlug} tournamentId={tournamentId} />
        </div>
      </details>
    </div>
  );
}
