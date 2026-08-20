"use client";

import useSWR from "swr";
import type { PublicTournamentState } from "@/lib/public-tournament-state";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.json() as Promise<PublicTournamentState>;
  });

export function useTournamentLiveData(publicSlug: string) {
  const { data, error, isLoading } = useSWR(
    `/api/public/tournaments/${publicSlug}/state`,
    fetcher,
    { refreshInterval: 4000 }
  );

  return { data, error, isLoading };
}
