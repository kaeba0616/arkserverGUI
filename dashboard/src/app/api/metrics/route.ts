import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const range = req.nextUrl.searchParams.get("range") || "1h";

  const ranges: Record<string, number> = {
    "1h": 3600000,
    "6h": 21600000,
    "24h": 86400000,
    "7d": 604800000,
  };

  const ms = ranges[range] || ranges["1h"];
  const since = Date.now() - ms;

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM metrics WHERE timestamp > ? ORDER BY timestamp ASC")
    .all(since) as {
    timestamp: number;
    cpu_percent: number;
    mem_usage_mb: number;
    mem_limit_mb: number;
    player_count: number;
  }[];

  const metrics = rows.map((r) => ({
    timestamp: r.timestamp,
    cpuPercent: r.cpu_percent,
    memUsageMb: r.mem_usage_mb,
    memLimitMb: r.mem_limit_mb,
    playerCount: r.player_count,
  }));

  return NextResponse.json(metrics);
}
