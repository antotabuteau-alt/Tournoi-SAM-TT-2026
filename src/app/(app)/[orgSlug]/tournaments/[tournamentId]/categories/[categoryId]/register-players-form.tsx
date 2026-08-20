"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPlayersToCategoryAction } from "@/actions/players.actions";
import { Button } from "@/components/ui/button";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  club: string | null;
}

export function RegisterPlayersForm({
  orgSlug,
  tournamentId,
  categoryId,
  players,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  players: Player[];
}) {
  const router = useRouter();
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
    startTransition(async () => {
      const res = await registerPlayersToCategoryAction(
        orgSlug,
        tournamentId,
        categoryId,
        [...selected]
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
        {players.map((p) => (
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

      <Button onClick={handleSubmit} disabled={isPending || selected.size === 0} className="w-fit">
        {isPending ? "Inscription..." : `Inscrire (${selected.size})`}
      </Button>
    </div>
  );
}
