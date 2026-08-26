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

  const rounds = Object.entries(
    Object.groupBy(matches, (m) => m.round)
  ).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="flex justify-center gap-6 overflow-x-auto pb-4">
      {rounds.map(([round, roundMatches]) => (
        <div key={round} className="flex w-72 shrink-0 flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
            Tour {round}
          </h2>
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
                  className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-navy-400"
                >
                  En attente des matchs précédents
                </div>
              );
            }

            if (isBye) {
              const qualifiedName = m.player1Id ? m.player1Name : m.player2Name;
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-navy-400"
                >
                  {qualifiedName} — qualifié (exempt)
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-navy-950/[.04]",
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : done
                      ? "border-success-200 bg-success-50/60 hover:bg-success-50"
                      : "hover:bg-surface-muted",
                  m.status === "WALKOVER" && "opacity-60"
                )}
              >
                <button
                  onClick={() => setSelectedId(m.id)}
                  className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 text-left text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={m.player1Name} />
                    <span className="min-w-0 flex-1 truncate font-medium">{m.player1Name}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={m.player2Name} />
                    <span className="min-w-0 flex-1 truncate font-medium">{m.player2Name}</span>
                  </span>
                  {m.status === "WALKOVER" ? (
                    <span className="w-fit rounded-full bg-danger-50 px-2 py-1 text-[11px] font-bold text-danger-600">
                      Forfait
                    </span>
                  ) : score ? (
                    <span className="w-fit rounded-full bg-success-100 px-2 py-1 text-[11px] font-bold text-success-700">
                      ✓ {score}
                    </span>
                  ) : (
                    <span className="w-fit rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-navy-400">
                      à jouer
                    </span>
                  )}
                </button>
                <a
                  href={`/${orgSlug}/tournaments/${tournamentId}/categories/${categoryId}/bracket/matches/${m.id}/print`}
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
      ))}

      {selected && (
        <MatchScoreModal
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          kind="bracket"
          bestOfSets={bestOfSets}
          match={selected}
          contextLabel={`Tour ${selected.round}`}
          onClose={() => setSelectedId(null)}
          onSubmitted={(sets) => patchMatch(selected.id, sets)}
          onForfeited={(slot) => patchMatch(selected.id, [], slot)}
        />
      )}
    </div>
  );
}
