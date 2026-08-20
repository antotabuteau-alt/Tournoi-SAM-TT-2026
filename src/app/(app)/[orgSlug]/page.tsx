import Link from "next/link";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireMembership(orgSlug);

  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: organization.id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tournois</h1>
        <Link
          href={`/${orgSlug}/tournaments/new`}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Nouveau tournoi
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-foreground/70">Aucun tournoi pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/${orgSlug}/tournaments/${t.id}`}
                className="block rounded-md border border-black/10 px-4 py-3 hover:bg-black/[.03]"
              >
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-sm text-foreground/60">
                  {t.date.toLocaleDateString("fr-FR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
