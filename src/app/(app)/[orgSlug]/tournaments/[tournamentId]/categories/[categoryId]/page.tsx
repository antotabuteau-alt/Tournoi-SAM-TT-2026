import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { RegisterPlayersForm } from "./register-players-form";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="text-sm text-foreground/60">
          {category.registrations.length} inscrit(s) · statut {category.status}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {category.format !== "DIRECT_BRACKET" && (
          <Link
            href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools`}
            className="rounded-md border border-black/10 px-4 py-2"
          >
            {hasPools ? "Voir les poules" : "Générer les poules"}
          </Link>
        )}
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`}
          className="rounded-md border border-black/10 px-4 py-2"
        >
          {category.bracket ? "Voir le tableau final" : "Générer le tableau final"}
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Inscrits</h2>
        {category.registrations.length === 0 ? (
          <p className="text-foreground/70">Aucun joueur inscrit.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {category.registrations.map((r) => (
              <li
                key={r.id}
                className="flex justify-between rounded-md border border-black/10 px-4 py-2"
              >
                <span>
                  {r.player.firstName} {r.player.lastName}
                </span>
                <span className="text-foreground/60">
                  {r.seed ? `TS${r.seed}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {availablePlayers.length > 0 && (
          <details className="rounded-md border border-black/10 p-4">
            <summary className="cursor-pointer font-medium">
              Inscrire des joueurs
            </summary>
            <div className="mt-4">
              <RegisterPlayersForm
                orgSlug={orgSlug}
                tournamentId={tournamentId}
                categoryId={categoryId}
                players={availablePlayers}
              />
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
