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

interface RankingRow {
  rank: number;
  playerName: string;
  wins: number;
  losses: number;
}

interface PoolGroupData {
  id: string;
  name: string;
  matches: MatchData[];
  ranking: RankingRow[];
}

const QUICK_VALUES = Array.from({ length: 16 }, (_, i) => i);

const AVATAR_COLORS = [
  "bg-brand-500", "bg-accent-500", "bg-success-500", "bg-danger-600",
  "bg-navy-700", "bg-purple-500", "bg-pink-500", "bg-teal-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-7 w-7 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-sm" };
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        avatarColor(name),
        sizeClasses[size]
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

function buildSetRows(m: MatchData | null, maxSets: number): { p1: string; p2: string }[] {
  return Array.from({ length: maxSets }, (_, i) => {
    const s = m?.sets[i];
    return { p1: s ? String(s.player1Points) : "", p2: s ? String(s.player2Points) : "" };
  });
}

function findMatch(poolGroups: PoolGroupData[], matchId: string | null) {
  if (!matchId) return null;
  for (const g of poolGroups) {
    const m = g.matches.find((x) => x.id === matchId);
    if (m) return { match: m, poolName: g.name };
  }
  return null;
}

const RANK_BADGE = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm shadow-amber-500/40",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm shadow-slate-400/40",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm shadow-orange-500/40",
];

function RankBadge({ rank }: { rank: number }) {
  const gradient = RANK_BADGE[rank - 1];
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        gradient ?? "bg-surface-muted text-navy-400"
      )}
    >
      {rank}
    </span>
  );
}

