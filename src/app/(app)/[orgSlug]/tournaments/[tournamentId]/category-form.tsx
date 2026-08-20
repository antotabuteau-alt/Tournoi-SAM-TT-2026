"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/actions/tournaments.actions";
import type { ActionResult } from "@/lib/action-result";

export function CategoryForm({
  orgSlug,
  tournamentId,
}: {
  orgSlug: string;
  tournamentId: string;
}) {
  const action = createCategoryAction.bind(null, orgSlug, tournamentId);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nom (ex: Simple Messieurs)
        <input
          type="text"
          name="name"
          required
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Format
        <select
          name="format"
          defaultValue="POOLS_THEN_BRACKET"
          className="rounded-md border border-black/15 px-3 py-2"
        >
          <option value="POOLS_THEN_BRACKET">Poules + tableau final</option>
          <option value="DIRECT_BRACKET">Élimination directe</option>
          <option value="POOLS_ONLY">Poules uniquement</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Taille de poule visée
        <input
          type="number"
          name="poolTargetSize"
          min={2}
          max={10}
          defaultValue={4}
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Qualifiés par poule
        <input
          type="number"
          name="poolQualifiersCount"
          min={1}
          max={4}
          defaultValue={2}
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Manches par match
        <select
          name="bestOfSets"
          defaultValue={3}
          className="rounded-md border border-black/15 px-3 py-2"
        >
          <option value={3}>3 manches gagnantes (au meilleur des 5)</option>
          <option value={4}>4 manches gagnantes (au meilleur des 7)</option>
        </select>
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-background font-medium disabled:opacity-50"
      >
        {isPending ? "Création..." : "Ajouter la catégorie"}
      </button>
    </form>
  );
}
