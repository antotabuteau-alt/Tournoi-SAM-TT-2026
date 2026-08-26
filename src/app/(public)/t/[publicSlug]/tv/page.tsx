"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTournamentLiveData } from "@/hooks/use-tournament-live-data";
import { categoryDay, type CategoryDay } from "@/lib/category-day";
import { cn } from "@/lib/cn";
import { PoolDisplay } from "../pool-display";
import { BracketDisplay } from "../bracket-display";

const ROTATE_INTERVAL_MS = 10000;
const STORAGE_KEY = "tv-day-filter";

type DayFilter = "ALL" | CategoryDay;

const DAY_META: Record<DayFilter, { label: string; dot: string }> = {
  ALL: { label: "Tous", dot: "bg-navy-300" },
  SATURDAY: { label: "Samedi", dot: "bg-accent-500" },
  SUNDAY: { label: "Dimanche", dot: "bg-brand-500" },
  OTHER: { label: "Sans date", dot: "bg-navy-300" },
};

function isDayFilter(v: string | null): v is DayFilter {
  return v === "ALL" || v === "SATURDAY" || v === "SUNDAY" || v === "OTHER";
}

export default function TvModePage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = use(params);
  const searchParams = useSearchParams();
  const { data, isLoading } = useTournamentLiveData(publicSlug);
  const [slideIndex, setSlideIndex] = useState(0);
  const [clock, setClock] = useState("");
  const [dayFilter, setDayFilter] = useState<DayFilter>(() => {
    const fromQuery = searchParams.get("day");
    if (isDayFilter(fromQuery)) return fromQuery;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return isDayFilter(stored) ? stored : "ALL";
  });

  function selectDay(d: DayFilter) {
    setDayFilter(d);
    window.localStorage.setItem(STORAGE_KEY, d);
    setSlideIndex(0);
  }

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const filteredCategories = (data?.categories ?? []).filter(
    (c) => dayFilter === "ALL" || categoryDay(c.scheduledAt) === dayFilter
  );

  const slides = filteredCategories.flatMap((category) => {
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

  const daySelector = (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {(["ALL", "SATURDAY", "SUNDAY"] as const).map((d) => (
        <button
          key={d}
          onClick={() => selectDay(d)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            dayFilter === d ? "bg-white text-navy-950" : "text-navy-300 hover:text-white"
          )}
        >
          {d !== "ALL" && <span className={cn("h-1.5 w-1.5 rounded-full", DAY_META[d].dot)} />}
          {DAY_META[d].label}
        </button>
      ))}
    </div>
  );

  if (slides.length === 0) {
    return (
      <div className="flex h-dvh flex-1 flex-col items-center justify-center gap-4 bg-navy-950 text-center text-navy-300">
        <span className="text-2xl font-bold text-white">{data.name}</span>
        <span>Rien à afficher pour le moment.</span>
        {daySelector}
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
        <div className="flex items-center gap-4">
          {daySelector}
          <span className="text-2xl font-bold tabular-nums text-navy-300">{clock}</span>
        </div>
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
