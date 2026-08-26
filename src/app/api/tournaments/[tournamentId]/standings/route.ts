import { NextResponse } from "next/server";
import { requireUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";

const ROUND_LABELS: Record<number, string> = {
  0: "Finaliste",
  1: "Demi-finaliste",
  2: "Quart de finaliste",
  3: "8e de finaliste",
  4: "16e de finaliste",
};

function roundLabel(roundsFromFinal: number): string {
  return ROUND_LABELS[roundsFromFinal] ?? `Tour ${roundsFromFinal + 1} avant la finale`;
}

// Neutralise l'injection de formule (un nom de joueur/club commençant par
// =, +, -, @, tab ou CR serait interprété comme une formule par Excel/
// LibreOffice à l'ouverture du fichier) en préfixant d'une apostrophe,
// comme le recommande l'OWASP pour l'export CSV de données utilisateur.
function csvEscape(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[";\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

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
        orderBy: { createdAt: "asc" },
        include: {
          registrations: { include: { player: { select: { firstName: true, lastName: true, club: true } } } },
          poolGroups: { include: { members: true, matches: { include: { sets: true } } } },
          bracket: { include: { matches: { include: { sets: true } } } },
        },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournoi introuvable" }, { status: 404 });
  }

  const rows: string[][] = [["Catégorie", "Phase", "Résultat", "Joueur", "Club"]];

  for (const category of tournament.categories) {
    const nameById = new Map(
      category.registrations.map((r) => [r.id, `${r.player.firstName} ${r.player.lastName}`])
    );
    const clubById = new Map(category.registrations.map((r) => [r.id, r.player.club ?? ""]));

    if (category.bracket && category.bracket.matches.length > 0) {
      const matches = category.bracket.matches;
      const maxRound = Math.max(...matches.map((m) => m.round ?? 0));
      const finalMatch = matches.find((m) => m.round === maxRound && m.status === "DONE");
      if (finalMatch?.winnerId) {
        rows.push([
          category.name,
          "Tableau final",
          "Vainqueur",
          nameById.get(finalMatch.winnerId) ?? "?",
          clubById.get(finalMatch.winnerId) ?? "",
        ]);
      }
      for (const m of matches) {
        if (m.status !== "DONE" || !m.winnerId || m.round === null) continue;
        const loserId = m.player1Id === m.winnerId ? m.player2Id : m.player1Id;
        if (!loserId) continue;
        rows.push([
          category.name,
          "Tableau final",
          roundLabel(maxRound - m.round),
          nameById.get(loserId) ?? "?",
          clubById.get(loserId) ?? "",
        ]);
      }
    } else if (category.poolGroups.length > 0) {
      for (const group of category.poolGroups) {
        const registrationIds = group.members.map((m) => m.registrationId);
        const initialSeedOrder = [...group.members]
          .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
          .map((m) => m.registrationId);
        const ranking = computePoolRanking(registrationIds, group.matches, initialSeedOrder);
        for (const r of ranking) {
          rows.push([
            category.name,
            group.name,
            `${r.rank}${r.rank === 1 ? "er" : "e"} (${r.wins}V-${r.losses}D)`,
            nameById.get(r.player) ?? "?",
            clubById.get(r.player) ?? "",
          ]);
        }
      }
    }
  }

  const csv = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const filename = `${tournament.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-classements.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
