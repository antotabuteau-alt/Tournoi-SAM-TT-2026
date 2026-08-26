"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitPoolScoreAction,
  submitBracketScoreAction,
  submitForfeitAction,
  setMatchRefereeAction,
  setMatchTableAction,
} from "@/actions/matches.actions";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/match-avatar";

export interface ModalMatchData {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  refereeName: string | null;
  tableNumber: number | null;
  sets: { player1Points: number; player2Points: number }[];
}

const QUICK_VALUES = Array.from({ length: 16 }, (_, i) => i);

function buildSetRows(m: ModalMatchData, maxSets: number): { p1: string; p2: string }[] {
  return Array.from({ length: maxSets }, (_, i) => {
    const s = m.sets[i];
    return { p1: s ? String(s.player1Points) : "", p2: s ? String(s.player2Points) : "" };
  });
}

// Première case (set/côté) encore vide, en parcourant les manches dans
// l'ordre (côté 1 puis côté 2 de chaque manche) — permet de cliquer un
// score rapide directement sans avoir à sélectionner un champ au préalable.
function nextEmptyCell(rows: { p1: string; p2: string }[]): { index: number; side: 1 | 2 } | null {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].p1 === "") return { index: i, side: 1 };
    if (rows[i].p2 === "") return { index: i, side: 2 };
  }
  return null;
}

