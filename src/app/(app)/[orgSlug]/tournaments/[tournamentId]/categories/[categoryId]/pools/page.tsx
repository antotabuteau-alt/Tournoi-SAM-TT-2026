import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";
import { PoolGenerationForm } from "./pool-generation-form";
import { PoolDndBoard } from "./pool-dnd-board";
import { ResetPoolsButton } from "./reset-pools-button";
import { AllPoolsBoard } from "./all-pools-board";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/cn";

export default async function PoolsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string; categoryId: string }>;
}) {
  const { orgSlug, tournamentId, categoryId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const [category, tournamentCategories] = await Promise.all([
    prisma.category.findFirst({
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
            matches: {
            orderBy: { createdAt: "asc" },
            include: {
              player1: { include: { player: true } },
              player2: { include: { player: true } },
              sets: { orderBy: { setNumber: "asc" } },
            },
          },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { tournamentId, organizationId: organization.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
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

      {tournamentCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {tournamentCategories.map((c) => (
            <Link
              key={c.id}
              href={`/${orgSlug}/tournaments/${tournamentId}/categories/${c.id}/pools`}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                c.id === categoryId
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-border text-navy-400 hover:bg-surface-muted"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

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
          <AllPoolsBoard
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            categoryId={categoryId}
            bestOfSets={category.bestOfSets}
            poolGroups={category.poolGroups.map((group) => {
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
              return {
                id: group.id,
                name: group.name,
                ranking: ranking.map((r) => ({
                  rank: r.rank,
                  playerName: namesById.get(r.player) ?? "?",
                  wins: r.wins,
                  losses: r.losses,
                })),
                matches: group.matches.map((m) => ({
                  id: m.id,
                  player1Id: m.player1Id,
                  player2Id: m.player2Id,
                  player1Name: m.player1
                    ? `${m.player1.player?.firstName ?? ""} ${m.player1.player?.lastName ?? ""}`.trim()
                    : "?",
                  player2Name: m.player2
                    ? `${m.player2.player?.firstName ?? ""} ${m.player2.player?.lastName ?? ""}`.trim()
                    : "?",
                  status: m.status,
                  refereeName: m.refereeName,
                  sets: m.sets.map((s) => ({ player1Points: s.player1Points, player2Points: s.player2Points })),
                })),
              };
            })}
          />
          <ResetPoolsButton orgSlug={orgSlug} tournamentId={tournamentId} categoryId={categoryId} />
        </div>
      )}
    </div>
  );
}
