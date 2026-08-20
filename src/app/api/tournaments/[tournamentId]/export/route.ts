import { NextResponse } from "next/server";
import { requireUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const user = await requireUser();
  const { tournamentId } = await params;

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      organization: { memberships: { some: { userId: user.id } } },
    },
    include: {
      categories: {
        include: {
          registrations: { include: { player: true } },
          poolGroups: {
            include: {
              members: true,
              matches: { include: { sets: true } },
            },
          },
          bracket: {
            include: { matches: { include: { sets: true } } },
          },
        },
      },
      players: true,
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournoi introuvable" }, { status: 404 });
  }

  const filename = `${tournament.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;

  return new NextResponse(JSON.stringify(tournament, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
