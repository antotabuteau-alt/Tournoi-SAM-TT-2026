import type { NextAuthConfig } from "next-auth";

// Config "edge-safe" : aucune dépendance à Prisma/argon2 (binaires natifs Node)
// ici, uniquement de quoi décider si une route est publique ou protégée.
// Utilisée par middleware.ts. La config complète (avec le provider Credentials)
// est dans src/auth.ts et n'est chargée que dans le runtime Node (route API, Server Actions).

const PUBLIC_PREFIXES = ["/login", "/register", "/t/", "/api/public/", "/api/webhooks/", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (isPublicPath(pathname)) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
