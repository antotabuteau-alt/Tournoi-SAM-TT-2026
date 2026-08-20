import { requireMembership } from "@/lib/tenant";
import { TournamentForm } from "./tournament-form";
import { Card } from "@/components/ui/card";

export default async function NewTournamentPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireMembership(orgSlug, "ORGANIZER");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Nouveau tournoi</h1>
      <Card className="p-6">
        <TournamentForm orgSlug={orgSlug} />
      </Card>
    </div>
  );
}
