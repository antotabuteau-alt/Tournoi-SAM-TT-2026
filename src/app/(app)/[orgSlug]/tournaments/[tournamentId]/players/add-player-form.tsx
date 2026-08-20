"use client";

import { useActionState, useEffect, useRef } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  // Vide le formulaire après un ajout réussi : sans ça, les champs gardent
  // les valeurs du joueur précédent et rien n'indique visuellement que
  // l'ajout a bien eu lieu, en dehors du saut dans la liste triée.
  useEffect(() => {
    if (state && "success" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
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
