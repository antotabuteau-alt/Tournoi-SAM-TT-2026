import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireMembership(orgSlug);

  const tournaments = await prisma.tournament.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
    orderBy: { date: "desc" },
  });

  return (
    <AppShell orgSlug={organization.slug} orgName={organization.name} tournaments={tournaments}>
      {children}
    </AppShell>
  );
}
