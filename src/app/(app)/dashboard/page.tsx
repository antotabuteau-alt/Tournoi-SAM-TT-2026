import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  // Un seul club : on saute directement dedans, pas besoin de choisir.
  if (memberships.length === 1) {
    redirect(`/${memberships[0].organization.slug}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">Mes clubs</h1>

      {memberships.length === 0 ? (
        <Card className="px-6 py-10 text-center text-navy-400">
          Tu n&apos;es membre d&apos;aucun club pour le moment.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {memberships.map((m) => (
            <Link key={m.id} href={`/${m.organization.slug}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-muted">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-sm font-bold text-white">
                  {m.organization.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.organization.name}</p>
                  <Badge variant="neutral" className="mt-1">{m.role}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
