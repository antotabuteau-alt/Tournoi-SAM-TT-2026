"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateCategoryScheduleAction,
  updateCategoryBracketTypeAction,
  updateCategoryPoolRulesAction,
} from "@/actions/category-settings.actions";

type BracketType = "CLASSIC" | "INTEGRAL_BY_LEVEL" | "INTEGRAL_OFFICIAL_FFTT" | "MAIN_PLUS_CONSOLATION";

const BRACKET_TYPES: {
  value: BracketType;
  label: string;
  description: string;
  available: boolean;
}[] = [
  {
    value: "CLASSIC",
    label: "Classique",
    description: "Seuls les qualifiés jouent les finales.",
    available: true,
  },
  {
    value: "INTEGRAL_BY_LEVEL",
    label: "Intégral par niveau",
    description: "Top N globaux ensemble. Peu de byes, rankings approximatifs.",
    available: false,
  },
  {
    value: "INTEGRAL_OFFICIAL_FFTT",
    label: "Intégral officiel (FFTT)",
    description: "1ers ensemble, 2èmes ensemble... rankings stricts.",
    available: false,
  },
  {
    value: "MAIN_PLUS_CONSOLATION",
    label: "Principal + consolante",
    description: "Principal (qualifiés) + consolante (le reste) : personne n'est éliminé, chacun finit à une place précise (1→N).",
    available: false,
  },
];

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}
function toTimeInputValue(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(11, 16);
}

