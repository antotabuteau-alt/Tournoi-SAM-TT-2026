import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./category-form";

const FORMAT_LABELS: Record<string, string> = {
  POOLS_THEN_BRACKET: "Poules + tableau final",
  DIRECT_BRACKET: "Élimination directe",
  POOLS_ONLY: "Poules uniquement",
};

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
      categories: { orderBy: { createdAt: "asc" } },
      _count: { select: { players: true } },
    },
  });
  if (!tournament) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-foreground/60">
          {tournament.date.toLocaleDateString("fr-FR")}
          {tournament.location ? ` · ${tournament.location}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/players`}
          className="rounded-md border border-black/10 px-4 py-2"
        >
          Joueurs ({tournament._count.players})
        </Link>
        <Link
          href={`/${orgSlug}/tournaments/${tournamentId}/qrcode`}
          className="rounded-md border border-black/10 px-4 py-2"
        >
          QR code / suivi public
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Catégories</h2>
        {tournament.categories.length === 0 ? (
          <p className="text-foreground/70">Aucune catégorie pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tournament.categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${orgSlug}/tournaments/${tournamentId}/categories/${c.id}`}
                  className="block rounded-md border border-black/10 px-4 py-3 hover:bg-black/[.03]"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-sm text-foreground/60">
                    {FORMAT_LABELS[c.format]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <details className="rounded-md border border-black/10 p-4">
          <summary className="cursor-pointer font-medium">
            Ajouter une catégorie
          </summary>
          <div className="mt-4">
            <CategoryForm orgSlug={orgSlug} tournamentId={tournamentId} />
          </div>
        </details>
      </section>
    </div>
  );
}
