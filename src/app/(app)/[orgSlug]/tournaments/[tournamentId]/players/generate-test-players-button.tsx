"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateTestPlayersAction } from "@/actions/players.actions";
import { Button } from "@/components/ui/button";

interface GeneratedTestPlayer {
  id: string;
  firstName: string;
  lastName: string;
  club: string | null;
}

export function GenerateTestPlayersButton({
  orgSlug,
  tournamentId,
  onGenerated,
}: {
  orgSlug: string;
  tournamentId: string;
  onGenerated: (players: GeneratedTestPlayer[]) => void;
}) {
  const router = useRouter();
  const [count, setCount] = useState(16);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  function handleClick() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const res = await generateTestPlayersAction(orgSlug, tournamentId, count);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const created = res.created ?? [];
      onGenerated(created);
      setDone(created.length);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-lg border border-border px-2 py-1.5 text-sm"
          aria-label="Nombre de joueurs de test"
        >
          {[4, 8, 16, 24, 32, 48].map((n) => (
            <option key={n} value={n}>
              {n} joueurs
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={handleClick} disabled={isPending}>
          {isPending ? "Génération..." : "✨ Joueurs de test"}
        </Button>
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {done !== null && <p className="text-xs text-success-600">{done} joueur(s) fictif(s) ajouté(s).</p>}
    </div>
  );
}
