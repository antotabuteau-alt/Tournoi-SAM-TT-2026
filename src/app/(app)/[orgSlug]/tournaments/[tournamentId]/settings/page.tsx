import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TournamentToolbar } from "../tournament-toolbar";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function TournamentSettingsPage({
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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-8">
        <h2 className="text-lg font-semibold">⚙ Paramètres salle</h2>
        <Card className="p-6">
          <SettingsForm
            orgSlug={orgSlug}
            tournamentId={tournamentId}
            name={tournament.name}
            date={tournament.date.toISOString().slice(0, 10)}
            location={tournament.location ?? ""}
          />
        </Card>
      </div>
    </div>
  );
}