export function AllPoolsBoard({
  orgSlug,
  tournamentId,
  categoryId,
  bestOfSets,
  poolGroups,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  bestOfSets: number;
  poolGroups: PoolGroupData[];
}) {
  const router = useRouter();
  const maxSets = bestOfSets * 2 - 1;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const found = findMatch(poolGroups, selectedId);
  const selected = found?.match ?? null;
  const selectedPoolName = found?.poolName ?? "";

  const [sets, setSets] = useState<{ p1: string; p2: string }[]>(() => buildSetRows(selected, maxSets));
  const [selectedIdForSets, setSelectedIdForSets] = useState(selectedId);
  const [active, setActive] = useState<{ index: number; side: 1 | 2 } | null>(null);
  const [referee, setReferee] = useState(selected?.refereeName ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      const group = poolGroups.find((g) => g.matches.some((m) => m.id === selected.id));
      const idx = group?.matches.findIndex((m) => m.id === selected.id) ?? -1;
      const next = group?.matches.slice(idx + 1).find((m) => m.status !== "DONE" && m.status !== "WALKOVER");
      setSelectedId(next?.id ?? null);
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
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div className="flex flex-col gap-4">
        {poolGroups.map((g) => {
          const doneCount = g.matches.filter((m) => m.status === "DONE").length;
          const pct = g.matches.length > 0 ? Math.round((doneCount / g.matches.length) * 100) : 0;
          const complete = doneCount === g.matches.length && g.matches.length > 0;
          return (
            <div
              key={g.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-navy-950/[.04]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-navy-950 to-navy-800 px-4 py-3">
                <h3 className="text-sm font-bold text-white">{g.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                    <div
                      className={cn("h-full rounded-full", complete ? "bg-success-500" : "bg-accent-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      complete ? "bg-success-500/20 text-success-400" : "bg-white/10 text-navy-300"
                    )}
                  >
                    {doneCount}/{g.matches.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {g.matches.map((m) => {
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
                        "flex items-center gap-3 border-l-4 px-4 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "border-l-brand-500 bg-brand-50"
                          : done
                            ? "border-l-success-500 bg-success-50/60 hover:bg-success-50"
                            : "border-l-transparent hover:bg-surface-muted",
                        m.status === "WALKOVER" && "opacity-60"
                      )}
                    >
                      <Avatar name={m.player1Name} />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {m.player1Name} <span className="font-normal text-navy-400">vs</span> {m.player2Name}
                      </span>
                      <Avatar name={m.player2Name} />
                      {m.status === "WALKOVER" ? (
                        <span className="shrink-0 rounded-full bg-danger-50 px-2 py-1 text-[11px] font-bold text-danger-600">
                          Forfait
                        </span>
                      ) : score ? (
                        <span className="shrink-0 rounded-full bg-success-100 px-2 py-1 text-[11px] font-bold text-success-700">
                          ✓ {score}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-navy-400">
                          à jouer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-navy-950/[.04] lg:sticky lg:top-4">
        <p className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
          🏆 Classements — clique un match pour saisir un score
        </p>
        {poolGroups.map((g) => (
          <div key={g.id}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-500">{g.name}</p>
            <ol className="flex flex-col gap-1">
              {g.ranking.map((r) => (
                <li
                  key={r.rank}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <RankBadge rank={r.rank} />
                    <Avatar name={r.playerName} />
                    <span className="truncate font-medium">{r.playerName}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-navy-500">
                    {r.wins}V · {r.wins * 2 + r.losses}pts
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
          <div className="flex w-full max-w-3xl flex-col gap-4 rounded-3xl bg-surface p-6 shadow-2xl">
            {!selected.player1Id || !selected.player2Id ? (
              <p className="text-sm text-navy-400">Match incomplet.</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
                      {selectedPoolName}
                    </p>
                    <h2 className="text-xl font-bold leading-snug">
                      {selected.player1Name} vs {selected.player2Name}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-navy-400">
                      🧑‍⚖️
                      <input
                        type="text"
                        placeholder="Arbitre…"
                        value={referee}
                        onChange={(e) => setReferee(e.target.value)}
                        onBlur={handleRefereeBlur}
                        className="w-28 rounded-lg border border-border px-2 py-1.5 text-xs text-foreground"
                      />
                    </label>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-surface-muted hover:text-foreground"
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-navy-950 to-navy-800 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={selected.player1Name} size="lg" />
                      <span className="truncate text-base font-semibold">{selected.player1Name}</span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-3 text-4xl font-black">
                      <span>{p1SetsWon}</span>
                      <span className="text-navy-400">—</span>
                      <span>{p2SetsWon}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                      <span className="truncate text-right text-base font-semibold">{selected.player2Name}</span>
                      <Avatar name={selected.player2Name} size="lg" />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[11px] font-semibold tracking-wide text-accent-400 uppercase">
                    Set {activeSetNumber} · au meilleur des {maxSets}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {sets.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold text-navy-400">Set {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={s.p1}
                          onFocus={() => setActive({ index: i, side: 1 })}
                          onChange={(e) => updateSet(i, "p1", e.target.value)}
                          className={cn(
                            "w-11 rounded-lg border px-1 py-1.5 text-center text-sm",
                            active?.index === i && active.side === 1
                              ? "border-brand-500 ring-2 ring-brand-400/20"
                              : "border-border"
                          )}
                        />
                        <input
                          type="number"
                          min={0}
                          value={s.p2}
                          onFocus={() => setActive({ index: i, side: 2 })}
                          onChange={(e) => updateSet(i, "p2", e.target.value)}
                          className={cn(
                            "w-11 rounded-lg border px-1 py-1.5 text-center text-sm",
                            active?.index === i && active.side === 2
                              ? "border-brand-500 ring-2 ring-brand-400/20"
                              : "border-border"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
                    Saisie rapide
                  </p>
                  <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
                    {QUICK_VALUES.map((v) => (
                      <button
                        key={v}
                        disabled={!active}
                        onClick={() => handleQuickValue(v)}
                        className="flex h-8 items-center justify-center rounded-md border border-border text-xs font-medium hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-danger-600">{error}</p>}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-success-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-success-600 disabled:opacity-50"
                  >
                    {isPending ? "..." : "✓ Valider le score"}
                  </button>
                  <button
                    onClick={() => handleForfeit(1)}
                    className="rounded-xl border border-danger-50 bg-danger-50/40 px-3 py-3 text-xs font-medium text-danger-600 hover:bg-danger-50"
                  >
                    ⚠ Forf. {selected.player1Name}
                  </button>
                  <button
                    onClick={() => handleForfeit(2)}
                    className="rounded-xl border border-danger-50 bg-danger-50/40 px-3 py-3 text-xs font-medium text-danger-600 hover:bg-danger-50"
                  >
                    ⚠ Forf. {selected.player2Name}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
