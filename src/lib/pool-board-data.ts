import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";

export interface DndPoolGroup {
  id: string;
  name: string;
  members: { registrationId: string; name: string }[];
}

export interface DndMember {
  registrationId: string;
  name: string;
}

export interface BoardMatch {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: string;
  refereeName: string | null;
  tableNumber: number | null;
  sets: { player1Points: number; player2Points: number }[];
}

export interface BoardPoolGroup {
  id: string;
  name: string;
  ranking: { rank: number; playerName: string; wins: number; losses: number }[];
  matches: BoardMatch[];
}

/** Données nécessaires au tableau de glisser-déposer (avant génération des matchs). */
export async function loadPoolDndData(
  categoryId: string
): Promise<{ poolGroups: DndPoolGroup[]; unassigned: DndMember[] }> {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
    include: {
      registrations: {
        include: { player: true },
        orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
      },
      poolGroups: {
        orderBy: { name: "asc" },
        include: { members: { include: { registration: { include: { player: true } } } } },
      },
    },
  });

  const poolGroups = category.poolGroups.map((g) => ({
    id: g.id,
    name: g.name,
    members: g.members.map((m) => ({
      registrationId: m.registrationId,
      name: `${m.registration.player.firstName} ${m.registration.player.lastName}`,
    })),
  }));

  const assignedIds = new Set(category.poolGroups.flatMap((g) => g.members.map((m) => m.registrationId)));
  const unassigned = category.registrations
    .filter((r) => !assignedIds.has(r.id))
    .map((r) => ({ registrationId: r.id, name: `${r.player.firstName} ${r.player.lastName}` }));

  return { poolGroups, unassigned };
}

/** Données nécessaires à l'affichage des poules avec matchs et classements. */
export async function loadPoolBoardData(categoryId: string): Promise<BoardPoolGroup[]> {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
    include: {
      poolGroups: {
        orderBy: { name: "asc" },
        include: {
          members: { include: { registration: { include: { player: true } } } },
          matches: {
            orderBy: { createdAt: "asc" },
            include: {
              player1: { include: { player: true } },
              player2: { include: { player: true } },
              sets: { orderBy: { setNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  return category.poolGroups.map((group) => {
    const registrationIds = group.members.map((m) => m.registrationId);
    const initialSeedOrder = [...group.members]
      .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
      .map((m) => m.registrationId);
    const ranking = computePoolRanking(registrationIds, group.matches, initialSeedOrder);
    const namesById = new Map(
      group.members.map((m) => [
        m.registrationId,
        `${m.registration.player.firstName} ${m.registration.player.lastName}`,
      ])
    );

    return {
      id: group.id,
      name: group.name,
      ranking: ranking.map((r) => ({
        rank: r.rank,
        playerName: namesById.get(r.player) ?? "?",
        wins: r.wins,
        losses: r.losses,
      })),
      matches: group.matches.map((m) => ({
        id: m.id,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player1Name: m.player1
          ? `${m.player1.player?.firstName ?? ""} ${m.player1.player?.lastName ?? ""}`.trim()
          : "?",
        player2Name: m.player2
          ? `${m.player2.player?.firstName ?? ""} ${m.player2.player?.lastName ?? ""}`.trim()
          : "?",
        status: m.status,
        refereeName: m.refereeName,
        tableNumber: m.tableNumber,
        sets: m.sets.map((s) => ({ player1Points: s.player1Points, player2Points: s.player2Points })),
      })),
    };
  });
}
