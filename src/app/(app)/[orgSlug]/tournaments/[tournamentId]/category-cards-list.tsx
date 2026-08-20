"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StageTracker } from "@/components/ui/stage-tracker";
import { getCategoryStages } from "@/lib/category-stages";
import { categoryCta } from "@/lib/category-cta";
import { formatWallClockDateTime } from "@/lib/wall-clock";
import { cn } from "@/lib/cn";
import { CategoryActionsMenu } from "./category-actions-menu";

type DayFilter = "ALL" | "SATURDAY" | "SUNDAY" | "OTHER";

// Jour de la semaine dérivé de scheduledAt en lisant les chiffres "muraux"
// (getUTCDay), cohérent avec le reste de l'app qui ne fait jamais de vraie
// conversion de fuseau horaire sur ces dates de tableau.
function categoryDay(scheduledAt: Date | null): DayFilter {
  if (!scheduledAt) return "OTHER";
  const day = scheduledAt.getUTCDay();
  if (day === 6) return "SATURDAY";
  if (day === 0) return "SUNDAY";
  return "OTHER";
}

const FORMAT_LABELS: Record<string, string> = {
  POOLS_THEN_BRACKET: "Poules + tableau final",
  DIRECT_BRACKET: "Élimination directe",
  POOLS_ONLY: "Poules uniquement",
};

type BracketType = "CLASSIC" | "INTEGRAL_BY_LEVEL" | "INTEGRAL_OFFICIAL_FFTT" | "MAIN_PLUS_CONSOLATION";

export interface CategoryCardData {
  id: string;
  name: string;
  format: string;
  status: string;
  scheduledAt: Date | null;
  bracketType: BracketType;
  poolQualifiersCount: number;
  repechage: boolean;
  poolCount: number | null;
  tableRangeStart: number | null;
  tableRangeEnd: number | null;
  registrationCount: number;
}

export function CategoryCardsList({
  orgSlug,
  tournamentId,
  categories,
}: {
  orgSlug: string;
  tournamentId: string;
  categories: CategoryCardData[];
}) {
  const [items, setItems] = useState(categories);
  const [tab, setTab] = useState<DayFilter>("ALL");

  // Resynchronise avec les données serveur fraîches (ex: après router.refresh()
  // suite à une sauvegarde de réglages) — sans ça, le state local figé au premier
  // rendu masquerait indéfiniment les changements venus du serveur. Pattern
  // "adjusting state on prop change" recommandé par React (pas d'effect).
  const [prevCategories, setPrevCategories] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  if (items.length === 0) {
    return (
      <Card className="px-6 py-10 text-center text-navy-400">
        Aucune catégorie pour le moment.
      </Card>
    );
  }

  const counts = {
    ALL: items.length,
    SATURDAY: items.filter((c) => categoryDay(c.scheduledAt) === "SATURDAY").length,
    SUNDAY: items.filter((c) => categoryDay(c.scheduledAt) === "SUNDAY").length,
    OTHER: items.filter((c) => categoryDay(c.scheduledAt) === "OTHER").length,
  };
  const tabs: { key: DayFilter; label: string; dot?: string }[] = [
    { key: "ALL", label: "Tous" },
    { key: "SATURDAY", label: "Samedi", dot: "bg-accent-500" },
    { key: "SUNDAY", label: "Dimanche", dot: "bg-brand-500" },
    ...(counts.OTHER > 0 ? [{ key: "OTHER" as const, label: "Sans date", dot: "bg-navy-300" }] : []),
  ];
  const visible = tab === "ALL" ? items : items.filter((c) => categoryDay(c.scheduledAt) === tab);

  return (
    <>
      <div className="inline-flex w-fit flex-wrap items-center gap-0.5 rounded-xl bg-surface-muted p-1 shadow-inner shadow-navy-950/[.03]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
              tab === t.key
                ? "bg-surface text-foreground shadow-sm shadow-navy-950/10"
                : "text-navy-400 hover:text-foreground"
            )}
          >
            {t.dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />}
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                tab === t.key ? "bg-navy-950 text-white" : "bg-navy-950/[.08] text-navy-500"
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <Card className="px-6 py-10 text-center text-navy-400">
          Aucun tableau dans cet onglet.
        </Card>
      )}

      {visible.map((c) => {
        const cta = categoryCta(orgSlug, tournamentId, c.id, c.status, c.format, c.registrationCount);
        return (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  <span className="text-xs text-navy-400">{FORMAT_LABELS[c.format]}</span>
                </div>
                <p className="text-xs text-navy-400">
                  {c.registrationCount} joueur(s)
                  {c.scheduledAt && <> · prévu le {formatWallClockDateTime(c.scheduledAt)}</>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <LinkButton href={cta.href} size="sm">{cta.label}</LinkButton>
                <CategoryActionsMenu
                  orgSlug={orgSlug}
                  tournamentId={tournamentId}
                  categoryId={c.id}
                  categoryName={c.name}
                  scheduledAt={c.scheduledAt}
                  bracketType={c.bracketType}
                  poolQualifiersCount={c.poolQualifiersCount}
                  repechage={c.repechage}
                  poolCount={c.poolCount}
                  tableRangeStart={c.tableRangeStart}
                  tableRangeEnd={c.tableRangeEnd}
                  registrationCount={c.registrationCount}
                  onDeleted={() => setItems((prev) => prev.filter((item) => item.id !== c.id))}
                />
              </div>
            </div>
            <div className="mt-4">
              <StageTracker
                stages={getCategoryStages(c.status, c.format, c.registrationCount, {
                  orgSlug,
                  tournamentId,
                  categoryId: c.id,
                })}
              />
            </div>
          </Card>
        );
      })}
    </>
  );
}
