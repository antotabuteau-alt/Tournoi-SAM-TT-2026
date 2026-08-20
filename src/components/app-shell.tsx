"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/actions/auth.actions";

interface TournamentNavItem {
  id: string;
  name: string;
}

export function AppShell({
  orgSlug,
  orgName,
  tournaments,
  children,
}: {
  orgSlug: string;
  orgName: string;
  tournaments: TournamentNavItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold text-navy-900">
          {orgName.slice(0, 1).toUpperCase()}
        </div>
        <span className="truncate font-semibold text-white">{orgName}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-navy-400 uppercase">
          Tournois
        </div>
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
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-3">
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 text-sm text-navy-300 hover:bg-white/5 hover:text-white"
        >
          Mes clubs
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger-600/90 hover:bg-white/5"
          >
            Déconnexion
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
