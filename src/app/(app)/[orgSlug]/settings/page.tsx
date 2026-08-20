import { requireMembership } from "@/lib/tenant";
import { Card } from "@/components/ui/card";
import { LogoForm } from "./logo-form";

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireMembership(orgSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 py-8">
      <h1 className="text-2xl font-bold">Paramètres du club</h1>
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-navy-400 uppercase">
          Logo du club
        </h2>
        <LogoForm orgSlug={orgSlug} currentLogoUrl={organization.logoUrl} />
      </Card>
    </div>
  );
}
