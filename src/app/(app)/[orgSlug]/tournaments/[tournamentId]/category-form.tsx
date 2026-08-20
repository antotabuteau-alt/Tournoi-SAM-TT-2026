"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/actions/tournaments.actions";
import type { ActionResult } from "@/lib/action-result";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
      <Label>
        Nom (ex: Simple Messieurs)
        <Input type="text" name="name" required />
      </Label>

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

      {state && "error" in state && (
        <p className="text-sm text-danger-600">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Création..." : "Ajouter la catégorie"}
      </Button>
    </form>
  );
}