// Élision "de"/"d'" devant une voyelle ou un h muet, pour "Victoire de/d' Nom".
function withDe(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`;
}

export function MatchScoreModal({
  orgSlug,
  tournamentId,
  categoryId,
  kind,
  bestOfSets,
  match,
  contextLabel,
  onClose,
  onSubmitted,
  onForfeited,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  kind: "pool" | "bracket";
  bestOfSets: number;
  match: ModalMatchData;
  contextLabel: string;
  onClose: () => void;
  // Mise a jour optimiste locale : cette version de Next.js ne rafraichit
  // pas toujours l'arbre client apres router.refresh() suite a une Server
  // Action (RSC frais recu mais jamais applique au DOM sans reload manuel).
  // Le parent patch donc sa propre copie des donnees en plus d'appeler refresh.
  onSubmitted?: (sets: { player1Points: number; player2Points: number }[]) => void;
  onForfeited?: (forfeitingSlot: 1 | 2) => void;
}) {
  const router = useRouter();
  const maxSets = bestOfSets * 2 - 1;
  const setsToWin = bestOfSets;

  const [sets, setSets] = useState<{ p1: string; p2: string }[]>(() => buildSetRows(match, maxSets));
  const [active, setActive] = useState<{ index: number; side: 1 | 2 } | null>(() =>
    nextEmptyCell(buildSetRows(match, maxSets))
  );
  const [referee, setReferee] = useState(match.refereeName ?? "");
  const [table, setTable] = useState(match.tableNumber ? String(match.tableNumber) : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateSet(index: number, side: "p1" | "p2", value: string) {
    setSets((prev) =>
      prev.map((s, i) =>
        i === index ? (side === "p1" ? { p1: value, p2: s.p2 } : { p1: s.p1, p2: value }) : s
      )
    );
  }

  // Sans champ selectionne manuellement, on cible automatiquement la
  // prochaine case vide : un clic sur "11" suffit, pas besoin de cliquer
  // dans la case avant. Apres saisie, la selection avance a la case
  // vide suivante pour enchainer les manches sans interaction superflue.
  function handleQuickValue(value: number) {
    const target = active ?? nextEmptyCell(sets);
    if (!target) return;
    const key = target.side === 1 ? "p1" : "p2";
    const updated = sets.map((s, i) => (i === target.index ? { ...s, [key]: String(value) } : s));
    setSets(updated);
    setActive(nextEmptyCell(updated));
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

  const winnerName =
    p1SetsWon >= setsToWin ? match.player1Name : p2SetsWon >= setsToWin ? match.player2Name : null;

  const submitScoreAction = kind === "pool" ? submitPoolScoreAction : submitBracketScoreAction;

  function handleSubmit() {
    setError(null);
    const filled = sets
      .filter((s) => s.p1.trim() !== "" && s.p2.trim() !== "")
      .map((s) => ({ player1Points: Number(s.p1), player2Points: Number(s.p2) }));

    startTransition(async () => {
      const res = await submitScoreAction(orgSlug, tournamentId, categoryId, match.id, filled);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onSubmitted?.(filled);
      router.refresh();
      onClose();
    });
  }

  function handleForfeit(slot: 1 | 2) {
    const name = slot === 1 ? match.player1Name : match.player2Name;
    if (!window.confirm(`Confirmer le forfait de ${name} ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await submitForfeitAction(orgSlug, tournamentId, categoryId, match.id, kind, slot);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onForfeited?.(slot);
      router.refresh();
      onClose();
    });
  }

  function handleRefereeBlur() {
    startTransition(async () => {
      await setMatchRefereeAction(orgSlug, categoryId, match.id, referee);
      router.refresh();
    });
  }

  function handleTableBlur() {
    const n = table.trim() === "" ? null : Number(table);
    startTransition(async () => {
      await setMatchTableAction(orgSlug, categoryId, match.id, n);
      router.refresh();
    });
  }

  if (!match.player1Id || !match.player2Id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-surface p-8 shadow-2xl">
          <p className="text-sm text-navy-400">Match incomplet.</p>
          <button
            onClick={onClose}
            className="self-end rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-surface p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">{contextLabel}</p>
            <h2 className="text-2xl font-bold leading-snug">
              {match.player1Name} vs {match.player2Name}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-navy-400">
              🟢
              <input
                type="number"
                min={1}
                placeholder="Table"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                onBlur={handleTableBlur}
                className="w-16 rounded-lg border border-border px-2 py-2 text-xs text-foreground"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-navy-400">
              🧑‍⚖️
              <input
                type="text"
                placeholder="Arbitre…"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                onBlur={handleRefereeBlur}
                className="w-32 rounded-lg border border-border px-2 py-2 text-xs text-foreground"
              />
            </label>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-navy-400 hover:bg-surface-muted hover:text-foreground"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-navy-950 to-navy-800 p-7 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
              <Avatar name={match.player1Name} size="xl" />
              <span className="max-w-full truncate text-base font-semibold">{match.player1Name}</span>
            </div>
            <div className="flex shrink-0 items-baseline gap-4 text-6xl font-black">
              <span>{p1SetsWon}</span>
              <span className="text-navy-400">—</span>
              <span>{p2SetsWon}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
              <Avatar name={match.player2Name} size="xl" />
              <span className="max-w-full truncate text-base font-semibold">{match.player2Name}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs font-semibold tracking-wide text-accent-400 uppercase">
            {winnerName ? "Match terminé" : `Set ${activeSetNumber} · au meilleur des ${maxSets}`}
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {sets.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-navy-400">Set {i + 1}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={s.p1}
                  onFocus={() => setActive({ index: i, side: 1 })}
                  onChange={(e) => updateSet(i, "p1", e.target.value)}
                  className={cn(
                    "w-14 rounded-lg border px-1 py-2.5 text-center text-base font-medium",
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
                    "w-14 rounded-lg border px-1 py-2.5 text-center text-base font-medium",
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
          <p className="mb-2 text-xs font-semibold tracking-wide text-navy-400 uppercase">Saisie rapide</p>
          <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
            {QUICK_VALUES.map((v) => (
              <button
                key={v}
                disabled={!active}
                onClick={() => handleQuickValue(v)}
                className="flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
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
            className={cn(
              "flex-1 rounded-xl px-4 py-3.5 text-sm font-bold transition-colors disabled:opacity-50",
              winnerName
                ? "bg-gradient-to-r from-accent-400 to-accent-500 text-navy-950 shadow-sm shadow-accent-500/40 hover:from-accent-500 hover:to-accent-500"
                : "bg-success-500 text-white hover:bg-success-600"
            )}
          >
            {isPending ? "..." : winnerName ? `👑 Victoire ${withDe(winnerName)}` : "✓ Valider le score"}
          </button>
          <button
            onClick={() => handleForfeit(1)}
            className="rounded-xl border border-danger-50 bg-danger-50/40 px-3 py-3 text-xs font-medium text-danger-600 hover:bg-danger-50"
          >
            ⚠ Forf. {match.player1Name}
          </button>
          <button
            onClick={() => handleForfeit(2)}
            className="rounded-xl border border-danger-50 bg-danger-50/40 px-3 py-3 text-xs font-medium text-danger-600 hover:bg-danger-50"
          >
            ⚠ Forf. {match.player2Name}
          </button>
        </div>
      </div>
    </div>
  );
}
