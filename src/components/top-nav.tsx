"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TournamentNavData } from "@/actions/nav.actions";

interface TournamentSummary {
  id: string;
  name: string;
}

function sectionLabel(pathname: string, hasCategory: boolean): string | null {
  if (!hasCategory) {
    if (pathname.endsWith("/players/import")) return "Import de joueurs";
    if (pathname.endsWith("/players")) return "Joueurs du tournoi";
    if (pathname.endsWith("/tables")) return "Tables";
    if (pathname.endsWith("/planning")) return "Planning";
    if (pathname.endsWith("/compositions")) return "Compositions";
    if (pathname.endsWith("/qrcode")) return "QR Code";
    if (pathname.endsWith("/settings")) return "Paramètres du tournoi";
    return null;
  }
  if (/\/pools\/print$/.test(pathname)) return "Impression — classements des poules";
  if (/\/pools\/[^/]+\/print$/.test(pathname)) return "Impression — feuilles de match";
  if (/\/pools\/[^/]+\/matches\/[^/]+\/print$/.test(pathname)) return "Impression — feuille de match";
  if (/\/pools$/.test(pathname)) return "Poules";
  if (/\/pools\/[^/]+$/.test(pathname)) return "Détail de la poule";
  if (/\/bracket\/matches\/[^/]+\/print$/.test(pathname)) return "Impression — feuille de match";
  if (/\/bracket$/.test(pathname)) return "Tableau final";
  return null;
}

function DropdownCrumb({
  label,
  items,
  activeId,
}: {
  label: string;
  items: { id: string; name: string; href: string }[];
  activeId?: string;
}) {
  if (items.length <= 1) {
    return <span className="max-w-[14rem] truncate text-sm font-semibold text-foreground">{label}</span>;
  }
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-semibold text-foreground marker:content-none hover:bg-surface-muted">
        <span className="max-w-[14rem] truncate">{label}</span>
        <span className="text-[10px] text-navy-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="absolute left-0 top-full z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg shadow-navy-950/10">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "block truncate rounded-lg px-3 py-1.5 text-sm",
                item.id === activeId
                  ? "bg-brand-50 font-semibold text-brand-700"
                  : "text-foreground hover:bg-surface-muted"
              )}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function TopNav({
  orgSlug,
  pathname,
  tournamentId,
  tournaments,
  navData,
}: {
  orgSlug: string;
  pathname: string;
  tournamentId?: string;
  tournaments: TournamentSummary[];
  navData: TournamentNavData | null;
}) {
  const router = useRouter();
  const categoryMatch = pathname.match(/\/categories\/([^/]+)/);
  const categoryId = categoryMatch?.[1];
  const isOrgRoot = pathname === `/${orgSlug}`;

  const section = tournamentId ? sectionLabel(pathname, !!categoryId) : null;
  const category = categoryId ? navData?.categories.find((c) => c.id === categoryId) : undefined;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-border bg-surface/95 px-3 py-2 backdrop-blur print:hidden">
      <button
        onClick={() => router.back()}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted hover:text-foreground"
        aria-label="Page précédente"
        title="Page précédente"
      >
        ←
      </button>

      <Link
        href={`/${orgSlug}`}
        className={cn(
          "flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold",
          isOrgRoot ? "bg-brand-50 text-brand-700" : "text-navy-400 hover:bg-surface-muted hover:text-foreground"
        )}
        title="Accueil — tous les tournois"
      >
        🏠<span className="hidden sm:inline">Accueil</span>
      </Link>

      {tournamentId && (
        <>
          <span className="shrink-0 text-navy-300">›</span>
          <DropdownCrumb
            key={tournamentId}
            label={navData?.tournamentName ?? "…"}
            activeId={tournamentId}
            items={tournaments.map((t) => ({ id: t.id, name: t.name, href: `/${orgSlug}/tournaments/${t.id}` }))}
          />
        </>
      )}

      {categoryId && navData && (
        <>
          <span className="shrink-0 text-navy-300">›</span>
          <DropdownCrumb
            key={categoryId}
            label={category?.name ?? "…"}
            activeId={categoryId}
            items={navData.categories.map((c) => ({
              id: c.id,
              name: c.name,
              href: `/${orgSlug}/tournaments/${tournamentId}/categories/${c.id}`,
            }))}
          />
        </>
      )}

      {section && (
        <>
          <span className="shrink-0 text-navy-300">›</span>
          <span className="max-w-[16rem] shrink-0 truncate text-sm font-semibold text-brand-700">
            {section}
          </span>
        </>
      )}
    </div>
  );
}
