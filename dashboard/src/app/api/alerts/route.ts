import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { alertRuleSchema } from "@/lib/validators";
import { getServerContext, isError } from "@/lib/api-server-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const db = getDb();
  const rules = db.prepare("SELECT * FROM alert_rules WHERE server_id = ? ORDER BY created_at DESC").all(ctx.serverId);
  const events = db.prepare(`
    SELECT ae.*, ar.metric, ar.operator, ar.threshold
    FROM alert_events ae
    JOIN alert_rules ar ON ae.rule_id = ar.id
    WHERE ae.server_id = ? AND ae.acknowledged = 0
    ORDER BY ae.timestamp DESC
    LIMIT 50
  `).all(ctx.serverId);

  return NextResponse.json({ rules, events });
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const body = await req.json();

  // Handle acknowledge actions
  if (body.action === "acknowledge") {
    const db = getDb();
    if (body.id) {
      db.prepare("UPDATE alert_events SET acknowledged = 1 WHERE id = ? AND server_id = ?").run(body.id, ctx.serverId);
    } else {
      db.prepare("UPDATE alert_events SET acknowledged = 1 WHERE server_id = ? AND acknowledged = 0").run(ctx.serverId);
    }
    return NextResponse.json({ success: true });
  }

  // Create new rule
  const parsed = alertRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rule" }, { status: 400 });
  }

  const { metric, operator, threshold, enabled } = parsed.data;
  const db = getDb();
  db.prepare(
    "INSERT INTO alert_rules (server_id, metric, operator, threshold, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(ctx.serverId, metric, operator, threshold, enabled ? 1 : 0, Date.now());

  return NextResponse.json({ success: true, message: "알림 규칙이 생성되었습니다." });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM alert_rules WHERE id = ? AND server_id = ?").run(id, ctx.serverId);
  db.prepare("DELETE FROM alert_events WHERE rule_id = ?").run(id);

  return NextResponse.json({ success: true, message: "알림 규칙이 삭제되었습니다." });
}
