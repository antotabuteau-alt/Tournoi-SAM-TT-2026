import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Instance NextAuth "légère" (edge-safe, sans Prisma/argon2) uniquement pour
// la protection des routes au niveau middleware. Voir src/auth.config.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
