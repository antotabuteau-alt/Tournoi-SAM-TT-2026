"use server";

import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";

const MAX_LOGO_BYTES = 500 * 1024; // 500 Ko
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export async function updateOrganizationLogoAction(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "OWNER");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Aucun fichier sélectionné." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Format non supporté (PNG, JPEG, WEBP ou SVG uniquement)." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Fichier trop volumineux (500 Ko maximum)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.organization.update({
    where: { id: organization.id },
    data: { logoUrl: dataUrl },
  });

  revalidatePath(`/${orgSlug}`, "layout");
  return { success: true };
}

export async function removeOrganizationLogoAction(orgSlug: string): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "OWNER");

  await prisma.organization.update({
    where: { id: organization.id },
    data: { logoUrl: null },
  });

  revalidatePath(`/${orgSlug}`, "layout");
  return { success: true };
}
