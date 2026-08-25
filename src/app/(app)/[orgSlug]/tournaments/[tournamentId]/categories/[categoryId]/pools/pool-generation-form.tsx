"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePoolsAction } from "@/actions/pools.actions";
import type { DndPoolGroup, DndMember } from "@/lib/pool-board-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function PoolGenerationForm({
  orgSlug,
  tournamentId,
  categoryId,
  playerCount,
  poolTargetSize,
  onGenerated,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  playerCount: number;
  poolTargetSize: number;
  onGenerated: (data: { poolGroups: DndPoolGroup[]; unassigned: DndMember[] }) => void;
}) {
  const router = useRouter();
  const suggestedCount = Math.max(1, Math.ceil(playerCount / poolTargetSize));
  const [poolCount, setPoolCount] = useState(suggestedCount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate(mode: "auto" | "manual") {
    setError(null);
    startTransition(async () => {
      const res = await generatePoolsAction(orgSlug, tournamentId, categoryId, mode, poolCount);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onGenerated({ poolGroups: res.poolGroups ?? [], unassigned: res.unassigned ?? [] });
      router.refresh();
    });
  }

  if (playerCount < 2) {
    return (
      <Card className="px-6 py-8 text-center text-navy-400">
        Inscris au moins 2 joueurs avant de générer les poules.
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <Label className="w-32">
        Nombre de poules
        <Input
          type="number"
          min={1}
          value={poolCount}
          onChange={(e) => setPoolCount(Number(e.target.value))}
        />
      </Label>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button variant="accent" onClick={() => generate("auto")} disabled={isPending}>
          🐍 Générer automatiquement (serpent)
        </Button>
        <Button variant="outline" onClick={() => generate("manual")} disabled={isPending}>
          Créer des poules vides (manuel)
        </Button>
      </div>
    </Card>
  );
}
