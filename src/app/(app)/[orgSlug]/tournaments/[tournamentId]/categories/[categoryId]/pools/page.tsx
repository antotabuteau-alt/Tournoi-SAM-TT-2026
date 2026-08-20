import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";
import { PoolGenerationForm } from "./pool-generation-form";
import { PoolDndBoard } from "./pool-dnd-board";
import { ResetPoolsButton } from "./reset-pools-button";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PoolsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string; categoryId: string }>;
}) {
  const { orgSlug, tournamentId, categoryId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
    include: {
      registrations: {
        include: { player: true },
        orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
      },
      poolGroups: {
        orderBy: { name: "asc" },
        include: {
          members: { include: { registration: { include: { player: true } } } },
          matches: { include: { sets: true } },
        },
      },
    },
  });
  if (!category) notFound();

  const hasPools = category.poolGroups.length > 0;
  const hasMatches = category.poolGroups.some((g) => g.matches.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Poules — {category.name}</h1>
          <p className="text-sm text-navy-400">{category.registrations.length} inscrit(s)</p>
        </div>
        <LinkButton
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`}
          variant="outline"
          size="sm"
        >
          ← Retour à la catégorie
        </LinkButton>
      </div>

      {!hasPools && (
        <PoolGenerationForm
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          playerCount={category.registrations.length}
          poolTargetSize={category.poolTargetSize ?? 4}
        />
      )}

      {hasPools && !hasMatches && (
        <PoolDndBoard
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          poolGroups={category.poolGroups.map((g) => ({
            id: g.id,
            name: g.name,
            members: g.members.map((m) => ({
              registrationId: m.registrationId,
              name: `${m.registration.player.firstName} ${m.registration.player.lastName}`,
            })),
          }))}
          unassigned={category.registrations
            .filter(
              (r) => !category.poolGroups.some((g) => g.members.some((m) => m.registrationId === r.id))
            )
            .map((r) => ({
              registrationId: r.id,
              name: `${r.player.firstName} ${r.player.lastName}`,
            }))}
        />
      )}

      {hasMatches && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.poolGroups.map((group) => {
              const registrationIds = group.members.map((m) => m.registrationId);
              const initialSeedOrder = [...group.members]
                .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
                .map((m) => m.registrationId);
              const ranking = computePoolRanking(registrationIds, group.matches, initialSeedOrder);
              const namesById = new Map(
                group.members.map((m) => [
                  m.registrationId,
                  `${m.registration.player.firstName} ${m.registration.player.lastName}`,
                ])
              );
              const allDone = group.matches.every((m) => m.status === "DONE");

              return (
                <Card key={group.id} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold">{group.name}</h2>
                    {allDone ? (
                      <Badge variant="success">Terminée</Badge>
                    ) : (
                      <Link
                        href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools/${group.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Saisir les scores →
                      </Link>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {ranking.map((row) => (
                        <tr key={row.player} className="border-t border-border">
                          <td className="py-1.5 pr-2 text-navy-400">{row.rank}</td>
                          <td className="py-1.5 font-medium">{namesById.get(row.player)}</td>
                          <td className="py-1.5 text-right text-navy-400">
                            {row.wins}V-{row.losses}D
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })}
          </div>
          <ResetPoolsButton orgSlug={orgSlug} tournamentId={tournamentId} categoryId={categoryId} />
        </div>
      )}
    </div>
  );
}
