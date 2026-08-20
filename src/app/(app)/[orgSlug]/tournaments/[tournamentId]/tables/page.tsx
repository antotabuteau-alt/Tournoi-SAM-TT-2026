import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TournamentToolbar } from "../tournament-toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tournamentId: string }>;
}) {
  const { orgSlug, tournamentId } = await params;
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
  });
  if (!tournament) notFound();

  const matches = await prisma.match.findMany({
    where: {
      organizationId: organization.id,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      OR: [
        { poolGroup: { category: { tournamentId } } },
        { bracket: { category: { tournamentId } } },
      ],
    },
    include: {
      player1: { include: { player: true } },
      player2: { include: { player: true } },
      poolGroup: { include: { category: true } },
      bracket: { include: { category: true } },
    },
    orderBy: { tableNumber: "asc" },
  });

  const assigned = matches.filter((m) => m.tableNumber !== null);
  const unassigned = matches.filter((m) => m.tableNumber === null);

  function matchLabel(m: (typeof matches)[number]) {
    const category = m.poolGroup?.category ?? m.bracket?.category;
    const p1 = m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : "?";
    const p2 = m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : "?";
    return { category: category?.name ?? "", label: `${p1} vs ${p2}` };
  }

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
        <h2 className="text-lg font-semibold">📌 Tables</h2>

        {assigned.length === 0 && unassigned.length === 0 && (
          <Card className="px-6 py-10 text-center text-navy-400">
            Aucun match en attente pour le moment.
          </Card>
        )}

        {assigned.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assigned.map((m) => {
              const { category, label } = matchLabel(m);
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand">Table {m.tableNumber}</Badge>
                    {m.status === "IN_PROGRESS" && <Badge variant="success">En cours</Badge>}
                  </div>
                  <p className="mt-2 text-sm font-medium">{label}</p>
                  <p className="text-xs text-navy-400">{category}</p>
                  {m.refereeName && (
                    <p className="mt-1 text-xs text-navy-400">🧑‍⚖️ {m.refereeName}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {unassigned.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-navy-400 uppercase">
              Sans table assignée
            </h3>
            <div className="flex flex-col gap-1">
              {unassigned.map((m) => {
                const { category, label } = matchLabel(m);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-sm"
                  >
                    <span>{label}</span>
                    <span className="text-xs text-navy-400">{category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
