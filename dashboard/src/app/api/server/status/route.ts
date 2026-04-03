import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getContainerStatus, getContainerStats } from "@/lib/docker";
import { getPlayers } from "@/lib/rcon";
import { getServerContext, isError, getRconConfig } from "@/lib/api-server-context";
import type { ServerOverview } from "@/types/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server, adapter } = ctx;

  const status = await getContainerStatus(server.container_name);
  const rconConfig = getRconConfig(server);

  const [stats, players] = await Promise.all([
    getContainerStats(server.container_name),
    status.state === "running" && adapter.rcon.supported
      ? getPlayers(rconConfig, adapter)
      : Promise.resolve([]),
  ]);

  const overview: ServerOverview = {
    status,
    stats,
    players,
    playerCount: players.length,
  };

  return NextResponse.json(overview);
}
