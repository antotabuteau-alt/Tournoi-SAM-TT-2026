import { requireMembership } from "@/lib/tenant";
import { TournamentForm } from "./tournament-form";

export default async function NewTournamentPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireMembership(orgSlug, "ORGANIZER");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold">Nouveau tournoi</h1>
      <TournamentForm orgSlug={orgSlug} />
    </div>
  );
}
