import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";
import { PrintTrigger } from "./print-trigger";

export default async function PoolsPrintPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string; categoryId: string }>;
}) {
  const { orgSlug, tournamentId, categoryId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: organization.id, tournamentId },
    include: {
      tournament: { select: { name: true } },
      poolGroups: {
        orderBy: { name: "asc" },
        include: {
          members: { include: { registration: { include: { player: true } } } },
          matches: { include: { sets: true } },
        },
      },
    },
  });
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">
      <PrintTrigger />
      <div className="mb-6 flex items-baseline justify-between border-b border-navy-950 pb-3">
        <div>
          <h1 className="text-xl font-bold">{category.tournament.name}</h1>
          <p className="text-sm text-navy-400">Classement des poules — {category.name}</p>
        </div>
        <p className="text-xs text-navy-400">{new Date().toLocaleDateString("fr-FR")}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {category.poolGroups.map((group) => {
          const registrationIds = group.members.map((m) => m.registrationId);
          const initialSeedOrder = [...group.members]
            .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
            .map((m) => m.registrationId);
          const ranking = computePoolRanking(registrationIds, group.matches, initialSeedOrder);
          const namesById = new Map(
            group.members.map((m) => [
              m.registrationId,
              `${m.registration.player.firstName} ${m.registration.player.lastName}`,
            ])
          );

          return (
            <div key={group.id} className="break-inside-avoid">
              <h2 className="mb-1 font-semibold">{group.name}</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy-950 text-left text-xs text-navy-400">
                    <th className="w-6 py-1">#</th>
                    <th className="py-1">Joueur</th>
                    <th className="py-1 text-right">V-D</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row) => (
                    <tr key={row.player} className="border-b border-border">
                      <td className="py-1 text-navy-400">{row.rank}</td>
                      <td className="py-1 font-medium">{namesById.get(row.player)}</td>
                      <td className="py-1 text-right text-navy-400">
                        {row.wins}-{row.losses}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {category.poolGroups.length === 0 && (
        <p className="text-navy-400">Aucune poule générée pour ce tableau.</p>
      )}
    </div>
  );
}
