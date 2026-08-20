import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { RegisterPlayersForm } from "./register-players-form";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="text-sm text-navy-400">{category.registrations.length} inscrit(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col gap-1 p-4">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-navy-400 uppercase">
            Inscrits
          </h2>
          {category.registrations.length === 0 ? (
            <p className="py-4 text-center text-sm text-navy-400">Aucun joueur inscrit.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {category.registrations.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {r.player.firstName} {r.player.lastName}
                  </span>
                  {r.seed && <Badge variant="brand">TS{r.seed}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {availablePlayers.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-navy-400 uppercase">
              Inscrire des joueurs
            </h2>
            <RegisterPlayersForm
              orgSlug={orgSlug}
              tournamentId={tournamentId}
              categoryId={categoryId}
              players={availablePlayers}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
