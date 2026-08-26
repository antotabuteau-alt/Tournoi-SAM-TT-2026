import { prisma } from "@/lib/prisma";

export interface BracketBoardMatch {
  id: string;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: string;
  refereeName: string | null;
  tableNumber: number | null;
  sets: { player1Points: number; player2Points: number }[];
}

/** Données nécessaires à l'affichage du tableau final avec ses matchs. */
export async function loadBracketBoardData(categoryId: string): Promise<BracketBoardMatch[]> {
  const bracket = await prisma.bracket.findUnique({
    where: { categoryId },
    include: {
      matches: {
        include: {
          player1: { include: { player: true } },
          player2: { include: { player: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      },
    },
  });
  if (!bracket) return [];

  return bracket.matches.map((m) => ({
    id: m.id,
    round: m.round ?? 0,
    player1Id: m.player1Id,
    player2Id: m.player2Id,
    player1Name: m.player1 ? `${m.player1.player.firstName} ${m.player1.player.lastName}` : "",
    player2Name: m.player2 ? `${m.player2.player.firstName} ${m.player2.player.lastName}` : "",
    status: m.status,
    refereeName: m.refereeName,
    tableNumber: m.tableNumber,
    sets: m.sets.map((s) => ({ player1Points: s.player1Points, player2Points: s.player2Points })),
  }));
}
