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
    return <p className="px-6 py-16 text-center text-navy-400">Chargement...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-2xl font-bold">{data.name} — Poules en direct</h1>
      {data.categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-navy-400 uppercase">
            {category.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.pools.map((pool) => (
              <PoolDisplay key={pool.id} pool={pool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
