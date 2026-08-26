import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { QrCodeCard } from "./qr-code-card";
import { LinkButton } from "@/components/ui/link-button";
import { TournamentToolbar } from "../tournament-toolbar";

export default async function QrCodePage({
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${baseUrl}/t/${tournament.publicSlug}`;

  return (
    <div className="flex flex-1 flex-col">
      <TournamentToolbar
        orgSlug={orgSlug}
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        publicSlug={tournament.publicSlug}
      />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
        <p className="text-sm text-navy-400">
          Les participants scannent ce QR code pour suivre les poules et le tableau en direct.
        </p>
        <QrCodeCard url={publicUrl} />
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand-600 hover:underline"
        >
          {publicUrl}
        </a>
        <div className="flex flex-col items-center gap-1.5">
          <LinkButton href={`/t/${tournament.publicSlug}/tv`} target="_blank" variant="dark">
            📺 Ouvrir le mode TV
          </LinkButton>
          <div className="flex gap-3 text-xs">
            <a
              href={`/t/${tournament.publicSlug}/tv?day=SATURDAY`}
              target="_blank"
              rel="noreferrer"
              className="text-navy-400 hover:text-brand-600 hover:underline"
            >
              🟠 Filtré Samedi
            </a>
            <a
              href={`/t/${tournament.publicSlug}/tv?day=SUNDAY`}
              target="_blank"
              rel="noreferrer"
              className="text-navy-400 hover:text-brand-600 hover:underline"
            >
              🔵 Filtré Dimanche
            </a>
          </div>
        </div>
        <LinkButton href={`/t/${tournament.publicSlug}/appel`} target="_blank" variant="dark">
          📢 Ouvrir l&apos;écran d&apos;appel
        </LinkButton>
      </div>
    </div>
  );
}
