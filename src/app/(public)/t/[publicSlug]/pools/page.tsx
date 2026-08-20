"use client";

import { use } from "react";
import { useTournamentLiveData } from "@/hooks/use-tournament-live-data";
import { PoolDisplay } from "../pool-display";

export default function PublicPoolsPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = use(params);
  const { data, isLoading } = useTournamentLiveData(publicSlug);

  if (isLoading || !data) {
    return <p className="px-6 py-16 text-center text-foreground/60">Chargement...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <h1 className="text-2xl font-bold">{data.name} — Poules en direct</h1>
      {data.categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.pools.map((pool) => (
              <PoolDisplay key={pool.id} pool={pool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
