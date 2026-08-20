"use server";

import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export interface TournamentNavData {
  tournamentName: string;
  categories: { id: string; name: string }[];
  matchesInProgress: number;
}

export async function getTournamentNavData(
  orgSlug: string,
  tournamentId: string
): Promise<TournamentNavData | null> {
  const { organization } = await requireMembership(orgSlug);

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizationId: organization.id },
    include: {
      categories: { orderBy: { createdAt: "asc" }, select: { id: true, name: true } },
    },
  });
  if (!tournament) return null;

  const matchesInProgress = await prisma.match.count({
    where: {
      organizationId: organization.id,
      status: "SCHEDULED",
      OR: [
        { poolGroup: { category: { tournamentId } } },
        { bracket: { category: { tournamentId } } },
      ],
    },
  });

  return {
    tournamentName: tournament.name,
    categories: tournament.categories,
    matchesInProgress,
  };
}
