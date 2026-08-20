"use client";

import { useActionState } from "react";
import { addPlayerAction } from "@/actions/players.actions";
import type { ActionResult } from "@/lib/action-result";

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
        <label className="flex flex-col gap-1 text-sm">
          Prénom
          <input
            type="text"
            name="firstName"
            required
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nom
          <input
            type="text"
            name="lastName"
            required
            className="rounded-md border border-black/15 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Club
        <input
          type="text"
          name="club"
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        N° de licence
        <input
          type="text"
          name="licenseNumber"
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-background font-medium disabled:opacity-50"
      >
        {isPending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
