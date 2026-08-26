import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { loadPoolDndData, loadPoolBoardData } from "@/lib/pool-board-data";
import { PoolsPageClient } from "./pools-page-client";
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
      select: {
        name: true,
        format: true,
        bestOfSets: true,
        poolTargetSize: true,
        bracket: { select: { id: true } },
        _count: { select: { registrations: true } },
        poolGroups: { select: { id: true, matches: { select: { id: true } } } },
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

  const initialView = hasMatches
    ? { kind: "matches" as const, poolGroups: await loadPoolBoardData(categoryId) }
    : hasPools
      ? { kind: "dnd" as const, ...(await loadPoolDndData(categoryId)) }
      : { kind: "form" as const };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Poules — {category.name}</h1>
          <p className="text-sm text-navy-400">{category._count.registrations} inscrit(s)</p>
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

      <PoolsPageClient
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        bestOfSets={category.bestOfSets}
        playerCount={category._count.registrations}
        poolTargetSize={category.poolTargetSize ?? 3}
        canGenerateBracket={category.format !== "POOLS_ONLY" && !category.bracket}
        initialView={initialView}
      />
    </div>
  );
}
