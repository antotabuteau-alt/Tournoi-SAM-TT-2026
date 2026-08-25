"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPlayersToCategoryAction } from "@/actions/players.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { Avatar } from "@/components/match-avatar";
import { cn } from "@/lib/cn";

interface RegisteredPlayer {
  id: string;
  playerId: string;
  seed: number | null;
  firstName: string;
  lastName: string;
}

interface AvailablePlayer {
  id: string;
  firstName: string;
  lastName: string;
  club: string | null;
}

export function CategoryRegistrations({
  orgSlug,
  tournamentId,
  categoryId,
  categoryName,
  headerActions,
  initialRegistered,
  initialAvailable,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  headerActions: React.ReactNode;
  initialRegistered: RegisteredPlayer[];
  initialAvailable: AvailablePlayer[];
}) {
  const router = useRouter();
  const [registered, setRegistered] = useState(initialRegistered);
  const [available, setAvailable] = useState(initialAvailable);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredAvailable = available.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.club ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const allFilteredSelected =
    filteredAvailable.length > 0 && filteredAvailable.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const p of filteredAvailable) next.delete(p.id);
        return next;
      }
      return new Set([...prev, ...filteredAvailable.map((p) => p.id)]);
    });
  }

  function handleSubmit() {
    setError(null);
    const ids = [...selected];
    startTransition(async () => {
      const res = await registerPlayersToCategoryAction(orgSlug, tournamentId, categoryId, ids);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const moved = available.filter((p) => ids.includes(p.id));
      setRegistered((prev) => [
        ...prev,
        ...moved.map((p) => ({ id: p.id, playerId: p.id, seed: null, firstName: p.firstName, lastName: p.lastName })),
      ]);
      setAvailable((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <LinkButton
            href={`/${orgSlug}/tournaments/${tournamentId}`}
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
          >
            ← Retour au tournoi
          </LinkButton>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <p className="text-sm text-navy-400">{registered.length} inscrit(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">{headerActions}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="border-b border-border bg-gradient-to-r from-navy-950 to-navy-800 px-4 py-3">
            <h2 className="text-sm font-bold text-white">Inscrits ({registered.length})</h2>
          </div>
          {registered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-navy-400">Aucun joueur inscrit pour l&apos;instant.</p>
          ) : (
            <ul className="flex max-h-[28rem] flex-col divide-y divide-border overflow-y-auto">
              {registered.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-muted">
                  <Avatar name={`${r.firstName} ${r.lastName}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {r.firstName} {r.lastName}
                  </span>
                  {r.seed && <Badge variant="brand">TS{r.seed}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-navy-950 to-navy-800 px-4 py-3">
            <h2 className="text-sm font-bold text-white">Inscrire des joueurs</h2>
            {available.length > 0 && (
              <button
                onClick={toggleAllFiltered}
                className="shrink-0 text-xs font-semibold text-accent-400 hover:text-accent-300"
              >
                {allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            )}
          </div>

          {available.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-sm text-navy-400">
                Tous les joueurs du tournoi sont déjà inscrits ici, ou aucun joueur n&apos;a
                encore été ajouté au tournoi.
              </p>
              <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players`} size="sm">
                📝 Gérer les joueurs du tournoi
              </LinkButton>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-2.5">
                <input
                  type="text"
                  placeholder="🔍 Rechercher un joueur ou un club…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </div>

              <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
                {filteredAvailable.map((p) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => toggle(p.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-brand-50" : "hover:bg-surface-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors",
                            isSelected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-border text-transparent"
                          )}
                        >
                          ✓
                        </span>
                        <Avatar name={`${p.firstName} ${p.lastName}`} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {p.firstName} {p.lastName}
                        </span>
                        {p.club && (
                          <span className="max-w-[8rem] shrink-0 truncate text-xs text-navy-400">{p.club}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {filteredAvailable.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-navy-400">
                    Aucun joueur ne correspond à la recherche.
                  </li>
                )}
              </ul>

              <div className="flex items-center justify-between gap-3 border-t border-border p-3">
                {error ? <p className="text-sm text-danger-600">{error}</p> : <span />}
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || selected.size === 0}
                  variant="accent"
                >
                  {isPending ? "Inscription..." : selected.size > 0 ? `✓ Inscrire (${selected.size})` : "Inscrire"}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
