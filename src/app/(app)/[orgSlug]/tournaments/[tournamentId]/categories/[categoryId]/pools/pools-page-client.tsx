"use client";

import { useState } from "react";
import { PoolGenerationForm } from "./pool-generation-form";
import { PoolDndBoard } from "./pool-dnd-board";
import { AllPoolsBoard } from "./all-pools-board";
import { ResetPoolsButton } from "./reset-pools-button";
import type { DndPoolGroup, DndMember, BoardPoolGroup } from "@/lib/pool-board-data";

type View =
  | { kind: "form" }
  | { kind: "dnd"; poolGroups: DndPoolGroup[]; unassigned: DndMember[] }
  | { kind: "matches"; poolGroups: BoardPoolGroup[] };

export function PoolsPageClient({
  orgSlug,
  tournamentId,
  categoryId,
  bestOfSets,
  playerCount,
  poolTargetSize,
  initialView,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  bestOfSets: number;
  playerCount: number;
  poolTargetSize: number;
  initialView: View;
}) {
  const [view, setView] = useState<View>(initialView);
  // Resynchronise si le serveur renvoie un etat different (navigation fraiche,
  // ou router.refresh() qui finit par s'appliquer) - pattern "adjusting state
  // on prop change", sans quoi cet etat local resterait fige indefiniment.
  const [prevInitialView, setPrevInitialView] = useState(initialView);
  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView);
    setView(initialView);
  }

  if (view.kind === "form") {
    return (
      <PoolGenerationForm
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        playerCount={playerCount}
        poolTargetSize={poolTargetSize}
        onGenerated={(data) => setView({ kind: "dnd", ...data })}
      />
    );
  }

  if (view.kind === "dnd") {
    return (
      <PoolDndBoard
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        poolGroups={view.poolGroups}
        unassigned={view.unassigned}
        onMatchesGenerated={(poolGroups) => setView({ kind: "matches", poolGroups })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AllPoolsBoard
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        bestOfSets={bestOfSets}
        poolGroups={view.poolGroups}
      />
      <ResetPoolsButton
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        categoryId={categoryId}
        onReset={() => setView({ kind: "form" })}
      />
    </div>
  );
}
