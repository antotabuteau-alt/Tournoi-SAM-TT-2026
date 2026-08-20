import type { MembershipRole } from "@prisma/client";

const ROLE_RANK: Record<MembershipRole, number> = {
  ORGANIZER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export function roleAtLeast(
  role: MembershipRole,
  minimum: MembershipRole
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
