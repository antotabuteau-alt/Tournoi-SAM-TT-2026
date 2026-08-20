"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitPoolScoreAction,
  submitForfeitAction,
  setMatchRefereeAction,
} from "@/actions/matches.actions";
import { cn } from "@/lib/cn";

interface MatchData {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: string;
  refereeName: string | null;
  sets: { player1Points: number; player2Points: number }[];
}

const QUICK_VALUES = Array.from({ length: 16 }, (_, i) => i);

function initials(name: string, max = 12): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function buildSetRows(m: MatchData | null, maxSets: number): { p1: string; p2: string }[] {
  return Array.from({ length: maxSets }, (_, i) => {
    const s = m?.sets[i];
    return { p1: s ? String(s.player1Points) : "", p2: s ? String(s.player2Points) : "" };
  });
}

export function PoolScoreBoard({
  orgSlug,
  tournamentId,
  categoryId,
  poolGroupName,
  bestOfSets,
  matches,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  poolGroupName: string;
  bestOfSets: number;
  matches: MatchData[];
}) {
  const router = useRouter();
  const maxSets = bestOfSets * 2 - 1;

  const firstPending = matches.find((m) => m.status !== "DONE" && m.status !== "WALKOVER");
  const [selectedId, setSelectedId] = useState(firstPending?.id ?? matches[0]?.id ?? null);
  const selected = matches.find((m) => m.id === selectedId) ?? null;

  const [sets, setSets] = useState<{ p1: string; p2: string }[]>(() => buildSetRows(selected, maxSets));
  const [selectedIdForSets, setSelectedIdForSets] = useState(selectedId);
  const [active, setActive] = useState<{ index: number; side: 1 | 2 } | null>(null);
  const [referee, setReferee] = useState(selected?.refereeName ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Quand on sélectionne un autre match, on réinitialise le formulaire local
  // sur ses données (pattern "adjusting state on prop/selection change").
  if (selectedId !== selectedIdForSets) {
    setSelectedIdForSets(selectedId);
    setSets(buildSetRows(selected, maxSets));
    setReferee(selected?.refereeName ?? "");
    setActive(null);
    setError(null);
  }

  function updateSet(index: number, side: "p1" | "p2", value: string) {
    setSets((prev) =>
      prev.map((s, i) =>
        i === index ? (side === "p1" ? { p1: value, p2: s.p2 } : { p1: s.p1, p2: value }) : s
      )
    );
  }

  function handleQuickValue(value: number) {
    if (!active) return;
    updateSet(active.index, active.side === 1 ? "p1" : "p2", String(value));
  }

  // Manches gagnées à ce stade (pour le gros score en tête de panneau) et
  // numéro du prochain set à jouer, calculés à partir des lignes déjà remplies.
  let p1SetsWon = 0;
  let p2SetsWon = 0;
  let activeSetNumber = 1;
  for (let i = 0; i < sets.length; i++) {
    const a = Number(sets[i].p1);
    const b = Number(sets[i].p2);
    if (sets[i].p1 === "" || sets[i].p2 === "" || Number.isNaN(a) || Number.isNaN(b)) break;
    if (a > b) p1SetsWon += 1;
    else p2SetsWon += 1;
    activeSetNumber = i + 2;
  }
  if (activeSetNumber > maxSets) activeSetNumber = maxSets;

  function handleSubmit() {
    if (!selected) return;
    setError(null);
    const filled = sets
      .filter((s) => s.p1.trim() !== "" && s.p2.trim() !== "")
      .map((s) => ({ player1Points: Number(s.p1), player2Points: Number(s.p2) }));

    startTransition(async () => {
      const res = await submitPoolScoreAction(orgSlug, tournamentId, categoryId, selected.id, filled);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
      const idx = matches.findIndex((m) => m.id === selected.id);
      const next = matches.slice(idx + 1).find((m) => m.status !== "DONE" && m.status !== "WALKOVER");
      if (next) setSelectedId(next.id);
    });
  }

  function handleForfeit(slot: 1 | 2) {
    if (!selected) return;
    const name = slot === 1 ? selected.player1Name : selected.player2Name;
    if (!window.confirm(`Confirmer le forfait de ${name} ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await submitForfeitAction(orgSlug, tournamentId, categoryId, selected.id, "pool", slot);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRefereeBlur() {
    if (!selected) return;
    startTransition(async () => {
      await setMatchRefereeAction(orgSlug, categoryId, selected.id, referee);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-navy-950/[.03] lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col divide-y divide-border overflow-y-auto lg:max-h-[36rem] lg:border-r lg:border-border">
        {matches.map((m) => {
          const done = m.status === "DONE";
          const isSelected = m.id === selectedId;
          const score = done
            ? m.sets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ")
            : null;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                isSelected ? "bg-brand-50" : done ? "bg-success-50 hover:bg-success-100/70" : "hover:bg-surface-muted",
                m.status === "WALKOVER" && "opacity-60"
              )}
            >
              <span className="truncate font-medium">
                {m.player1Name} <span className="font-normal text-navy-400">vs</span> {m.player2Name}
              </span>
              {m.status === "WALKOVER" ? (
                <span className="shrink-0 text-xs font-semibold text-danger-600">Forfait</span>
              ) : score ? (
                <span className="shrink-0 font-semibold text-success-600">{score}</span>
              ) : (
                <span className="shrink-0 text-xs text-navy-400">à jouer</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 p-5">
        {!selected ? (
          <p className="text-sm text-navy-400">Sélectionne un match dans la liste.</p>
        ) : !selected.player1Id || !selected.player2Id ? (
          <p className="text-sm text-navy-400">Match incomplet.</p>
        ) : (
          <>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
                {poolGroupName}
              </p>
              <h2 className="text-lg font-bold leading-snug">
                {selected.player1Name} vs {selected.player2Name}
              </h2>
            </div>

            <label className="flex items-center gap-2 text-sm text-navy-400">
              🧑‍⚖️ Arbitre
              <input
                type="text"
                placeholder="nom…"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                onBlur={handleRefereeBlur}
                className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            </label>

            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <div className="flex items-center justify-center gap-3 text-2xl font-bold">
                <span className="truncate">{initials(selected.player1Name)}</span>
                <span>{p1SetsWon}</span>
                <span className="text-navy-300">—</span>
                <span>{p2SetsWon}</span>
                <span className="truncate">{initials(selected.player2Name)}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
                Set {activeSetNumber} · au meilleur des {maxSets}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 text-xs text-navy-400">Set {i + 1}</span>
                  <input
                    type="number"
                    min={0}
                    value={s.p1}
                    onFocus={() => setActive({ index: i, side: 1 })}
                    onChange={(e) => updateSet(i, "p1", e.target.value)}
                    className={cn(
                      "w-16 rounded-lg border px-2 py-1.5 text-center text-sm",
                      active?.index === i && active.side === 1
                        ? "border-brand-500 ring-2 ring-brand-400/20"
                        : "border-border"
                    )}
                  />
                  <span className="text-navy-300">–</span>
                  <input
                    type="number"
                    min={0}
                    value={s.p2}
                    onFocus={() => setActive({ index: i, side: 2 })}
                    onChange={(e) => updateSet(i, "p2", e.target.value)}
                    className={cn(
                      "w-16 rounded-lg border px-2 py-1.5 text-center text-sm",
                      active?.index === i && active.side === 2
                        ? "border-brand-500 ring-2 ring-brand-400/20"
                        : "border-border"
                    )}
                  />
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
                Saisie rapide
              </p>
              <div className="grid grid-cols-8 gap-1">
                {QUICK_VALUES.map((v) => (
                  <button
                    key={v}
                    disabled={!active}
                    onClick={() => handleQuickValue(v)}
                    className="flex h-8 w-full items-center justify-center rounded-md border border-border text-xs font-medium hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger-600">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 rounded-lg bg-success-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-success-600 disabled:opacity-50"
              >
                {isPending ? "..." : "✓ Valider"}
              </button>
            </div>

            <div className="border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold tracking-wide text-accent-600 uppercase">
                ⚠ Forfait
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleForfeit(1)}
                  className="rounded-lg border border-danger-50 bg-danger-50/40 px-2 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50"
                >
                  Forf. {selected.player1Name}
                </button>
                <button
                  onClick={() => handleForfeit(2)}
                  className="rounded-lg border border-danger-50 bg-danger-50/40 px-2 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50"
                >
                  Forf. {selected.player2Name}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
