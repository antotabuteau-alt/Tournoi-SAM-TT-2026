import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const isValid = await verifyPassword(user.passwordHash, password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tokenVersion = (user as { tokenVersion: number }).tokenVersion;
        token.tokenVersionCheckedAt = Date.now();
        return token;
      }

      // Révocation : si le tokenVersion en base a changé (déconnexion forcée,
      // changement de mot de passe), on invalide le JWT existant. On ne
      // revérifie qu'au bout de quelques minutes (et pas à chaque requête,
      // le callback jwt étant appelé à chaque page/Server Action) pour
      // limiter la charge DB — et surtout, une erreur DB transitoire ne doit
      // jamais déconnecter l'utilisateur : on fait confiance au JWT existant
      // plutôt que de le vider sur un simple souci réseau.
      const checkedAt = typeof token.tokenVersionCheckedAt === "number" ? token.tokenVersionCheckedAt : 0;
      const staleAfterMs = 5 * 60 * 1000;
      if (token.sub && Date.now() - checkedAt > staleAfterMs) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { tokenVersion: true },
          });
          if (!dbUser) return {};
          if (dbUser.tokenVersion !== token.tokenVersion) return {};
          token.tokenVersionCheckedAt = Date.now();
        } catch {
          // DB indisponible : on garde le token tel quel plutôt que de
          // déconnecter l'utilisateur pour un incident transitoire.
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
