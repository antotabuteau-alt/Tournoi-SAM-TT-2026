"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StageTracker } from "@/components/ui/stage-tracker";
import { getCategoryStages } from "@/lib/category-stages";
import { categoryCta } from "@/lib/category-cta";
import { CategoryActionsMenu } from "./category-actions-menu";

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

  if (items.length === 0) {
    return (
      <Card className="px-6 py-10 text-center text-navy-400">
        Aucune catégorie pour le moment.
      </Card>
    );
  }

  return (
    <>
      {items.map((c) => {
        const cta = categoryCta(orgSlug, tournamentId, c.id, c.status, c.format, c.registrationCount);
        return (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  <span className="text-xs text-navy-400">{FORMAT_LABELS[c.format]}</span>
                </div>
                <p className="text-xs text-navy-400">{c.registrationCount} joueur(s)</p>
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
