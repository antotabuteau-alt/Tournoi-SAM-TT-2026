"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/match-avatar";
import { MatchScoreModal } from "../match-score-modal";

interface BracketMatchData {
  id: string;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: string;
  refereeName: string | null;
  sets: { player1Points: number; player2Points: number }[];
}

function findMatch(matches: BracketMatchData[], matchId: string | null) {
  if (!matchId) return null;
  return matches.find((m) => m.id === matchId) ?? null;
}

function roundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return "🏆 Finale";
  if (fromFinal === 1) return "Demi-finales";
  if (fromFinal === 2) return "Quarts de finale";
  if (fromFinal === 3) return "8e de finale";
  if (fromFinal === 4) return "16e de finale";
  return `Tour ${round}`;
}

export function BracketBoard({
  orgSlug,
  tournamentId,
  categoryId,
  bestOfSets,
  matches: initialMatches,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  bestOfSets: number;
  matches: BracketMatchData[];
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [syncedProp, setSyncedProp] = useState(initialMatches);
  if (initialMatches !== syncedProp) {
    setSyncedProp(initialMatches);
    setMatches(initialMatches);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = findMatch(matches, selectedId);

  function patchMatch(
    matchId: string,
    sets: { player1Points: number; player2Points: number }[],
    forfeitSlot?: 1 | 2
  ) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: forfeitSlot ? "WALKOVER" : "DONE", sets: forfeitSlot ? [] : sets }
          : m
      )
    );
  }

  const rounds = Object.entries(Object.groupBy(matches, (m) => m.round)).sort(
    ([a], [b]) => Number(a) - Number(b)
  );
  const totalRounds = rounds.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="mx-auto flex w-fit items-stretch gap-8 px-2">
        {rounds.map(([round, roundMatches]) => (
          <div key={round} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="rounded-xl bg-gradient-to-r from-navy-950 to-navy-800 px-4 py-2.5 text-center">
              <h2 className="text-xs font-bold tracking-wide text-white uppercase">
                {roundName(Number(round), totalRounds)}
              </h2>
            </div>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {roundMatches?.map((m) => {
                const bothUnknown = !m.player1Id && !m.player2Id;
                const isBye = !bothUnknown && (m.status === "BYE" || !m.player1Id || !m.player2Id);
                const done = m.status === "DONE";
                const isSelected = m.id === selectedId;
                const score = done
                  ? m.sets.map((s) => `${s.player1Points}-${s.player2Points}`).join(", ")
                  : null;

                if (bothUnknown) {
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/60 px-4 py-5 text-center text-xs text-navy-400"
                    >
                      ⏳ En attente des matchs précédents
                    </div>
                  );
                }

                if (isBye) {
                  const qualifiedName = m.player1Id ? m.player1Name : m.player2Name;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-4"
                    >
                      <Avatar name={qualifiedName} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-700">
                        {qualifiedName}
                      </span>
                      <span className="shrink-0 rounded-full bg-brand-100 px-2 py-1 text-[10px] font-bold text-brand-700">
                        Exempt
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "overflow-hidden rounded-2xl border shadow-sm transition-colors",
                      isSelected
                        ? "border-brand-500 bg-brand-50 shadow-brand-500/10"
                        : done
                          ? "border-success-200 bg-success-50/60 shadow-navy-950/[.03] hover:bg-success-50"
                          : "border-border bg-surface shadow-navy-950/[.03] hover:border-brand-200 hover:bg-surface-muted",
                      m.status === "WALKOVER" && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => setSelectedId(m.id)}
                      className="flex w-full flex-col text-left text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2.5 px-4 pt-3 pb-2">
                        <Avatar name={m.player1Name} />
                        <span className="min-w-0 flex-1 truncate font-semibold">{m.player1Name}</span>
                      </span>
                      <div className="mx-4 h-px bg-border" />
                      <span className="flex min-w-0 items-center gap-2.5 px-4 pt-2 pb-3">
                        <Avatar name={m.player2Name} />
                        <span className="min-w-0 flex-1 truncate font-semibold">{m.player2Name}</span>
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-black/[.015] px-4 py-2">
                      {m.status === "WALKOVER" ? (
                        <span className="rounded-full bg-danger-50 px-2 py-1 text-[11px] font-bold text-danger-600">
                          Forfait
                        </span>
                      ) : score ? (
                        <span className="rounded-full bg-success-100 px-2 py-1 text-[11px] font-bold text-success-700">
                          ✓ {score}
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-navy-400">
                          à jouer
                        </span>
                      )}
                      <a
                        href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket/matches/${m.id}/print`}
                        target="_blank"
                        rel="noreferrer"
                        title="Imprimer la feuille de match"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-surface hover:text-foreground"
                      >
                        🖨
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <MatchScoreModal
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          kind="bracket"
          bestOfSets={bestOfSets}
          match={selected}
          contextLabel={roundName(selected.round, totalRounds)}
          onClose={() => setSelectedId(null)}
          onSubmitted={(sets) => patchMatch(selected.id, sets)}
          onForfeited={(slot) => patchMatch(selected.id, [], slot)}
        />
      )}
    </div>
  );
}
