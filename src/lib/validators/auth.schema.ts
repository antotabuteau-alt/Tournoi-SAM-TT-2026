import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  email: z.email(),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères"),
  organizationName: z.string().trim().min(2, "Nom du club requis").max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
