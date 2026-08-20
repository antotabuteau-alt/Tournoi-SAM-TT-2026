"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPlayersToCategoryAction } from "@/actions/players.actions";

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
            <label className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-black/[.03]">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              {p.firstName} {p.lastName}
              {p.club && <span className="text-foreground/50">— {p.club}</span>}
            </label>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending || selected.size === 0}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Inscription..." : `Inscrire (${selected.size})`}
      </button>
    </div>
  );
}
