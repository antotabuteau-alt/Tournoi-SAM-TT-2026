"use client";

import { useState } from "react";
import { GenerateTestPlayersButton } from "./generate-test-players-button";
import { PlayersList, type PlayerRow } from "./players-list";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";

export function PlayersPageClient({
  orgSlug,
  tournamentId,
  initialPlayers,
  addPlayerForm,
}: {
  orgSlug: string;
  tournamentId: string;
  initialPlayers: PlayerRow[];
  addPlayerForm: React.ReactNode;
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [prevInitial, setPrevInitial] = useState(initialPlayers);
  if (initialPlayers !== prevInitial) {
    setPrevInitial(initialPlayers);
    setPlayers(initialPlayers);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">📝 Inscriptions / Joueurs</h2>
          <p className="text-sm text-navy-400">{players.length} joueur(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GenerateTestPlayersButton
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            onGenerated={(created) =>
              setPlayers((prev) => [
                ...prev,
                ...created.map((p) => ({
                  id: p.id,
                  firstName: p.firstName,
                  lastName: p.lastName,
                  club: p.club,
                  checkedInAt: null,
                  conflictCategories: [],
                })),
              ])
            }
          />
          <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players/import`} variant="outline">
            📄 Importer un CSV
          </LinkButton>
          <LinkButton href={`/${orgSlug}/tournaments/${tournamentId}/players/badges/print`} variant="outline">
            🏷️ Étiquettes
          </LinkButton>
          <a
            href={`/api/tournaments/${tournamentId}/standings`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            📊 Classements (CSV)
          </a>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <PlayersList orgSlug={orgSlug} tournamentId={tournamentId} players={players} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-navy-400 uppercase">
            Ajouter un joueur
          </h2>
          {addPlayerForm}
        </Card>
      </div>
    </>
  );
}
