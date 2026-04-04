import { NextRequest, NextResponse } from "next/server";
import { getServer, type ServerRecord } from "./server-registry";
import { getAdapter } from "./adapters";
import type { GameAdapter } from "./adapters/types";

export interface ServerContext {
  serverId: string;
  server: ServerRecord;
  adapter: GameAdapter;
}

export function getServerContext(req: NextRequest): ServerContext | NextResponse {
  const serverId = req.nextUrl.searchParams.get("serverId") || req.headers.get("x-server-id");

  if (!serverId) {
    return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
  }

  const server = getServer(serverId);
  if (!server) {
    return NextResponse.json({ error: `Server not found: ${serverId}` }, { status: 404 });
  }

  const adapter = getAdapter(server.game_id);

  return { serverId, server, adapter };
}

export function isError(ctx: ServerContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse;
}

export function getRconConfig(server: ServerRecord) {
  return {
    host: server.rcon_host || "127.0.0.1",
    port: server.rcon_port || 0,
    password: server.rcon_password || "",
  };
}
