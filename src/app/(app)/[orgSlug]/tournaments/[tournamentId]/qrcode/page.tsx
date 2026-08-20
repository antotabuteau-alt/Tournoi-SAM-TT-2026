import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { QrCodeCard } from "./qr-code-card";

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
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold">Suivi public — {tournament.name}</h1>
      <p className="text-sm text-foreground/60">
        Les participants scannent ce QR code pour suivre les poules et le tableau en direct.
      </p>
      <QrCodeCard url={publicUrl} />
      <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm underline">
        {publicUrl}
      </a>
    </div>
  );
}
