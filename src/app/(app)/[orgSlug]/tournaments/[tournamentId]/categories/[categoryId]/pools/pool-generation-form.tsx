"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePoolsAction } from "@/actions/pools.actions";

export function PoolGenerationForm({
  orgSlug,
  tournamentId,
  categoryId,
  playerCount,
  poolTargetSize,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  playerCount: number;
  poolTargetSize: number;
}) {
  const router = useRouter();
  const suggestedCount = Math.max(1, Math.ceil(playerCount / poolTargetSize));
  const [poolCount, setPoolCount] = useState(suggestedCount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate(mode: "auto" | "manual") {
    setError(null);
    startTransition(async () => {
      const res = await generatePoolsAction(
        orgSlug,
        tournamentId,
        categoryId,
        mode,
        poolCount
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (playerCount < 2) {
    return (
      <p className="text-foreground/70">
        Inscris au moins 2 joueurs avant de générer les poules.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-black/10 p-4">
      <label className="flex items-center gap-2 text-sm">
        Nombre de poules
        <input
          type="number"
          min={1}
          value={poolCount}
          onChange={(e) => setPoolCount(Number(e.target.value))}
          className="w-20 rounded-md border border-black/15 px-2 py-1"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => generate("auto")}
          disabled={isPending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Générer automatiquement (serpent)
        </button>
        <button
          onClick={() => generate("manual")}
          disabled={isPending}
          className="rounded-md border border-black/10 px-4 py-2 text-sm disabled:opacity-50"
        >
          Créer des poules vides (manuel)
        </button>
      </div>
    </div>
  );
}
