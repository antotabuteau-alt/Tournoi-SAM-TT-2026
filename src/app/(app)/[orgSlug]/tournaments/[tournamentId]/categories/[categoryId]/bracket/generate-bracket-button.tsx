"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateBracketAction } from "@/actions/bracket.actions";
import { Button } from "@/components/ui/button";

export function GenerateBracketButton({
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
    setError(null);
    startTransition(async () => {
      const res = await generateBracketAction(orgSlug, tournamentId, categoryId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <Button variant="accent" size="lg" onClick={handleClick} disabled={isPending}>
        🏆 {isPending ? "Génération..." : "Générer le tableau final"}
      </Button>
    </div>
  );
}
