import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { BadgeQr } from "./badge-qr";
import { PrintTrigger } from "./print-trigger";

export default async function PlayerBadgesPrintPage({
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

  const players = await prisma.player.findMany({
    where: { tournamentId, organizationId: organization.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 print:px-0 print:py-0">
      <PrintTrigger />

      {players.length === 0 && <p className="text-navy-400">Aucun joueur pour le moment.</p>}

      <div className="grid grid-cols-3 gap-3 print:gap-2">
        {players.map((p) => {
          const url = `${baseUrl}/t/${tournament.publicSlug}/players/${p.id}`;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 break-inside-avoid rounded-xl border border-navy-950 p-3"
            >
              <BadgeQr url={url} />
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-navy-400 uppercase">
                  {tournament.name}
                </p>
                <p className="truncate text-sm font-bold leading-tight">
                  {p.firstName} {p.lastName}
                </p>
                {p.club && <p className="truncate text-xs text-navy-400">{p.club}</p>}
                <p className="mt-1 text-[10px] text-navy-400">Scanne pour ton planning</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
