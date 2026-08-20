"use client";

import { useActionState } from "react";
import { createTournamentAction } from "@/actions/tournaments.actions";
import type { ActionResult } from "@/lib/action-result";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TournamentForm({ orgSlug }: { orgSlug: string }) {
  const action = createTournamentAction.bind(null, orgSlug);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Label>
        Nom du tournoi
        <Input type="text" name="name" required />
      </Label>

      <Label>
        Date
        <Input type="date" name="date" required />
      </Label>

      <Label>
        Lieu (optionnel)
        <Input type="text" name="location" />
      </Label>

      {state && "error" in state && (
        <p className="text-sm text-danger-600">{state.error}</p>
      )}

      <Button type="submit" variant="accent" disabled={isPending} className="mt-2">
        {isPending ? "Création..." : "Créer le tournoi"}
      </Button>
    </form>
  );
}
