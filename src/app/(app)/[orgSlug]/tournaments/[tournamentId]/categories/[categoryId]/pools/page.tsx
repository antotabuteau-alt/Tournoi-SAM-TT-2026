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
import { cn } from "@/lib/cn";

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
          <div className="grid gap-4 lg:grid-cols-2">
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
              const doneCount = group.matches.filter((m) => m.status === "DONE").length;
              const allDone = doneCount === group.matches.length;

              return (
                <Card key={group.id} className="overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{group.name}</h2>
                      <span className="text-xs text-navy-400">
                        {doneCount}/{group.matches.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allDone && <Badge variant="success">Terminée</Badge>}
                      <Link
                        href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools/${group.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Saisir les scores →
                      </Link>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <tbody>
                      {ranking.map((row) => (
                        <tr key={row.player} className="border-b border-border last:border-0">
                          <td className="w-6 py-1.5 pl-4 text-navy-400">{row.rank}</td>
                          <td className="py-1.5 font-medium">{namesById.get(row.player)}</td>
                          <td className="py-1.5 pr-4 text-right text-navy-400">
                            {row.wins}V-{row.losses}D
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-col gap-1 border-t border-border p-3">
                    {group.matches.map((m) => {
                      const p1 = namesById.get(m.player1Id ?? "") ?? "?";
                      const p2 = namesById.get(m.player2Id ?? "") ?? "?";
                      const done = m.status === "DONE";
                      const score = m.sets
                        .sort((a, b) => a.setNumber - b.setNumber)
                        .map((s) => `${s.player1Points}-${s.player2Points}`)
                        .join(", ");
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex items-center justify-between rounded-md px-2 py-1.5 text-xs",
                            done ? "bg-success-50" : "bg-surface-muted"
                          )}
                        >
                          <span className="truncate">
                            {p1} <span className="text-navy-400">vs</span> {p2}
                          </span>
                          <span className={cn("shrink-0 pl-2", done ? "font-semibold text-success-600" : "text-navy-400")}>
                            {done ? score : "à jouer"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
