"use client";

import { useState, useTransition } from "react";
import { createCategoryAction, type CreatedCategorySummary } from "@/actions/tournaments.actions";
import { weekendDatesOf, formatShortWallClockDate } from "@/lib/category-day";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type DayChoice = "SATURDAY" | "SUNDAY" | "NONE";

export function CategoryForm({
  orgSlug,
  tournamentId,
  tournamentDate,
  onCreated,
}: {
  orgSlug: string;
  tournamentId: string;
  tournamentDate: Date;
  onCreated?: (category: CreatedCategorySummary) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<DayChoice>("SATURDAY");
  const { saturday, sunday } = weekendDatesOf(tournamentDate);

  const dayOptions: { value: DayChoice; label: string; dot: string }[] = [
    { value: "SATURDAY", label: `Samedi ${formatShortWallClockDate(saturday)}`, dot: "bg-accent-500" },
    { value: "SUNDAY", label: `Dimanche ${formatShortWallClockDate(sunday)}`, dot: "bg-brand-500" },
    { value: "NONE", label: "Sans date", dot: "bg-navy-300" },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("day", day);
    startTransition(async () => {
      const res = await createCategoryAction(orgSlug, tournamentId, null, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (res.category) onCreated?.(res.category);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Label>
        Nom (ex: Simple Messieurs)
        <Input type="text" name="name" required />
      </Label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-navy-700">Jour</span>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDay(opt.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                day === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-border text-navy-600 hover:bg-surface-muted"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", opt.dot)} />
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-navy-400">
          L&apos;heure exacte se règle ensuite dans les réglages du tableau.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label>
          Format
          <Select name="format" defaultValue="POOLS_THEN_BRACKET">
            <option value="POOLS_THEN_BRACKET">Poules + tableau final</option>
            <option value="DIRECT_BRACKET">Élimination directe</option>
            <option value="POOLS_ONLY">Poules uniquement</option>
          </Select>
        </Label>

        <Label>
          Manches par match
          <Select name="bestOfSets" defaultValue={3}>
            <option value={3}>3 gagnantes (5 max)</option>
            <option value={4}>4 gagnantes (7 max)</option>
          </Select>
        </Label>

        <Label>
          Taille de poule visée
          <Input type="number" name="poolTargetSize" min={2} max={10} defaultValue={4} />
        </Label>

        <Label>
          Qualifiés par poule
          <Input type="number" name="poolQualifiersCount" min={1} max={4} defaultValue={2} />
        </Label>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Création..." : "Ajouter le tableau"}
      </Button>
    </form>
  );
}
