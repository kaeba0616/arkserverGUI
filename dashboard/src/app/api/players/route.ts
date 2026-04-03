import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getPlayers } from "@/lib/rcon";
import { getServerContext, isError, getRconConfig } from "@/lib/api-server-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server, adapter } = ctx;
  const rconConfig = getRconConfig(server);

  const players = await getPlayers(rconConfig, adapter);
  return NextResponse.json({ players, count: players.length });
}
