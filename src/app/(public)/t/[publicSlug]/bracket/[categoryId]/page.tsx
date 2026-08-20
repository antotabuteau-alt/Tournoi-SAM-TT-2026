"use client";

import { use } from "react";
import { useTournamentLiveData } from "@/hooks/use-tournament-live-data";
import { BracketDisplay } from "../../bracket-display";

export default function PublicBracketPage({
  params,
}: {
  params: Promise<{ publicSlug: string; categoryId: string }>;
}) {
  const { publicSlug, categoryId } = use(params);
  const { data, isLoading } = useTournamentLiveData(publicSlug);

  if (isLoading || !data) {
    return <p className="px-6 py-16 text-center text-foreground/60">Chargement...</p>;
  }

  const category = data.categories.find((c) => c.id === categoryId);
  if (!category || !category.bracketRounds) {
    return (
      <p className="px-6 py-16 text-center text-foreground/60">
        Tableau final pas encore disponible.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold">
        {data.name} — {category.name}
      </h1>
      <BracketDisplay rounds={category.bracketRounds} />
    </div>
  );
}
