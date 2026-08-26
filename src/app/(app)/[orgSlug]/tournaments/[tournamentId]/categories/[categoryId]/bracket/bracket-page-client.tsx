"use client";

import { useState } from "react";
import { GenerateBracketButton } from "./generate-bracket-button";
import { BracketBoard } from "./bracket-board";
import { Card } from "@/components/ui/card";
import type { BracketBoardMatch } from "@/lib/bracket-board-data";

export function BracketPageClient({
  orgSlug,
  tournamentId,
  categoryId,
  bestOfSets,
  initialMatches,
}: {
  orgSlug: string;
  tournamentId: string;
  categoryId: string;
  bestOfSets: number;
  initialMatches: BracketBoardMatch[];
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [prevInitial, setPrevInitial] = useState(initialMatches);
  if (initialMatches !== prevInitial) {
    setPrevInitial(initialMatches);
    setMatches(initialMatches);
  }

  if (matches.length === 0) {
    return (
      <Card className="px-6 py-10 text-center">
        <GenerateBracketButton
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          categoryId={categoryId}
          onGenerated={setMatches}
        />
      </Card>
    );
  }

  return (
    <BracketBoard
      orgSlug={orgSlug}
      tournamentId={tournamentId}
      categoryId={categoryId}
      bestOfSets={bestOfSets}
      matches={matches}
    />
  );
}
