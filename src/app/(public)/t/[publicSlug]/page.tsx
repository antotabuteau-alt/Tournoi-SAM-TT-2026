import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTournamentState } from "@/lib/public-tournament-state";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  const state = await getPublicTournamentState(publicSlug);
  if (!state) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="text-center">
        <span className="text-3xl">🏓</span>
        <h1 className="mt-2 text-3xl font-bold">{state.name}</h1>
        <p className="text-navy-400">
          {new Date(state.date).toLocaleDateString("fr-FR")}
          {state.location ? ` · ${state.location}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton href={`/t/${publicSlug}/pools`} variant="outline">
          🎯 Poules en direct
        </LinkButton>
        <LinkButton href={`/t/${publicSlug}/tv`} variant="dark">
          📺 Mode TV
        </LinkButton>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-navy-400 uppercase">Catégories</h2>
        {state.categories.length === 0 && (
          <Card className="px-4 py-6 text-center text-navy-400">Aucune catégorie pour le moment.</Card>
        )}
        {state.categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{c.name}</span>
            {c.bracketRounds && (
              <Link href={`/t/${publicSlug}/bracket/${c.id}`} className="text-brand-600 hover:underline">
                Tableau final →
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
