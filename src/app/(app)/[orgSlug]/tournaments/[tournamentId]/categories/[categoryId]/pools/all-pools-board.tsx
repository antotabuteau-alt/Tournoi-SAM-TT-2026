"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateBracketAction } from "@/actions/bracket.actions";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/match-avatar";
import { Button } from "@/components/ui/button";
import { MatchScoreModal } from "../match-score-modal";

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
  poolGroups: initialPoolGroups,
  canGenerateBracket = false,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  bestOfSets: number;
  poolGroups: PoolGroupData[];
  canGenerateBracket?: boolean;
}) {
  const router = useRouter();
  const [poolGroups, setPoolGroups] = useState(initialPoolGroups);
  const [syncedProp, setSyncedProp] = useState(initialPoolGroups);
  if (initialPoolGroups !== syncedProp) {
    setSyncedProp(initialPoolGroups);
    setPoolGroups(initialPoolGroups);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const found = findMatch(poolGroups, selectedId);
  const selected = found?.match ?? null;
  const selectedPoolName = found?.poolName ?? "";

  const allPoolsDone = poolGroups.every(
    (g) => g.matches.length > 0 && g.matches.every((m) => m.status === "DONE" || m.status === "WALKOVER")
  );
  const [isGeneratingBracket, startGeneratingBracket] = useTransition();
  const [bracketError, setBracketError] = useState<string | null>(null);

  function handleGenerateBracket() {
    setBracketError(null);
    startGeneratingBracket(async () => {
      const res = await generateBracketAction(orgSlug, tournamentId, categoryId);
      if ("error" in res) {
        setBracketError(res.error);
        return;
      }
      router.push(`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket`);
    });
  }

  function patchMatch(
    matchId: string,
    sets: { player1Points: number; player2Points: number }[],
    forfeitSlot?: 1 | 2
  ) {
    setPoolGroups((prev) =>
      prev.map((g) => ({
        ...g,
        matches: g.matches.map((m) =>
          m.id === matchId
            ? { ...m, status: forfeitSlot ? "WALKOVER" : "DONE", sets: forfeitSlot ? [] : sets }
            : m
        ),
      }))
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {canGenerateBracket && allPoolsDone && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-success-200 bg-gradient-to-r from-success-50 to-accent-50 p-5 shadow-sm shadow-success-500/10">
          <div>
            <p className="text-base font-bold text-success-700">🎉 Toutes les poules sont terminées !</p>
            <p className="text-sm text-navy-500">Tu peux maintenant générer le tableau final directement d&apos;ici.</p>
            {bracketError && <p className="mt-1 text-sm text-danger-600">{bracketError}</p>}
          </div>
          <Button variant="accent" onClick={handleGenerateBracket} disabled={isGeneratingBracket}>
            🏆 {isGeneratingBracket ? "Génération..." : "Générer le tableau final"}
          </Button>
        </div>
      )}

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
                  {g.matches.length > 0 && (
                    <a
                      href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools/${g.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      title="Imprimer toutes les feuilles de match de cette poule"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-navy-300 hover:bg-white/10 hover:text-white"
                    >
                      🖨
                    </a>
                  )}
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
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-center border-l-4 transition-colors",
                        isSelected
                          ? "border-l-brand-500 bg-brand-50"
                          : done
                            ? "border-l-success-500 bg-success-50/60 hover:bg-success-50"
                            : "border-l-transparent hover:bg-surface-muted",
                        m.status === "WALKOVER" && "opacity-60"
                      )}
                    >
                      <button
                        onClick={() => setSelectedId(m.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left text-sm"
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
                      <a
                        href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/pools/${g.id}/matches/${m.id}/print`}
                        target="_blank"
                        rel="noreferrer"
                        title="Imprimer la feuille de match"
                        className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted hover:text-foreground"
                      >
                        🖨
                      </a>
                    </div>
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
      </div>

      {selected && (
        <MatchScoreModal
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          kind="pool"
          bestOfSets={bestOfSets}
          match={selected}
          contextLabel={selectedPoolName}
          onClose={() => setSelectedId(null)}
          onSubmitted={(sets) => patchMatch(selected.id, sets)}
          onForfeited={(slot) => patchMatch(selected.id, [], slot)}
        />
      )}
    </div>
  );
}
