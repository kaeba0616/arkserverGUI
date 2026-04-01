import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getPlayers } from "@/lib/rcon";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const players = await getPlayers();
  return NextResponse.json({ players, count: players.length });
}
