"use client";

import { use, useEffect, useRef, useState } from "react";
import { useTournamentLiveData } from "@/hooks/use-tournament-live-data";

function beep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

export default function CallBoardPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = use(params);
  const { data, isLoading } = useTournamentLiveData(publicSlug);
  const [clock, setClock] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const calls = data?.calls ?? [];

  useEffect(() => {
    if (!data) return;
    const currentIds = new Set(calls.map((c) => c.matchId));
    if (knownIdsRef.current === null) {
      knownIdsRef.current = currentIds;
      return;
    }
    const newOnes = calls.filter((c) => !knownIdsRef.current!.has(c.matchId));
    if (newOnes.length > 0) {
      if (audioCtxRef.current) {
        newOnes.forEach((_, i) => setTimeout(() => beep(audioCtxRef.current!), i * 350));
      }
      setFreshIds(new Set(newOnes.map((c) => c.matchId)));
      setTimeout(() => setFreshIds(new Set()), 8000);
    }
    knownIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function enableSound() {
    const ctx = new AudioContext();
    beep(ctx);
    audioCtxRef.current = ctx;
    setSoundEnabled(true);
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-dvh flex-1 items-center justify-center bg-navy-950 text-navy-300">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-1 flex-col gap-6 overflow-hidden bg-navy-950 px-10 py-8 text-white">
      <div className="flex shrink-0 items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <h2 className="text-lg text-accent-500">📢 Appels de matchs</h2>
        </div>
        <div className="flex items-center gap-3">
          {!soundEnabled && (
            <button
              onClick={enableSound}
              className="rounded-lg border border-accent-500 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-400 hover:bg-accent-500/20"
            >
              🔊 Activer le son
            </button>
          )}
          <span className="text-2xl font-bold tabular-nums text-navy-300">{clock}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {calls.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-navy-400">
            <span className="text-5xl">🏓</span>
            <span className="text-xl">Aucun match appelé pour le moment.</span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {calls.map((c) => {
              const isFresh = freshIds.has(c.matchId);
              return (
                <div
                  key={c.matchId}
                  className={`flex flex-col gap-2 rounded-2xl border-2 p-6 transition-colors ${
                    isFresh
                      ? "animate-pulse border-accent-400 bg-accent-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-bold text-white">
                      Table {c.tableNumber}
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
                      {c.categoryName}
                    </span>
                  </div>
                  <p className="text-2xl leading-snug font-bold">
                    {c.player1Name}
                    <span className="mx-2 text-navy-400">vs</span>
                    {c.player2Name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
