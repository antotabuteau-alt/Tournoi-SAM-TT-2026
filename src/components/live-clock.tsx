"use client";

import { useEffect, useState } from "react";

function greeting(hour: number): string {
  if (hour < 6) return "Bonne nuit";
  if (hour < 18) return "Bonjour";
  return "Bonsoir";
}

export function LiveClock({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="py-10" />;

  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <span className="text-2xl">🏓</span>
      <span className="text-6xl font-bold tracking-tight text-foreground">{time}</span>
      <span className="capitalize text-navy-400">{date}</span>
      <span className="mt-2 text-sm text-navy-400">
        {greeting(now.getHours())}, {name} — bon tournoi ! 💗
      </span>
    </div>
  );
}
