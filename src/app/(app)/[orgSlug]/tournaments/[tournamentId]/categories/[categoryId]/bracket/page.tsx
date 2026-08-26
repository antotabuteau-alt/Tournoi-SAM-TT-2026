import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { loadBracketBoardData } from "@/lib/bracket-board-data";
import { BracketPageClient } from "./bracket-page-client";
import { LinkButton } from "@/components/ui/link-button";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string; categoryId: string }>;
}) {
  const { orgSlug, tournamentId, categoryId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
    select: { name: true, bestOfSets: true },
  });
  if (!category) notFound();

  const matches = await loadBracketBoardData(categoryId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau final — {category.name}</h1>
        <LinkButton
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`}
          variant="outline"
          size="sm"
        >
          ← Retour à la catégorie
        </LinkButton>
      </div>

      <BracketPageClient
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        bestOfSets={category.bestOfSets}
        initialMatches={matches}
      />
    </div>
  );
}
