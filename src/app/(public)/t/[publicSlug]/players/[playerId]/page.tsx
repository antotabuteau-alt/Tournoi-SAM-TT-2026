import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "À jouer",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  WALKOVER: "Forfait",
  BYE: "Exempt",
};

export default async function PublicPlayerSchedulePage({
  params,
}: {
  params: Promise<{ publicSlug: string; playerId: string }>;
}) {
  const { publicSlug, playerId } = await params;

  const tournament = await prisma.tournament.findFirst({ where: { publicSlug } });
  if (!tournament) notFound();

  const player = await prisma.player.findFirst({
    where: { id: playerId, tournamentId: tournament.id },
    include: {
      registrations: {
        include: {
          category: { select: { name: true } },
          matchesAsP1: {
            include: {
              player2: { include: { player: { select: { firstName: true, lastName: true } } } },
              poolGroup: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          matchesAsP2: {
            include: {
              player1: { include: { player: { select: { firstName: true, lastName: true } } } },
              poolGroup: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!player) notFound();

  const schedule = player.registrations.map((r) => {
    const matches = [
      ...r.matchesAsP1.map((m) => ({
        id: m.id,
        opponent: m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : "?",
        status: m.status,
        table: m.tableNumber,
        context: m.poolGroup?.name ?? (m.round ? `Tour ${m.round}` : ""),
      })),
      ...r.matchesAsP2.map((m) => ({
        id: m.id,
        opponent: m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : "?",
        status: m.status,
        table: m.tableNumber,
        context: m.poolGroup?.name ?? (m.round ? `Tour ${m.round}` : ""),
      })),
    ];
    return { categoryName: r.category.name, matches };
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="text-center">
        <span className="text-3xl">🏓</span>
        <h1 className="mt-2 text-2xl font-bold">
          {player.firstName} {player.lastName}
        </h1>
        {player.club && <p className="text-navy-400">{player.club}</p>}
        <p className="mt-1 text-xs text-navy-400">{tournament.name}</p>
      </div>

      {schedule.length === 0 && (
        <Card className="px-4 py-6 text-center text-navy-400">
          Ce joueur n&apos;est inscrit à aucun tableau.
        </Card>
      )}

      {schedule.map((s) => (
        <div key={s.categoryName} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-navy-400 uppercase">
            {s.categoryName}
          </h2>
          {s.matches.length === 0 ? (
            <Card className="px-4 py-3 text-sm text-navy-400">
              Matchs pas encore programmés.
            </Card>
          ) : (
            s.matches.map((m) => (
              <Card key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">vs {m.opponent}</p>
                  <p className="text-xs text-navy-400">
                    {m.context}
                    {m.table ? ` · Table ${m.table}` : ""}
                  </p>
                </div>
                <span
                  className={
                    m.status === "DONE"
                      ? "shrink-0 rounded-full bg-success-50 px-2 py-1 text-[11px] font-bold text-success-600"
                      : m.status === "IN_PROGRESS"
                        ? "shrink-0 rounded-full bg-accent-50 px-2 py-1 text-[11px] font-bold text-accent-500"
                        : "shrink-0 rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-navy-400"
                  }
                >
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
              </Card>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
