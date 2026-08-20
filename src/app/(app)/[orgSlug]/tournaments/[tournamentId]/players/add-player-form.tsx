"use client";

import { useActionState } from "react";
import { addPlayerAction } from "@/actions/players.actions";
import type { ActionResult } from "@/lib/action-result";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddPlayerForm({
  orgSlug,
  tournamentId,
}: {
  orgSlug: string;
  tournamentId: string;
}) {
  const action = addPlayerAction.bind(null, orgSlug, tournamentId);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Label>
          Prénom
          <Input type="text" name="firstName" required />
        </Label>
        <Label>
          Nom
          <Input type="text" name="lastName" required />
        </Label>
      </div>

      <Label>
        Club
        <Input type="text" name="club" />
      </Label>

      <Label>
        N° de licence
        <Input type="text" name="licenseNumber" />
      </Label>

      {state && "error" in state && (
        <p className="text-sm text-danger-600">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Ajout..." : "+ Ajouter"}
      </Button>
    </form>
  );
}
