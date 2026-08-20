import Link from "next/link";
import { requireUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold">Mes clubs</h1>

      {memberships.length === 0 ? (
        <p className="text-foreground/70">
          Tu n&apos;es membre d&apos;aucun club pour le moment.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/${m.organization.slug}`}
                className="block rounded-md border border-black/10 px-4 py-3 hover:bg-black/[.03]"
              >
                <span className="font-medium">{m.organization.name}</span>
                <span className="ml-2 text-sm text-foreground/60">
                  {m.role}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
