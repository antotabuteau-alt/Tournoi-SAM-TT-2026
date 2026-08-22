"use client";

import { useState, useTransition } from "react";
import { toggleCheckInAction } from "@/actions/players.actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  club: string | null;
  checkedInAt: Date | null;
  conflictCategories: string[];
}

export function PlayersList({
  orgSlug,
  tournamentId,
  players,
}: {
  orgSlug: string;
  tournamentId: string;
  players: PlayerRow[];
}) {
  const [items, setItems] = useState(players);
  const [prevPlayers, setPrevPlayers] = useState(players);
  if (players !== prevPlayers) {
    setPrevPlayers(players);
    setItems(players);
  }

  const [isPending, startTransition] = useTransition();
  const checkedInCount = items.filter((p) => p.checkedInAt).length;
  const conflictCount = items.filter((p) => p.conflictCategories.length > 0).length;

  function handleToggle(playerId: string, next: boolean) {
    setItems((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, checkedInAt: next ? new Date() : null } : p))
    );
    startTransition(async () => {
      const res = await toggleCheckInAction(orgSlug, tournamentId, playerId, next);
      if ("error" in res) {
        setItems((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, checkedInAt: next ? null : new Date() } : p))
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-navy-500">
          ✓ {checkedInCount}/{items.length} présent(s)
        </span>
        {conflictCount > 0 && (
          <Badge variant="danger">⚠ {conflictCount} conflit(s) d&apos;horaire potentiel(s)</Badge>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-navy-400">Aucun joueur pour le moment.</p>
      ) : (
        <ul className="flex max-h-[32rem] flex-col divide-y divide-border overflow-y-auto">
          {items.map((p) => {
            const checkedIn = !!p.checkedInAt;
            return (
              <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <button
                  onClick={() => handleToggle(p.id, !checkedIn)}
                  disabled={isPending}
                  title={checkedIn ? "Marquer absent" : "Marquer présent"}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors disabled:opacity-50",
                    checkedIn
                      ? "border-success-500 bg-success-500 text-white"
                      : "border-border bg-surface text-transparent hover:border-navy-300"
                  )}
                >
                  ✓
                </button>
                <span className="min-w-0 flex-1 truncate">
                  {p.firstName} {p.lastName}
                </span>
                {p.conflictCategories.length > 0 && (
                  <span
                    className="shrink-0 text-xs text-danger-600"
                    title={`Peut être appelé simultanément : ${p.conflictCategories.join(", ")}`}
                  >
                    ⚠
                  </span>
                )}
                <span className="shrink-0 truncate text-xs text-navy-400">{p.club}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
