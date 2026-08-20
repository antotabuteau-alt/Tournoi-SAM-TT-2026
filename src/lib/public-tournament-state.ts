import { prisma } from "@/lib/prisma";
import { computePoolRanking } from "@/lib/pool-view";

export interface PublicSetScore {
  player1Points: number;
  player2Points: number;
}

export interface PublicMatch {
  id: string;
  player1Name: string | null;
  player2Name: string | null;
  status: string;
  sets: PublicSetScore[];
  round?: number | null;
  position?: number | null;
}

export interface PublicPoolRankingRow {
  playerName: string;
  rank: number;
  wins: number;
  losses: number;
}

export interface PublicPool {
  id: string;
  name: string;
  ranking: PublicPoolRankingRow[];
  matches: PublicMatch[];
}

export interface PublicCategory {
  id: string;
  name: string;
  format: string;
  status: string;
  pools: PublicPool[];
  bracketRounds: { round: number; matches: PublicMatch[] }[] | null;
}

export interface PublicTournamentState {
  name: string;
  date: string;
  location: string | null;
  status: string;
  categories: PublicCategory[];
}

function playerName(
  reg: { player: { firstName: string; lastName: string } } | null
): string | null {
  return reg ? `${reg.player.firstName} ${reg.player.lastName}` : null;
}

export async function getPublicTournamentState(
  publicSlug: string
): Promise<PublicTournamentState | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { publicSlug },
    include: {
      categories: {
        orderBy: { createdAt: "asc" },
        include: {
          poolGroups: {
            orderBy: { name: "asc" },
            include: {
              members: {
                include: { registration: { include: { player: true } } },
              },
              matches: {
                include: {
                  player1: { include: { player: true } },
                  player2: { include: { player: true } },
                  sets: { orderBy: { setNumber: "asc" } },
                },
              },
            },
          },
          bracket: {
            include: {
              matches: {
                orderBy: [{ round: "asc" }, { position: "asc" }],
                include: {
                  player1: { include: { player: true } },
                  player2: { include: { player: true } },
                  sets: { orderBy: { setNumber: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!tournament) return null;

  return {
    name: tournament.name,
    date: tournament.date.toISOString(),
    location: tournament.location,
    status: tournament.status,
    categories: tournament.categories.map((category) => ({
      id: category.id,
      name: category.name,
      format: category.format,
      status: category.status,
      pools: category.poolGroups.map((group) => {
        const registrationIds = group.members.map((m) => m.registrationId);
        const initialSeedOrder = [...group.members]
          .sort((a, b) => (a.seedInPool ?? 999) - (b.seedInPool ?? 999))
          .map((m) => m.registrationId);
        const namesById = new Map(
          group.members.map((m) => [
            m.registrationId,
            `${m.registration.player.firstName} ${m.registration.player.lastName}`,
          ])
        );
        const ranking = computePoolRanking(
          registrationIds,
          group.matches,
          initialSeedOrder
        );
        return {
          id: group.id,
          name: group.name,
          ranking: ranking.map((r) => ({
            playerName: namesById.get(r.player) ?? "?",
            rank: r.rank,
            wins: r.wins,
            losses: r.losses,
          })),
          matches: group.matches.map((m) => ({
            id: m.id,
            player1Name: playerName(m.player1),
            player2Name: playerName(m.player2),
            status: m.status,
            sets: m.sets.map((s) => ({
              player1Points: s.player1Points,
              player2Points: s.player2Points,
            })),
          })),
        };
      }),
      bracketRounds: category.bracket
        ? Object.entries(
            Object.groupBy(category.bracket.matches, (m) => m.round ?? 0)
          ).map(([round, matches]) => ({
            round: Number(round),
            matches: (matches ?? []).map((m) => ({
              id: m.id,
              player1Name: playerName(m.player1),
              player2Name: playerName(m.player2),
              status: m.status,
              round: m.round,
              position: m.position,
              sets: m.sets.map((s) => ({
                player1Points: s.player1Points,
                player2Points: s.player2Points,
              })),
            })),
          }))
        : null,
    })),
  };
}
