"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitPoolScoreAction,
  submitBracketScoreAction,
  submitForfeitAction,
  setMatchTableAction,
  setMatchRefereeAction,
} from "@/actions/matches.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface SetRow {
  player1Points: string;
  player2Points: string;
}

const QUICK_VALUES = Array.from({ length: 16 }, (_, i) => i);

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
  tableNumber = null,
  refereeName = null,
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
  tableNumber?: number | null;
  refereeName?: string | null;
}) {
  const router = useRouter();
  const maxSets = bestOfSets * 2 - 1;
  const [editing, setEditing] = useState(status !== "DONE" && status !== "WALKOVER");
  const [sets, setSets] = useState<SetRow[]>(
    existingSets.length > 0
      ? existingSets.map((s) => ({
          player1Points: String(s.player1Points),
          player2Points: String(s.player2Points),
        }))
      : [{ player1Points: "", player2Points: "" }]
  );
  const [active, setActive] = useState<{ index: number; side: 1 | 2 } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState(tableNumber ? String(tableNumber) : "");
  const [referee, setReferee] = useState(refereeName ?? "");

  if (!player1Id && !player2Id) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-navy-400">
        En attente des matchs précédents
      </div>
    );
  }

  if (status === "BYE" || !player1Id || !player2Id) {
    const qualifiedName = player1Id ? player1Name : player2Name;
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-navy-400">
        {qualifiedName} — qualifié (exempt)
      </div>
    );
  }

  if (status === "WALKOVER") {
    return (
      <Card className="flex items-center justify-between px-4 py-3 text-sm">
        <span>
          {player1Name} vs {player2Name}
        </span>
        <span className="font-semibold text-danger-600">Forfait</span>
      </Card>
    );
  }

  if (status === "DONE" && !editing) {
    return (
      <Card className="flex items-center justify-between px-4 py-3 text-sm">
        <span>
          {player1Name} vs {player2Name}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-medium text-navy-700">
            {existingSets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ")}
          </span>
          <button onClick={() => setEditing(true)} className="text-brand-600 hover:underline">
            Modifier
          </button>
        </div>
      </Card>
    );
  }

  function updateSet(index: number, key: keyof SetRow, value: string) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  }

  function addSet() {
    setSets((prev) => (prev.length < maxSets ? [...prev, { player1Points: "", player2Points: "" }] : prev));
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleQuickValue(value: number) {
    if (!active) return;
    updateSet(active.index, active.side === 1 ? "player1Points" : "player2Points", String(value));
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

  function handleForfeit(slot: 1 | 2) {
    if (!window.confirm(`Confirmer le forfait de ${slot === 1 ? player1Name : player2Name} ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await submitForfeitAction(orgSlug, tournamentId, categoryId, matchId, kind, slot);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleTableBlur() {
    const n = table.trim() === "" ? null : Number(table);
    startTransition(async () => {
      await setMatchTableAction(orgSlug, categoryId, matchId, n);
      router.refresh();
    });
  }

  function handleRefereeBlur() {
    startTransition(async () => {
      await setMatchRefereeAction(orgSlug, categoryId, matchId, referee);
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {player1Name} <span className="font-normal text-navy-400">vs</span> {player2Name}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1 text-navy-400">
            🟢 Table
            <input
              type="number"
              min={1}
              value={table}
              onChange={(e) => setTable(e.target.value)}
              onBlur={handleTableBlur}
              className="w-14 rounded-md border border-border px-1.5 py-1 text-center"
            />
          </label>
          <label className="flex items-center gap-1 text-navy-400">
            🧑‍⚖️
            <input
              type="text"
              placeholder="Arbitre"
              value={referee}
              onChange={(e) => setReferee(e.target.value)}
              onBlur={handleRefereeBlur}
              className="w-24 rounded-md border border-border px-1.5 py-1"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col gap-1.5">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 text-xs text-navy-400">Manche {i + 1}</span>
              <input
                type="number"
                min={0}
                value={s.player1Points}
                onFocus={() => setActive({ index: i, side: 1 })}
                onChange={(e) => updateSet(i, "player1Points", e.target.value)}
                className={cn(
                  "w-14 rounded-md border px-2 py-1 text-center text-sm",
                  active?.index === i && active.side === 1
                    ? "border-brand-500 ring-2 ring-brand-400/20"
                    : "border-border"
                )}
              />
              <span className="text-navy-300">–</span>
              <input
                type="number"
                min={0}
                value={s.player2Points}
                onFocus={() => setActive({ index: i, side: 2 })}
                onChange={(e) => updateSet(i, "player2Points", e.target.value)}
                className={cn(
                  "w-14 rounded-md border px-2 py-1 text-center text-sm",
                  active?.index === i && active.side === 2
                    ? "border-brand-500 ring-2 ring-brand-400/20"
                    : "border-border"
                )}
              />
              {sets.length > 1 && (
                <button
                  onClick={() => removeSet(i)}
                  className="text-xs text-navy-300 hover:text-danger-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {sets.length < maxSets && (
            <button onClick={addSet} className="w-fit text-xs font-medium text-brand-600">
              + Ajouter une manche
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
            Saisie rapide {active ? "" : "(clique un score)"}
          </span>
          <div className="grid grid-cols-8 gap-1">
            {QUICK_VALUES.map((v) => (
              <button
                key={v}
                disabled={!active}
                onClick={() => handleQuickValue(v)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs font-medium hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "✓ Enregistrer le score"}
        </Button>
        <div className="flex gap-2">
          <button
            onClick={() => handleForfeit(1)}
            className="rounded-md border border-danger-50 px-2 py-1 text-xs text-danger-600 hover:bg-danger-50"
          >
            ⚠ Forf. {player1Name}
          </button>
          <button
            onClick={() => handleForfeit(2)}
            className="rounded-md border border-danger-50 px-2 py-1 text-xs text-danger-600 hover:bg-danger-50"
          >
            ⚠ Forf. {player2Name}
          </button>
        </div>
      </div>
    </Card>
  );
}
