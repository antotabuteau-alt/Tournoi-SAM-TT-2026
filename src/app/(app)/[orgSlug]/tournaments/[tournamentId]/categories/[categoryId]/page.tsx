import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryRegistrations } from "./category-registrations";
import { LinkButton } from "@/components/ui/link-button";

export default async function CategoryPage({
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
      poolGroups: { select: { id: true } },
      bracket: { select: { id: true } },
    },
  });
  if (!category) notFound();

  const registeredPlayerIds = new Set(category.registrations.map((r) => r.playerId));
  const availablePlayers = await prisma.player.findMany({
    where: {
      tournamentId,
      organizationId: organization.id,
      id: { notIn: [...registeredPlayerIds] },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const hasPools = category.poolGroups.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-8">
      <CategoryRegistrations
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        categoryName={category.name}
        headerActions={
          <>
            {category.format !== "DIRECT_BRACKET" && (
              <LinkButton
                href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`}
                variant="outline"
                size="sm"
              >
                🎯 {hasPools ? "Voir les poules" : "Générer les poules"}
              </LinkButton>
            )}
            <LinkButton
              href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`}
              variant="outline"
              size="sm"
            >
              🏆 {category.bracket ? "Voir le tableau final" : "Générer le tableau final"}
            </LinkButton>
          </>
        }
        initialRegistered={category.registrations.map((r) => ({
          id: r.id,
          playerId: r.playerId,
          seed: r.seed,
          firstName: r.player.firstName,
          lastName: r.player.lastName,
        }))}
        initialAvailable={availablePlayers}
      />
    </div>
  );
}
