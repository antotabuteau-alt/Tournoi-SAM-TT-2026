import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TournamentToolbar } from "../tournament-toolbar";
import { Card } from "@/components/ui/card";

export default async function PlanningPage({
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

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
        <h2 className="text-lg font-semibold">📋 Planification</h2>
        <Card className="px-6 py-10 text-center text-navy-400">
          Bientôt disponible — la planification par créneaux horaires arrive dans une prochaine mise à jour.
        </Card>
      </div>
    </div>
  );
}
