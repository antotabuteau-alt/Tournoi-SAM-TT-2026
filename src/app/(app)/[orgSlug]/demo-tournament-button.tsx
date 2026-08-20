"use client";

import { useState, useTransition } from "react";
import { createDemoTournamentAction } from "@/actions/demo.actions";
import { Button } from "@/components/ui/button";

export function DemoTournamentButton({ orgSlug }: { orgSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await createDemoTournamentAction(orgSlug);
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? "Génération..." : "✨ Tournoi de démonstration"}
      </Button>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
