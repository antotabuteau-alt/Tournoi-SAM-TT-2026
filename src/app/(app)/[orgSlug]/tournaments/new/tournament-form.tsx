"use client";

import { useActionState } from "react";
import { createTournamentAction } from "@/actions/tournaments.actions";
import type { ActionResult } from "@/lib/action-result";

export function TournamentForm({ orgSlug }: { orgSlug: string }) {
  const action = createTournamentAction.bind(null, orgSlug);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nom du tournoi
        <input
          type="text"
          name="name"
          required
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Date
        <input
          type="date"
          name="date"
          required
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Lieu (optionnel)
        <input
          type="text"
          name="location"
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
        {isPending ? "Création..." : "Créer le tournoi"}
      </button>
    </form>
  );
}
