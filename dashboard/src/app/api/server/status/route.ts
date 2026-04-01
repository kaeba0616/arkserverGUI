import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getContainerStatus, getContainerStats } from "@/lib/docker";
import { getPlayers } from "@/lib/rcon";
import type { ServerOverview } from "@/types/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const status = await getContainerStatus();
  const [stats, players] = await Promise.all([
    getContainerStats(),
    status.state === "running" ? getPlayers() : Promise.resolve([]),
  ]);

  const overview: ServerOverview = {
    status,
    stats,
    players,
    playerCount: players.length,
  };

  return NextResponse.json(overview);
}
