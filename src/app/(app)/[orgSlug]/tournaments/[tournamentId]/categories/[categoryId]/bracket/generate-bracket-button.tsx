"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateBracketAction } from "@/actions/bracket.actions";

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
    <div className="flex flex-col items-start gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Génération..." : "Générer le tableau final"}
      </button>
    </div>
  );
}
