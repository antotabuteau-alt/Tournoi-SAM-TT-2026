"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema, loginSchema } from "@/lib/validators/auth.schema";
import { isReservedOrgSlug, slugify } from "@/lib/org-slug";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/action-result";

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides" };
  }

  const { name, email, password, organizationName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  let slug = slugify(organizationName);
  if (!slug || isReservedOrgSlug(slug)) {
    slug = `${slug || "club"}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const slugTaken = await prisma.organization.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: normalizedEmail, passwordHash, name },
    });
    const organization = await tx.organization.create({
      data: { name: organizationName, slug },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
    });
  });

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: `/${slug}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé, mais la connexion automatique a échoué. Connecte-toi manuellement." };
    }
    throw error;
  }

  return { success: true };
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email ou mot de passe invalide." };
  }

  const ip = await getClientIp();
  const { success: withinLimit } = await checkLoginRateLimit(ip);
  if (!withinLimit) {
    return { error: "Trop de tentatives. Réessaie dans une minute." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }

  return { success: true };
}
