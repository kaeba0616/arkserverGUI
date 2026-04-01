import { getDb } from "./db";
import { getContainerStats } from "./docker";
import { getPlayers } from "./rcon";

let intervalId: ReturnType<typeof setInterval> | null = null;

async function collectMetrics() {
  try {
    const [stats, players] = await Promise.all([
      getContainerStats(),
      getPlayers().catch(() => []),
    ]);

    if (!stats) return;

    const db = getDb();
    db.prepare(
      "INSERT INTO metrics (timestamp, cpu_percent, mem_usage_mb, mem_limit_mb, player_count) VALUES (?, ?, ?, ?, ?)"
    ).run(Date.now(), stats.cpuPercent, stats.memUsageMb, stats.memLimitMb, players.length);

    // Cleanup old data (30 days)
    const cutoff = Date.now() - 30 * 86400000;
    db.prepare("DELETE FROM metrics WHERE timestamp < ?").run(cutoff);
  } catch {
    // Silently fail - container may not be running
  }
}

export function startMetricsCollector() {
  if (intervalId) return;
  intervalId = setInterval(collectMetrics, 30000);
  collectMetrics(); // Initial collection
  console.log("Metrics collector started (30s interval)");
}

export function stopMetricsCollector() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
