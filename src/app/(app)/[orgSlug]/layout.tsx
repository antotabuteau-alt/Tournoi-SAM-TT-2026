import Link from "next/link";
import { requireMembership } from "@/lib/tenant";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { organization } = await requireMembership(orgSlug);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={`/${organization.slug}`} className="font-semibold">
            {organization.name}
          </Link>
          <Link href="/dashboard" className="text-sm hover:underline">
            Mes clubs
          </Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
