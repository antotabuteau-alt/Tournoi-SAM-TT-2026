import { notFound } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./category-form";
import { StatTile } from "@/components/ui/stat-tile";
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
        include: { _count: { select: { registrations: true } } },
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <StatTile label="Joueurs" value={tournament._count.players} />
            <StatTile label="Tableaux" value={tournament.categories.length} />
            <StatTile
              label="Terminés"
              value={tournament.categories.filter((c) => c.status === "FINISHED").length}
            />
          </div>
          <Link
            href={`/${orgSlug}/tournaments/${tournamentId}/players`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            📝 Joueurs du tournoi
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <CategoryCardsList
            orgSlug={orgSlug}
            tournamentId={tournamentId}
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
            }))}
          />

          <details className="group rounded-2xl border border-dashed border-border bg-surface-muted p-4">
            <summary className="cursor-pointer font-medium text-brand-600">
              + Ajouter une catégorie
            </summary>
            <div className="mt-4">
              <CategoryForm orgSlug={orgSlug} tournamentId={tournamentId} />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
