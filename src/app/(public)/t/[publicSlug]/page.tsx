import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTournamentState } from "@/lib/public-tournament-state";

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const state = await getPublicTournamentState(publicSlug);
  if (!state) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold">{state.name}</h1>
        <p className="text-foreground/60">
          {new Date(state.date).toLocaleDateString("fr-FR")}
          {state.location ? ` · ${state.location}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/t/${publicSlug}/pools`}
          className="rounded-md border border-black/10 px-4 py-2"
        >
          Poules en direct
        </Link>
        <Link
          href={`/t/${publicSlug}/tv`}
          className="rounded-md border border-black/10 px-4 py-2"
        >
          Mode TV
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Catégories</h2>
        {state.categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-md border border-black/10 px-4 py-3 text-sm"
          >
            <span>{c.name}</span>
            {c.bracketRounds && (
              <Link href={`/t/${publicSlug}/bracket/${c.id}`} className="underline">
                Tableau final
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
