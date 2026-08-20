"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPoolsAction } from "@/actions/pools.actions";
import { Button } from "@/components/ui/button";

export function ResetPoolsButton({
  orgSlug,
  tournamentId,
  categoryId,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !window.confirm(
        "Réinitialiser les poules supprime tous les matchs et scores déjà saisis. Continuer ?"
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await resetPoolsAction(orgSlug, tournamentId, categoryId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <Button variant="danger" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Réinitialisation..." : "↺ Réinitialiser les poules"}
      </Button>
    </div>
  );
}
