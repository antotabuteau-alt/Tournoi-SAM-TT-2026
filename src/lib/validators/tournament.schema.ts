import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(150),
  date: z.string().min(1, "Date requise"),
  location: z.string().trim().max(200).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(100),
  format: z.enum(["POOLS_THEN_BRACKET", "DIRECT_BRACKET", "POOLS_ONLY"]),
  poolTargetSize: z.coerce.number().int().min(2).max(10).optional(),
  poolQualifiersCount: z.coerce.number().int().min(1).max(4).default(2),
  // Nombre de manches gagnantes nécessaires pour remporter le match
  // (3 = au meilleur des 5, 4 = au meilleur des 7).
  bestOfSets: z.coerce.number().int().refine((n) => n === 3 || n === 4, {
    message: "3 ou 4 manches gagnantes",
  }),
});
