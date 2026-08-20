import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CsvImportWizard } from "./csv-import-wizard";
import { Card } from "@/components/ui/card";

export default async function ImportPlayersPage({
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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Importer des joueurs — {tournament.name}</h1>
      <Card className="p-6">
        <CsvImportWizard orgSlug={orgSlug} tournamentId={tournamentId} />
      </Card>
    </div>
  );
}
