import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TournamentToolbar } from "../tournament-toolbar";
import { Card } from "@/components/ui/card";

export default async function CompositionsPage({
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
        <h2 className="text-lg font-semibold">🖨 Compositions</h2>
        <Card className="px-6 py-10 text-center text-navy-400">
          Bientôt disponible — l&apos;impression des feuilles de composition d&apos;équipes arrive
          dans une prochaine mise à jour.
        </Card>
      </div>
    </div>
  );
}
