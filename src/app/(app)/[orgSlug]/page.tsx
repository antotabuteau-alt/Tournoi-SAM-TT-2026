import Link from "next/link";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/live-clock";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  POOLS_IN_PROGRESS: "En cours",
  POOLS_DONE: "Poules terminées",
  BRACKET_IN_PROGRESS: "En cours",
  FINISHED: "Terminé",
  ARCHIVED: "Archivé",
};

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization, user } = await requireMembership(orgSlug);

  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: organization.id },
    orderBy: { date: "desc" },
    include: { _count: { select: { categories: true, players: true } } },
  });

  const activeCount = tournaments.filter(
    (t) => t.status !== "FINISHED" && t.status !== "ARCHIVED"
  ).length;
  const [featured, ...rest] = tournaments;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes tournois</h1>
          <p className="text-sm text-navy-400">
            {activeCount} tournoi{activeCount !== 1 ? "s" : ""} actif{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <LinkButton href={`/${orgSlug}/tournaments/new`} variant="accent">
          + Nouveau tournoi
        </LinkButton>
      </div>

      {featured && (
        <Link
          href={`/${orgSlug}/tournaments/${featured.id}`}
          className="block rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.005]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              🎯 {STATUS_LABELS[featured.status] ?? featured.status}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">{featured.name}</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
            <span>🏆 {featured._count.categories} tableau{featured._count.categories !== 1 ? "x" : ""}</span>
            <span>👥 {featured._count.players} joueurs</span>
            <span>📅 {featured.date.toLocaleDateString("fr-FR")}</span>
            {featured.location && <span>📍 {featured.location}</span>}
          </div>
          <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-600">
            Ouvrir →
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((t) => (
            <Link key={t.id} href={`/${orgSlug}/tournaments/${t.id}`}>
              <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-muted">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="text-xs text-navy-400">{t.date.toLocaleDateString("fr-FR")}</p>
                </div>
                <Badge variant="neutral">{STATUS_LABELS[t.status] ?? t.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tournaments.length === 0 && (
        <Card className="px-6 py-10 text-center text-navy-400">
          Aucun tournoi pour le moment — crée le premier avec le bouton ci-dessus.
        </Card>
      )}

      <LiveClock name={user.name ?? organization.name} />
    </div>
  );
}
