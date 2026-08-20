import { NextResponse } from "next/server";
import { getPublicTournamentState } from "@/lib/public-tournament-state";
import { checkPublicPollRateLimit } from "@/lib/rate-limit";

export const revalidate = 3;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicSlug: string }> }
) {
  const { publicSlug } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = await checkPublicPollRateLimit(`${publicSlug}:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const state = await getPublicTournamentState(publicSlug);
  if (!state) {
    return NextResponse.json({ error: "Tournoi introuvable" }, { status: 404 });
  }

  return NextResponse.json(state);
}
