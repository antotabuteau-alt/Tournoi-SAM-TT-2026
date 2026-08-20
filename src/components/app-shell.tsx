"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/actions/auth.actions";
import { getTournamentNavData, type TournamentNavData } from "@/actions/nav.actions";

interface TournamentNavItem {
  id: string;
  name: string;
}

export function AppShell({
  orgSlug,
  orgName,
  orgLogoUrl,
  userName,
  tournaments,
  children,
}: {
  orgSlug: string;
  orgName: string;
  orgLogoUrl?: string | null;
  userName: string;
  tournaments: TournamentNavItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const tournamentMatch = pathname?.match(/\/tournaments\/([^/]+)/);
  const currentTournamentId = tournamentMatch?.[1];
  const inTournamentContext = !!currentTournamentId && currentTournamentId !== "new";
  const [navData, setNavData] = useState<TournamentNavData | null>(null);

  useEffect(() => {
    if (!currentTournamentId || currentTournamentId === "new") return;
    let cancelled = false;
    getTournamentNavData(orgSlug, currentTournamentId).then((data) => {
      if (!cancelled) setNavData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [orgSlug, currentTournamentId]);

  const sidebarContent = (
    <>
      <Link href={`/${orgSlug}/settings`} className="flex items-center gap-3 px-5 py-5 hover:opacity-80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-lg font-bold text-navy-900">
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={orgLogoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            orgName.slice(0, 1).toUpperCase()
          )}
        </div>
        <span className="truncate font-semibold text-white">{orgName}</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-navy-400 uppercase">
          Tournois
        </div>

        {inTournamentContext && navData ? (
          <div className="flex flex-col gap-1">
            <div className="truncate rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-navy-950">
              {navData.tournamentName}
            </div>
            <ul className="flex flex-col gap-0.5 pl-2">
              {navData.categories.map((c) => {
                const href = `/${orgSlug}/tournaments/${currentTournamentId}/categories/${c.id}`;
                const active = pathname?.includes(`/categories/${c.id}`);
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block truncate rounded-lg px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "font-semibold text-white"
                          : "text-navy-300 hover:bg-white/5 hover:text-white"
                      )}
                      title={c.name}
                    >
                      🏓 {c.name}
                    </Link>
                  </li>
                );
              })}
              {navData.categories.length === 0 && (
                <li className="px-3 py-1.5 text-sm text-navy-400">Aucun tableau</li>
              )}
            </ul>
            {navData.matchesInProgress > 0 && (
              <div className="mt-2 border-t border-white/10 px-3 pt-2 text-xs text-navy-400">
                {navData.matchesInProgress} match{navData.matchesInProgress !== 1 ? "s" : ""} en cours
              </div>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {tournaments.map((t) => {
              const href = `/${orgSlug}/tournaments/${t.id}`;
              const active = pathname?.startsWith(href);
              return (
                <li key={t.id}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block truncate rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent-500 font-semibold text-navy-950"
                        : "text-navy-300 hover:bg-white/5 hover:text-white"
                    )}
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                </li>
              );
            })}
            {tournaments.length === 0 && (
              <li className="px-3 py-2 text-sm text-navy-400">Aucun tournoi</li>
            )}
          </ul>
        )}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-3 text-sm">
        <Link href="/dashboard" className="rounded-lg px-3 py-2 text-navy-300 hover:bg-white/5 hover:text-white">
          ❓ Aide
        </Link>
        <a
          href="mailto:contact@samtt.fr"
          className="rounded-lg px-3 py-2 text-navy-300 hover:bg-white/5 hover:text-white"
        >
          💬 Une idée / un souci ?
        </a>
        <span className="truncate rounded-lg px-3 py-2 italic text-navy-400">👤 {userName}</span>
        <Link href="/dashboard" className="rounded-lg px-3 py-2 text-navy-300 hover:bg-white/5 hover:text-white">
          Mes clubs
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-danger-600/90 hover:bg-white/5"
          >
            🔒 Déconnexion
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-950 md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-navy-950">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <span className="truncate font-semibold">{orgName}</span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
