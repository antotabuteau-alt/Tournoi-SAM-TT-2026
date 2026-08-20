import { z } from "zod";

export const addPlayerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  club: z.string().trim().max(120).optional(),
  licenseNumber: z.string().trim().max(30).optional(),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
});

export const csvPlayerRowSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  club: z.string().trim().optional().default(""),
  licenseNumber: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
});

export type CsvPlayerRow = z.infer<typeof csvPlayerRowSchema>;

export const PLAYER_CSV_FIELDS = [
  { key: "firstName", label: "Prénom", required: true },
  { key: "lastName", label: "Nom", required: true },
  { key: "club", label: "Club", required: false },
  { key: "licenseNumber", label: "N° de licence", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Téléphone", required: false },
] as const;
