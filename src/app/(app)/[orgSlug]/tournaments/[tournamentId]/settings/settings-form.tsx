"use client";

import { useActionState } from "react";
import { updateTournamentSettingsAction } from "@/actions/tournament-settings.actions";
import type { ActionResult } from "@/lib/action-result";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  orgSlug,
  tournamentId,
  name,
  date,
  location,
}: {
  orgSlug: string;
  tournamentId: string;
  name: string;
  date: string;
  location: string;
}) {
  const action = updateTournamentSettingsAction.bind(null, orgSlug, tournamentId);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Label>
        Nom du tournoi
        <Input type="text" name="name" defaultValue={name} required />
      </Label>
      <Label>
        Date
        <Input type="date" name="date" defaultValue={date} required />
      </Label>
      <Label>
        Lieu
        <Input type="text" name="location" defaultValue={location} />
      </Label>

      {state && "error" in state && <p className="text-sm text-danger-600">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
