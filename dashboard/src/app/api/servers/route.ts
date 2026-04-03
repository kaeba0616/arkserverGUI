import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServers, createServer } from "@/lib/server-registry";
import { getContainerStatus, getContainerStats, createContainer, containerExists } from "@/lib/docker";
import { getAdapter, getAllAdapters } from "@/lib/adapters";
import path from "path";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createServerSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  gameId: z.string().min(1),
  rconPassword: z.string().optional(),
  envOverrides: z.record(z.string(), z.string()).optional(),
  portMappings: z.record(z.string(), z.number()).optional(),
});

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const servers = getServers();

  // Enrich with live status
  const enriched = await Promise.all(
    servers.map(async (server) => {
      let status;
      let stats = null;
      try {
        status = await getContainerStatus(server.container_name);
        if (status.state === "running") {
          stats = await getContainerStats(server.container_name);
        }
      } catch {
        status = { state: "unknown" as const, uptime: null, startedAt: null };
      }

      const adapter = getAdapter(server.game_id);

      return {
        id: server.id,
        name: server.name,
        gameId: server.game_id,
        gameName: adapter.displayName,
        containerName: server.container_name,
        status,
        stats,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const parsed = createServerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
  }

  const { id, name, gameId, rconPassword, envOverrides, portMappings } = parsed.data;

  // Validate adapter exists
  let adapter;
  try {
    adapter = getAdapter(gameId);
  } catch {
    return NextResponse.json({ error: `Unknown game: ${gameId}. Available: ${getAllAdapters().map(a => a.id).join(", ")}` }, { status: 400 });
  }

  const containerName = `game-${id}`;
  const dataDir = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "servers", id);

  // Check if container already exists
  if (await containerExists(containerName)) {
    return NextResponse.json({ error: `Container ${containerName} already exists` }, { status: 409 });
  }

  // Determine ports
  const ports = portMappings || {};
  for (const portDef of adapter.ports) {
    if (!(portDef.name in ports)) {
      ports[portDef.name] = portDef.default;
    }
  }

  const rconPort = ports["RCON"] || adapter.rcon.defaultPort;

  // Build env vars
  const env: Record<string, string> = {
    ...adapter.docker.defaultEnv,
    ...envOverrides,
  };

  // Set RCON password in env if provided
  if (rconPassword) {
    env.RCON_PASSWORD = rconPassword;
    // For ARK
    if (gameId === "ark") {
      env.ADMIN_PASSWORD = rconPassword;
    }
    // For Minecraft
    if (gameId === "minecraft") {
      env.RCON_PASSWORD = rconPassword;
      env.ENABLE_RCON = "true";
    }
  }

  try {
    // Create server record in DB
    const server = createServer({
      id,
      name,
      game_id: gameId,
      container_name: containerName,
      rcon_host: "127.0.0.1",
      rcon_port: rconPort,
      rcon_password: rconPassword,
      data_dir: dataDir,
      env_overrides: envOverrides,
      port_mappings: ports,
    });

    // Create Docker container
    const dockerPorts = adapter.ports.map((p) => ({
      host: ports[p.name] || p.default,
      container: p.default,
      protocol: p.protocol === "both" ? "tcp" : p.protocol,
    }));

    const dockerVolumes = adapter.docker.volumes.map((v) => ({
      host: path.join(dataDir, v.hostRelative),
      container: v.container,
      readonly: v.readonly,
    }));

    await createContainer({
      name: containerName,
      image: adapter.docker.image,
      env,
      ports: dockerPorts,
      volumes: dockerVolumes,
      resources: adapter.docker.resources
        ? { memLimit: `${adapter.docker.resources.memLimitGb}g`, cpus: adapter.docker.resources.cpus }
        : undefined,
      networkMode: adapter.docker.networkMode,
    });

    return NextResponse.json({ success: true, server, message: `서버 "${name}"이 생성되었습니다.` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Server creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
