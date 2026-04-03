import { getDb } from "./db";
import { getContainerStats } from "./docker";
import { getPlayers, type RconConfig } from "./rcon";
import { getServers } from "./server-registry";
import { getAdapter } from "./adapters";

let intervalId: ReturnType<typeof setInterval> | null = null;

async function collectMetrics() {
  const servers = getServers();

  for (const server of servers) {
    try {
      const adapter = getAdapter(server.game_id);
      const stats = await getContainerStats(server.container_name);
      if (!stats) continue;

      let playerCount = 0;
      if (adapter.rcon.supported && server.rcon_port) {
        try {
          const rconConfig: RconConfig = {
            host: server.rcon_host || "127.0.0.1",
            port: server.rcon_port,
            password: server.rcon_password || "",
          };
          const players = await getPlayers(rconConfig, adapter);
          playerCount = players.length;
        } catch {
          // RCON may be unavailable
        }
      }

      const db = getDb();
      db.prepare(
        "INSERT INTO metrics (server_id, timestamp, cpu_percent, mem_usage_mb, mem_limit_mb, player_count) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(server.id, Date.now(), stats.cpuPercent, stats.memUsageMb, stats.memLimitMb, playerCount);
    } catch {
      // Silently fail - container may not be running
    }
  }

  // Cleanup old data (30 days)
  try {
    const cutoff = Date.now() - 30 * 86400000;
    const db = getDb();
    db.prepare("DELETE FROM metrics WHERE timestamp < ?").run(cutoff);
  } catch {
    // ignore
  }
}

export function startMetricsCollector() {
  if (intervalId) return;
  intervalId = setInterval(collectMetrics, 30000);
  collectMetrics();
  console.log("Metrics collector started (30s interval)");
}

export function stopMetricsCollector() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
