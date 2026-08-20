"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPlayersToCategoryAction } from "@/actions/players.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <p className="text-sm text-navy-400">{registered.length} inscrit(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">{headerActions}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Card className="flex flex-col gap-1 p-4">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-navy-400 uppercase">
          Inscrits ({registered.length})
        </h2>
        {registered.length === 0 ? (
          <p className="py-4 text-center text-sm text-navy-400">Aucun joueur inscrit.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {registered.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {r.firstName} {r.lastName}
                </span>
                {r.seed && <Badge variant="brand">TS{r.seed}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-navy-400 uppercase">
          Inscrire des joueurs
        </h2>
        {available.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-navy-400">
              Tous les joueurs du tournoi sont déjà inscrits ici, ou aucun joueur n&apos;a
              encore été ajouté au tournoi.
            </p>
            <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players`} size="sm">
              📝 Gérer les joueurs du tournoi
            </LinkButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
              {available.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="accent-brand-500"
                    />
                    {p.firstName} {p.lastName}
                    {p.club && <span className="text-navy-400">— {p.club}</span>}
                  </label>
                </li>
              ))}
            </ul>

            {error && <p className="text-sm text-danger-600">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={isPending || selected.size === 0}
              className="w-fit"
            >
              {isPending ? "Inscription..." : `Inscrire (${selected.size})`}
            </Button>
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}
