"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitPoolScoreAction,
  submitBracketScoreAction,
} from "@/actions/matches.actions";

interface SetRow {
  player1Points: string;
  player2Points: string;
}

export function MatchScoreForm({
  orgSlug,
  tournamentId,
  categoryId,
  matchId,
  kind,
  bestOfSets,
  player1Name,
  player2Name,
  status,
  player1Id,
  player2Id,
  existingSets,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  matchId: string;
  kind: "pool" | "bracket";
  bestOfSets: number;
  player1Name: string;
  player2Name: string;
  status: string;
  winnerId: string | null;
  player1Id: string | null;
  player2Id: string | null;
  existingSets: { player1Points: number; player2Points: number }[];
}) {
  const router = useRouter();
  const maxSets = bestOfSets * 2 - 1;
  const [editing, setEditing] = useState(status !== "DONE");
  const [sets, setSets] = useState<SetRow[]>(
    existingSets.length > 0
      ? existingSets.map((s) => ({
          player1Points: String(s.player1Points),
          player2Points: String(s.player2Points),
        }))
      : [{ player1Points: "", player2Points: "" }]
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!player1Id && !player2Id) {
    return (
      <div className="rounded-md border border-black/10 px-4 py-3 text-sm text-foreground/50">
        En attente des matchs précédents
      </div>
    );
  }

  if (status === "BYE" || !player1Id || !player2Id) {
    const qualifiedName = player1Id ? player1Name : player2Name;
    return (
      <div className="rounded-md border border-black/10 px-4 py-3 text-sm text-foreground/50">
        {qualifiedName} — qualifié (exempt)
      </div>
    );
  }

  if (status === "DONE" && !editing) {
    return (
      <div className="flex items-center justify-between rounded-md border border-black/10 px-4 py-3 text-sm">
        <span>
          {player1Name} vs {player2Name}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-foreground/60">
            {existingSets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ")}
          </span>
          <button onClick={() => setEditing(true)} className="underline">
            Modifier
          </button>
        </div>
      </div>
    );
  }

  function updateSet(index: number, key: keyof SetRow, value: string) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [key]: value } : s))
    );
  }

  function addSet() {
    setSets((prev) =>
      prev.length < maxSets
        ? [...prev, { player1Points: "", player2Points: "" }]
        : prev
    );
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError(null);
    const parsedSets = sets.map((s) => ({
      player1Points: Number(s.player1Points),
      player2Points: Number(s.player2Points),
    }));

    startTransition(async () => {
      const action = kind === "pool" ? submitPoolScoreAction : submitBracketScoreAction;
      const res = await action(orgSlug, tournamentId, categoryId, matchId, parsedSets);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-black/10 p-4">
      <p className="text-sm font-medium">
        {player1Name} vs {player2Name}
      </p>

      <div className="flex flex-col gap-2">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-xs text-foreground/50">Manche {i + 1}</span>
            <input
              type="number"
              min={0}
              value={s.player1Points}
              onChange={(e) => updateSet(i, "player1Points", e.target.value)}
              className="w-16 rounded-md border border-black/15 px-2 py-1 text-sm"
            />
            <span className="text-foreground/40">-</span>
            <input
              type="number"
              min={0}
              value={s.player2Points}
              onChange={(e) => updateSet(i, "player2Points", e.target.value)}
              className="w-16 rounded-md border border-black/15 px-2 py-1 text-sm"
            />
            {sets.length > 1 && (
              <button
                onClick={() => removeSet(i)}
                className="text-xs text-foreground/40 hover:text-red-600"
              >
                retirer
              </button>
            )}
          </div>
        ))}
        {sets.length < maxSets && (
          <button
            onClick={addSet}
            className="w-fit text-xs underline text-foreground/60"
          >
            + Ajouter une manche
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer le score"}
      </button>
    </div>
  );
}
