"use client";

import { useState, useTransition } from "react";
import { duplicateTournamentAction } from "@/actions/tournament-settings.actions";
import { Button } from "@/components/ui/button";

export function DuplicateTournamentButton({
  orgSlug,
  tournamentId,
}: {
  orgSlug: string;
  tournamentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Dupliquer ce tournoi ? Les tableaux (mêmes réglages) seront recréés, sans les joueurs ni les scores.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await duplicateTournamentAction(orgSlug, tournamentId);
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={handleClick} disabled={isPending} className="w-fit">
        {isPending ? "Duplication..." : "📋 Dupliquer ce tournoi"}
      </Button>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}