export function CategorySettingsPanel({
  orgSlug,
  tournamentId,
  categoryId,
  scheduledAt,
  bracketType,
  poolQualifiersCount,
  repechage,
  poolCount,
  tableRangeStart,
  tableRangeEnd,
  registrationCount,
  onClose,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  scheduledAt: Date | null;
  bracketType: BracketType;
  poolQualifiersCount: number;
  repechage: boolean;
  poolCount: number | null;
  tableRangeStart: number | null;
  tableRangeEnd: number | null;
  registrationCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [date, setDate] = useState(toDateInputValue(scheduledAt));
  const [time, setTime] = useState(toTimeInputValue(scheduledAt));
  const [type, setType] = useState<BracketType>(bracketType);
  const [qualifiers, setQualifiers] = useState(poolQualifiersCount);
  const [rep, setRep] = useState(repechage);
  const [pools, setPools] = useState(poolCount ?? recommendedPoolCount(registrationCount));
  const [tableStart, setTableStart] = useState(tableRangeStart ?? 1);
  const [tableEnd, setTableEnd] = useState(tableRangeEnd ?? pools);

  const recommendedPools = useMemo(() => recommendedPoolCount(registrationCount), [registrationCount]);
  const playersPerPool = pools > 0 ? registrationCount / pools : 0;

  function recommendedPoolCount(count: number): number {
    if (count <= 0) return 1;
    return Math.max(1, Math.ceil(count / 4));
  }

  function runAction(
    key: string,
    action: (formData: FormData) => Promise<{ error: string } | { success: true }>,
    formData: FormData
  ) {
    setErrors((e) => ({ ...e, [key]: "" }));
    startTransition(async () => {
      const res = await action(formData);
      if ("error" in res) {
        setErrors((e) => ({ ...e, [key]: res.error }));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-navy-950/40"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">⚙ Paramètres</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <form
          action={(fd) => runAction("schedule", (f) => updateCategoryScheduleAction(orgSlug, tournamentId, categoryId, f), fd)}
          className="mb-8 flex flex-col gap-3 border-b border-border pb-6"
        >
          <h3 className="text-sm font-semibold text-navy-700">📅 Date &amp; heure</h3>
          <div className="flex gap-2">
            <input
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-28 rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              className="rounded-md border border-border px-2 py-1 font-medium hover:bg-surface-muted"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => setTime(new Date().toISOString().slice(11, 16))}
              className="rounded-md border border-border px-2 py-1 font-medium hover:bg-surface-muted"
            >
              Maintenant
            </button>
          </div>
          {errors.schedule && <p className="text-xs text-danger-600">{errors.schedule}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            💾 Enregistrer
          </button>
        </form>

        <form
          action={(fd) => runAction("type", (f) => updateCategoryBracketTypeAction(orgSlug, tournamentId, categoryId, f), fd)}
          className="mb-8 flex flex-col gap-3 border-b border-border pb-6"
        >
          <h3 className="text-sm font-semibold text-navy-700">🏆 Type de tableau</h3>
          <input type="hidden" name="bracketType" value={type} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BRACKET_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                disabled={!bt.available}
                onClick={() => setType(bt.value)}
                className={`rounded-xl border p-3 text-left text-xs transition-colors ${
                  type === bt.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:bg-surface-muted"
                } ${!bt.available ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-foreground">{bt.label}</span>
                  {!bt.available && (
                    <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-medium text-navy-500">
                      Bientôt
                    </span>
                  )}
                </div>
                <p className="mt-1 text-navy-400">{bt.description}</p>
              </button>
            ))}
          </div>

          <label className="mt-2 flex flex-col gap-1 text-xs font-medium text-navy-700">
            Qualifiés par poule
            <input
              type="number"
              name="poolQualifiersCount"
              min={1}
              max={8}
              value={qualifiers}
              onChange={(e) => setQualifiers(Number(e.target.value))}
              className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-start gap-2 rounded-lg bg-accent-50 p-3 text-xs">
            <input
              type="checkbox"
              name="repechage"
              checked={rep}
              onChange={(e) => setRep(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-foreground">Repêchage</span> — byes remplis par
              les meilleurs éliminés
              <br />
              <span className="text-accent-600">Affrontent les têtes de série au 1er tour.</span>
            </span>
          </label>

          {errors.type && <p className="text-xs text-danger-600">{errors.type}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            💾 Enregistrer le type
          </button>
        </form>

        <form
          action={(fd) => runAction("rules", (f) => updateCategoryPoolRulesAction(orgSlug, tournamentId, categoryId, f), fd)}
          className="flex flex-col gap-4"
        >
          <h3 className="text-sm font-semibold text-navy-700">🎮 Règles du jeu</h3>

          <div>
            <label className="flex flex-col gap-1 text-xs font-medium text-navy-700">
              Nombre de poules
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="poolCount"
                  min={1}
                  max={64}
                  value={pools}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPools(v);
                    setTableEnd(v);
                  }}
                  className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPools(recommendedPools);
                    setTableEnd(recommendedPools);
                  }}
                  className="rounded-md bg-accent-50 px-2 py-1.5 text-xs font-semibold text-accent-600"
                >
                  ⭐ Recommandé
                </button>
              </div>
            </label>
            {registrationCount > 0 && (
              <p className="mt-1 text-[11px] text-navy-400">
                {playersPerPool.toFixed(1)} joueurs/poule — {registrationCount} inscrit(s)
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-navy-700">Tables réservées aux poules</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-navy-400">De</span>
              <input
                type="number"
                name="tableRangeStart"
                min={1}
                value={tableStart}
                onChange={(e) => setTableStart(Number(e.target.value))}
                className="w-16 rounded-lg border border-border px-2 py-2 text-sm"
              />
              <span className="text-xs text-navy-400">à</span>
              <input
                type="number"
                name="tableRangeEnd"
                min={1}
                value={tableEnd}
                onChange={(e) => setTableEnd(Number(e.target.value))}
                className="w-16 rounded-lg border border-border px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setTableStart(1);
                  setTableEnd(pools);
                }}
                className="rounded-md bg-accent-50 px-2 py-1.5 text-xs font-semibold text-accent-600"
              >
                ⭐ Recommandé
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from({ length: Math.min(tableEnd - tableStart + 1, 32) }, (_, i) => tableStart + i).map(
                (n) => (
                  <span
                    key={n}
                    className="flex h-6 w-8 items-center justify-center rounded border border-border text-[10px] font-medium text-navy-500"
                  >
                    T{n}
                  </span>
                )
              )}
            </div>
          </div>

          {errors.rules && <p className="text-xs text-danger-600">{errors.rules}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            💾 Enregistrer les règles
          </button>
        </form>
      </div>
    </div>
  );
}
