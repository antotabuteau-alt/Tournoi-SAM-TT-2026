"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { LinkButton } from "@/components/ui/link-button";
import { StageTracker } from "@/components/ui/stage-tracker";
import { getCategoryStages } from "@/lib/category-stages";
import { categoryCta } from "@/lib/category-cta";
import { formatWallClockDateTime } from "@/lib/wall-clock";
import { categoryDay, type CategoryDay } from "@/lib/category-day";
import { cn } from "@/lib/cn";
import { CategoryActionsMenu } from "./category-actions-menu";
import { CategoryPlayersModal } from "./category-players-modal";
import { CategoryForm } from "./category-form";
import type { CreatedCategorySummary } from "@/actions/tournaments.actions";

type DayFilter = "ALL" | CategoryDay;

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
  registeredPlayers: { id: string; firstName: string; lastName: string; rankingPoints: number | null }[];
}

const TAB_META: Record<DayFilter, { label: string; barColor: string; dotColor: string }> = {
  ALL: { label: "Tous les tableaux", barColor: "bg-navy-950", dotColor: "bg-navy-950" },
  SATURDAY: { label: "Samedi", barColor: "bg-accent-500", dotColor: "bg-accent-500" },
  SUNDAY: { label: "Dimanche", barColor: "bg-brand-500", dotColor: "bg-brand-500" },
  OTHER: { label: "Sans date", barColor: "bg-navy-300", dotColor: "bg-navy-300" },
};

export function CategoryCardsList({
  orgSlug,
  tournamentId,
  tournamentDate,
  playerCount,
  categories,
}: {
  orgSlug: string;
  tournamentId: string;
  tournamentDate: Date;
  playerCount: number;
  categories: CategoryCardData[];
}) {
  const [items, setItems] = useState(categories);
  const [tab, setTab] = useState<DayFilter>("ALL");
  const [playersModalCategoryId, setPlayersModalCategoryId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const playersModalCategory = items.find((c) => c.id === playersModalCategoryId) ?? null;

  function handleCreated(category: CreatedCategorySummary) {
    setItems((prev) => [
      ...prev,
      { ...category, registrationCount: 0, registeredPlayers: [] },
    ]);
    setCreateOpen(false);
  }

  // Resynchronise avec les données serveur fraîches (ex: après router.refresh()
  // suite à une sauvegarde de réglages) — sans ça, le state local figé au premier
  // rendu masquerait indéfiniment les changements venus du serveur. Pattern
  // "adjusting state on prop change" recommandé par React (pas d'effect).
  const [prevCategories, setPrevCategories] = useState(categories);
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  const counts = {
    ALL: items.length,
    SATURDAY: items.filter((c) => categoryDay(c.scheduledAt) === "SATURDAY").length,
    SUNDAY: items.filter((c) => categoryDay(c.scheduledAt) === "SUNDAY").length,
    OTHER: items.filter((c) => categoryDay(c.scheduledAt) === "OTHER").length,
  };
  const tabs: DayFilter[] = [
    "ALL",
    "SATURDAY",
    "SUNDAY",
    ...(counts.OTHER > 0 ? (["OTHER"] as const) : []),
  ];
  const visible = tab === "ALL" ? items : items.filter((c) => categoryDay(c.scheduledAt) === tab);
  const finishedVisible = visible.filter((c) => c.status === "FINISHED").length;

  function renderCard(c: CategoryCardData) {
    const cta = categoryCta(orgSlug, tournamentId, c.id, c.status, c.format, c.registrationCount);
    return (
      <Card key={c.id} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{c.name}</h3>
              <Badge variant={c.status === "FINISHED" ? "success" : "brand"}>
                {FORMAT_LABELS[c.format]}
              </Badge>
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
              onScheduleUpdated={(scheduledAt) =>
                setItems((prev) => prev.map((item) => (item.id === c.id ? { ...item, scheduledAt } : item)))
              }
              onNameUpdated={(name) =>
                setItems((prev) => prev.map((item) => (item.id === c.id ? { ...item, name } : item)))
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <StageTracker
            stages={getCategoryStages(c.status, c.format, c.registrationCount, {
              orgSlug,
              tournamentId,
              categoryId: c.id,
            }).map((stage) =>
              stage.label === "Joueurs"
                ? { ...stage, href: undefined, onClick: () => setPlayersModalCategoryId(c.id) }
                : stage
            )}
          />
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <StatTile label="Joueurs" value={playerCount} icon="👥" accent="brand" />
            <StatTile label="Tableaux" value={0} icon="🏓" accent="accent" />
            <StatTile label="Terminés" value={0} icon="✓" accent="success" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${orgSlug}/tournaments/${tournamentId}/players`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              📝 Joueurs du tournoi
            </Link>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
            >
              + Nouveau tableau
            </button>
          </div>
        </div>
        <Card className="px-6 py-10 text-center text-navy-400">
          Aucun tableau pour le moment.
        </Card>
        {createOpen && (
          <CreateCategoryModal
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            tournamentDate={tournamentDate}
            onClose={() => setCreateOpen(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <div className="flex divide-x divide-border">
          {tabs.map((key) => {
            const meta = TAB_META[key];
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 px-4 py-5 transition-colors",
                  active ? "bg-surface-muted" : "hover:bg-surface-muted/60"
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-2 text-base font-bold",
                    active ? "text-foreground" : "text-navy-400"
                  )}
                >
                  {key !== "ALL" && <span className={cn("h-2 w-2 rounded-full", meta.dotColor)} />}
                  {meta.label}
                </span>
                <span className="text-xs text-navy-400">
                  {counts[key]} tableau{counts[key] !== 1 ? "x" : ""}
                </span>
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-[3px] transition-opacity",
                    meta.barColor,
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <StatTile label="Joueurs" value={playerCount} icon="👥" accent="brand" />
          <StatTile label="Tableaux" value={visible.length} icon="🏓" accent="accent" />
          <StatTile label="Terminés" value={finishedVisible} icon="✓" accent="success" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/tournaments/${tournamentId}/players`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            📝 Joueurs du tournoi
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
          >
            + Nouveau tableau
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <Card className="px-6 py-10 text-center text-navy-400">
            Aucun tableau dans cet onglet.
          </Card>
        )}
        {visible.map(renderCard)}
      </div>

      {playersModalCategory && (
        <CategoryPlayersModal
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={playersModalCategory.id}
          categoryName={playersModalCategory.name}
          initialPlayers={playersModalCategory.registeredPlayers}
          onClose={() => setPlayersModalCategoryId(null)}
        />
      )}

      {createOpen && (
        <CreateCategoryModal
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          tournamentDate={tournamentDate}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function CreateCategoryModal({
  orgSlug,
  tournamentId,
  tournamentDate,
  onClose,
  onCreated,
}: {
  orgSlug: string;
  tournamentId: string;
  tournamentDate: Date;
  onClose: () => void;
  onCreated: (category: CreatedCategorySummary) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <button aria-label="Fermer" className="absolute inset-0" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">+ Nouveau tableau</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-surface-muted"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <CategoryForm
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          tournamentDate={tournamentDate}
          onCreated={onCreated}
        />
      </div>
    </div>
  );
}
