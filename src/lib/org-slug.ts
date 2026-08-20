// Segments de premier niveau déjà utilisés par des routes de l'app : un slug
// d'organisation ne doit jamais entrer en collision avec l'une d'elles
// (routing path-based `/[orgSlug]/...`).
export const RESERVED_ORG_SLUGS = new Set([
  "login",
  "register",
  "dashboard",
  "organizations",
  "t",
  "api",
  "admin",
  "settings",
  "public",
  "static",
  "_next",
  "favicon.ico",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isReservedOrgSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.has(slug);
}
