import "server-only";
import { redirect, notFound } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleAtLeast } from "@/lib/permissions";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Vérifie que l'utilisateur connecté est membre de l'organisation `orgSlug`
 * avec au moins le rôle `minimumRole`. À appeler en tête de chaque Server
 * Action / Server Component touchant des données d'une organisation :
 * l'organizationId ne doit jamais être dérivé d'un input client, uniquement
 * de cette vérification.
 */
export async function requireMembership(
  orgSlug: string,
  minimumRole: MembershipRole = "ORGANIZER"
) {
  const user = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      organization: { slug: orgSlug },
    },
    include: { organization: true },
  });

  if (!membership) notFound();
  if (!roleAtLeast(membership.role, minimumRole)) notFound();

  return {
    user,
    organization: membership.organization,
    role: membership.role,
  };
}
