import "server-only";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { generateSnakePools } from "@/lib/seeding/snake-pools";
import { roundRobinPairs } from "@/lib/round-robin";
import { computeQualifiers, createBracketRounds, propagateBracketWinner } from "@/lib/bracket-service";
import type { SetInput } from "@/lib/match-scoring";

const FIRST_NAMES = [
  "Lucas", "Emma", "Hugo", "Léa", "Louis", "Chloé", "Jules", "Manon",
  "Adam", "Camille", "Nathan", "Sarah", "Enzo", "Julie", "Théo", "Inès",
];
const LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
];
const CLUBS = ["SAM Tennis de Table", "AS Bordeaux TT", "Pongiste Club Mérignac", "TT Talence"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomSetFor(winnerSide: 1 | 2): SetInput {
  const deuce = Math.random() < 0.15;
  let winnerPts: number;
  let loserPts: number;
  if (deuce) {
    loserPts = 10 + Math.floor(Math.random() * 3); // 10..12
    winnerPts = loserPts + 2;
  } else {
    winnerPts = 11;
    loserPts = Math.floor(Math.random() * 9); // 0..8
  }
  return winnerSide === 1
    ? { player1Points: winnerPts, player2Points: loserPts }
    : { player1Points: loserPts, player2Points: winnerPts };
}

/** Génère une série de manches valides et cohérentes menant à une victoire. */
function randomMatchSets(setsToWin: number): { sets: SetInput[]; winnerSlot: 1 | 2 } {
  const winnerSlot: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
  const loserSetsWon = Math.floor(Math.random() * setsToWin);
  const filler: (1 | 2)[] = shuffle([
    ...Array(setsToWin - 1).fill(winnerSlot),
    ...Array(loserSetsWon).fill(winnerSlot === 1 ? 2 : 1),
  ]);
  const sequence = [...filler, winnerSlot];
  return { sets: sequence.map((side) => randomSetFor(side)), winnerSlot };
}

async function resolveAndPropagate(
  matchId: string,
  player1Id: string,
  player2Id: string,
  setsToWin: number,
  nextMatchId: string | null,
  nextMatchSlot: number | null
) {
  const { sets, winnerSlot } = randomMatchSets(setsToWin);
  const winnerId = winnerSlot === 1 ? player1Id : player2Id;

  await prisma.$transaction([
    prisma.setScore.createMany({
      data: sets.map((s, i) => ({
        matchId,
        setNumber: i + 1,
        player1Points: s.player1Points,
        player2Points: s.player2Points,
      })),
    }),
    prisma.match.update({ where: { id: matchId }, data: { winnerId, status: "DONE" } }),
  ]);

  if (nextMatchId && nextMatchSlot) {
    await propagateBracketWinner(nextMatchId, nextMatchSlot, winnerId);
  }

  return winnerId;
}

/**
 * Crée un tournoi de démonstration complet dans l'organisation donnée :
 * 16 joueurs, poules jouées jusqu'au bout, tableau final généré et simulé
 * jusqu'en finale (la finale reste à saisir pour que l'utilisateur puisse
 * essayer la fonctionnalité lui-même).
 */
export async function generateDemoTournament(organizationId: string): Promise<{
  tournamentId: string;
  categoryId: string;
}> {
  const tournament = await prisma.tournament.create({
    data: {
      organizationId,
      name: "Tournoi de Démonstration",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "Salle Omnisports",
      publicSlug: nanoid(12),
      status: "POOLS_IN_PROGRESS",
    },
  });

  const category = await prisma.category.create({
    data: {
      organizationId,
      tournamentId: tournament.id,
      name: "Simple Messieurs",
      format: "POOLS_THEN_BRACKET",
      poolTargetSize: 4,
      poolQualifiersCount: 2,
      bestOfSets: 3,
      status: "DRAFT",
    },
  });

  const players = await Promise.all(
    Array.from({ length: 16 }, (_, i) =>
      prisma.player.create({
        data: {
          organizationId,
          tournamentId: tournament.id,
          firstName: FIRST_NAMES[i],
          lastName: LAST_NAMES[i],
          club: CLUBS[i % CLUBS.length],
          licenseNumber: String(100000 + i),
        },
      })
    )
  );

  const registrations = await Promise.all(
    players.map((p, i) =>
      prisma.categoryRegistration.create({
        data: { categoryId: category.id, playerId: p.id, seed: i + 1 },
      })
    )
  );

  const pools = generateSnakePools(registrations, 4);
  const poolGroups = [];
  for (let i = 0; i < pools.length; i++) {
    const group = await prisma.poolGroup.create({
      data: { categoryId: category.id, name: `Poule ${String.fromCharCode(65 + i)}` },
    });
    await prisma.poolMember.createMany({
      data: pools[i].map((reg, seedInPool) => ({
        poolGroupId: group.id,
        registrationId: reg.id,
        seedInPool: seedInPool + 1,
      })),
    });
    poolGroups.push({ group, members: pools[i] });
  }

  const poolGroupsForQualifiers: {
    members: { registrationId: string; seedInPool: number | null }[];
    matches: {
      player1Id: string | null;
      player2Id: string | null;
      winnerId: string | null;
      sets: { player1Points: number; player2Points: number }[];
    }[];
  }[] = [];

  for (const { group, members } of poolGroups) {
    const pairs = roundRobinPairs(members.map((r) => r.id));
    const matchesForQualifiers: (typeof poolGroupsForQualifiers)[number]["matches"] = [];

    for (const [p1, p2] of pairs) {
      const match = await prisma.match.create({
        data: {
          organizationId,
          type: "POOL",
          poolGroupId: group.id,
          player1Id: p1,
          player2Id: p2,
          status: "SCHEDULED",
        },
      });
      const { sets, winnerSlot } = randomMatchSets(category.bestOfSets);
      const winnerId = winnerSlot === 1 ? p1 : p2;
      await prisma.$transaction([
        prisma.setScore.createMany({
          data: sets.map((s, i) => ({
            matchId: match.id,
            setNumber: i + 1,
            player1Points: s.player1Points,
            player2Points: s.player2Points,
          })),
        }),
        prisma.match.update({ where: { id: match.id }, data: { winnerId, status: "DONE" } }),
      ]);
      matchesForQualifiers.push({ player1Id: p1, player2Id: p2, winnerId, sets });
    }

    poolGroupsForQualifiers.push({
      members: members.map((r, i) => ({ registrationId: r.id, seedInPool: i + 1 })),
      matches: matchesForQualifiers,
    });
  }

  await prisma.category.update({ where: { id: category.id }, data: { status: "POOLS_DONE" } });

  const qualifierIds = computeQualifiers(poolGroupsForQualifiers, category.poolQualifiersCount);
  await createBracketRounds(organizationId, category.id, qualifierIds);
  await prisma.category.update({
    where: { id: category.id },
    data: { status: "BRACKET_IN_PROGRESS" },
  });

  const bracketMeta = await prisma.bracket.findUniqueOrThrow({
    where: { categoryId: category.id },
    select: { id: true, matches: { select: { round: true } } },
  });
  const totalRounds = Math.max(...bracketMeta.matches.map((m) => m.round ?? 1));

  // On relit les matchs à chaque tour : les places du tour N ne sont
  // remplies qu'après propagation des vainqueurs du tour N-1.
  for (let round = 1; round < totalRounds; round++) {
    const roundMatches = await prisma.match.findMany({
      where: { bracketId: bracketMeta.id, round },
      orderBy: { position: "asc" },
    });
    for (const m of roundMatches) {
      if (m.status !== "SCHEDULED" || !m.player1Id || !m.player2Id) continue;
      await resolveAndPropagate(
        m.id,
        m.player1Id,
        m.player2Id,
        category.bestOfSets,
        m.nextMatchId,
        m.nextMatchSlot
      );
    }
  }

  return { tournamentId: tournament.id, categoryId: category.id };
}
