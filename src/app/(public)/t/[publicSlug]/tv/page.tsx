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
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const slides = (data?.categories ?? []).flatMap((category) => {
    const items: { title: string; content: React.ReactNode }[] = [];
    if (category.pools.length > 0) {
      items.push({
        title: `${category.name} — Poules`,
        content: (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.pools.map((pool) => (
              <PoolDisplay key={pool.id} pool={pool} dark />
            ))}
          </div>
        ),
      });
    }
    if (category.bracketRounds) {
      items.push({
        title: `${category.name} — Tableau final`,
        content: <BracketDisplay rounds={category.bracketRounds} dark />,
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
    return (
      <div className="flex h-dvh flex-1 items-center justify-center bg-navy-950 text-navy-300">
        Chargement...
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex h-dvh flex-1 flex-col items-center justify-center gap-2 bg-navy-950 text-center text-navy-300">
        <span className="text-2xl font-bold text-white">{data.name}</span>
        <span>Rien à afficher pour le moment.</span>
      </div>
    );
  }

  const slide = slides[slideIndex % slides.length];

  return (
    <div className="flex h-dvh flex-1 flex-col gap-6 overflow-hidden bg-navy-950 px-10 py-8 text-white">
      <div className="flex shrink-0 items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <h2 className="text-lg text-accent-500">{slide.title}</h2>
        </div>
        <span className="text-2xl font-bold tabular-nums text-navy-300">{clock}</span>
      </div>
      <div className="flex-1 overflow-hidden">{slide.content}</div>
      <div className="flex shrink-0 justify-center gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i === slideIndex % slides.length ? "bg-accent-500" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
