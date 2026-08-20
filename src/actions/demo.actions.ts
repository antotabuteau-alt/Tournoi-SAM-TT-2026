"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/tenant";
import { generateDemoTournament } from "@/lib/demo-seed";
import type { ActionResult } from "@/lib/action-result";

export async function createDemoTournamentAction(orgSlug: string): Promise<ActionResult> {
  const { organization } = await requireMembership(orgSlug, "ORGANIZER");

  const { tournamentId } = await generateDemoTournament(organization.id);

  revalidatePath(`/${orgSlug}`, "layout");
  redirect(`/${orgSlug}/tournaments/${tournamentId}`);
}
