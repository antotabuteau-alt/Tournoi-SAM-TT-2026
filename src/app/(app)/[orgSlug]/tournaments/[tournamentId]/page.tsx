import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./category-form";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StatTile } from "@/components/ui/stat-tile";
import { StageTracker } from "@/components/ui/stage-tracker";
import { getCategoryStages } from "@/lib/category-stages";

const FORMAT_LABELS: Record<string, string> = {
  POOLS_THEN_BRACKET: "Poules + tableau final",
  DIRECT_BRACKET: "Élimination directe",
  POOLS_ONLY: "Poules uniquement",
};

function categoryCta(
  orgSlug: string,
  tournamentId: string,
  categoryId: string,
  status: string,
  format: string,
  registrationCount: number
): { label: string; href: string } {
  const base = `/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}`;
  if (registrationCount === 0) return { label: "Ajouter des joueurs", href: base };
  if (format === "DIRECT_BRACKET") {
    if (status === "BRACKET_IN_PROGRESS") return { label: "Saisir les finales →", href: `${base}/bracket` };
    if (status === "FINISHED") return { label: "Voir le classement →", href: `${base}/bracket` };
    return { label: "Générer le tableau final →", href: `${base}/bracket` };
  }
  if (status === "DRAFT") return { label: "Générer les poules →", href: `${base}/pools` };
  if (status === "POOLS_IN_PROGRESS") return { label: "Saisir les poules →", href: `${base}/pools` };
  if (format === "POOLS_ONLY") return { label: "Voir les résultats →", href: `${base}/pools` };
  if (status === "POOLS_DONE") return { label: "Générer le tableau final →", href: `${base}/bracket` };
  if (status === "BRACKET_IN_PROGRESS") return { label: "Saisir les finales →", href: `${base}/bracket` };
  return { label: "Voir le classement →", href: `${base}/bracket` };
}

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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-sm text-navy-400">
            {tournament.date.toLocaleDateString("fr-FR")}
            {tournament.location ? ` · ${tournament.location}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players`} variant="outline">
            👥 Joueurs
          </LinkButton>
          <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/qrcode`} variant="outline">
            📶 QR code
          </LinkButton>
        </div>
      </div>

      <div className="flex gap-3">
        <StatTile label="Joueurs" value={tournament._count.players} />
        <StatTile label="Tableaux" value={tournament.categories.length} />
        <StatTile
          label="Terminés"
          value={tournament.categories.filter((c) => c.status === "FINISHED").length}
        />
      </div>

      <section className="flex flex-col gap-3">
        {tournament.categories.length === 0 ? (
          <Card className="px-6 py-10 text-center text-navy-400">
            Aucune catégorie pour le moment.
          </Card>
        ) : (
          tournament.categories.map((c) => {
            const cta = categoryCta(
              orgSlug,
              tournamentId,
              c.id,
              c.status,
              c.format,
              c._count.registrations
            );
            return (
              <Card key={c.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      <span className="text-xs text-navy-400">{FORMAT_LABELS[c.format]}</span>
                    </div>
                    <p className="text-xs text-navy-400">{c._count.registrations} joueur(s)</p>
                  </div>
                  <LinkButton href={cta.href} size="sm">{cta.label}</LinkButton>
                </div>
                <div className="mt-4">
                  <StageTracker
                    stages={getCategoryStages(c.status, c.format, c._count.registrations)}
                  />
                </div>
              </Card>
            );
          })
        )}

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
  );
}
