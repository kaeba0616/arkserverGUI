import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { backupScheduleSchema } from "@/lib/validators";
import { getServerContext, isError } from "@/lib/api-server-context";
import type { BackupSchedule } from "@/types/backup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const db = getDb();
  const row = db.prepare("SELECT * FROM backup_schedule WHERE server_id = ?").get(ctx.serverId) as {
    enabled: number;
    cron_expression: string;
    retention_days: number;
    max_count: number;
  } | undefined;

  const schedule: BackupSchedule = row
    ? {
        enabled: !!row.enabled,
        cronExpression: row.cron_expression,
        retentionDays: row.retention_days,
        maxCount: row.max_count,
      }
    : { enabled: false, cronExpression: "0 */6 * * *", retentionDays: 7, maxCount: 20 };

  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const body = await req.json();
  const parsed = backupScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
  }

  const { enabled, cronExpression, retentionDays, maxCount } = parsed.data;
  const db = getDb();

  // Upsert
  const existing = db.prepare("SELECT id FROM backup_schedule WHERE server_id = ?").get(ctx.serverId);
  if (existing) {
    db.prepare(
      "UPDATE backup_schedule SET enabled = ?, cron_expression = ?, retention_days = ?, max_count = ? WHERE server_id = ?"
    ).run(enabled ? 1 : 0, cronExpression, retentionDays, maxCount, ctx.serverId);
  } else {
    db.prepare(
      "INSERT INTO backup_schedule (server_id, enabled, cron_expression, retention_days, max_count) VALUES (?, ?, ?, ?, ?)"
    ).run(ctx.serverId, enabled ? 1 : 0, cronExpression, retentionDays, maxCount);
  }

  return NextResponse.json({ success: true, message: "백업 스케줄이 저장되었습니다." });
}
