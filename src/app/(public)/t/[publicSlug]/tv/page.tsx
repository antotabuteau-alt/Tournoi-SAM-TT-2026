"use client";

import { use, useEffect, useState } from "react";
import { useTournamentLiveData } from "@/hooks/use-tournament-live-data";
import { PoolDisplay } from "../pool-display";
import { BracketDisplay } from "../bracket-display";

const ROTATE_INTERVAL_MS = 10000;

export default function TvModePage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = use(params);
  const { data, isLoading } = useTournamentLiveData(publicSlug);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = (data?.categories ?? []).flatMap((category) => {
    const items: { title: string; content: React.ReactNode }[] = [];
    if (category.pools.length > 0) {
      items.push({
        title: `${category.name} — Poules`,
        content: (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.pools.map((pool) => (
              <PoolDisplay key={pool.id} pool={pool} />
            ))}
          </div>
        ),
      });
    }
    if (category.bracketRounds) {
      items.push({
        title: `${category.name} — Tableau final`,
        content: <BracketDisplay rounds={category.bracketRounds} />,
      });
    }
    return items;
  });

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (isLoading || !data) {
    return <p className="px-6 py-16 text-center text-foreground/60">Chargement...</p>;
  }

  if (slides.length === 0) {
    return (
      <p className="px-6 py-16 text-center text-foreground/60">
        Rien à afficher pour le moment.
      </p>
    );
  }

  const slide = slides[slideIndex % slides.length];

  return (
    <div className="flex flex-1 flex-col gap-8 px-10 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">{data.name}</h1>
        <h2 className="text-xl text-foreground/60">{slide.title}</h2>
      </div>
      <div className="flex-1">{slide.content}</div>
      <div className="flex justify-center gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i === slideIndex % slides.length ? "bg-foreground" : "bg-black/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
