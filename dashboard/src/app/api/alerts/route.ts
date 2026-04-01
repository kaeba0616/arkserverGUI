import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { alertRuleSchema } from "@/lib/validators";
import { getUnacknowledgedAlerts, acknowledgeAlert, acknowledgeAllAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const db = getDb();
  const rules = db.prepare("SELECT * FROM alert_rules ORDER BY created_at DESC").all();
  const events = getUnacknowledgedAlerts();

  return NextResponse.json({ rules, events });
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();

  // Handle acknowledge actions
  if (body.action === "acknowledge") {
    if (body.id) {
      acknowledgeAlert(body.id);
    } else {
      acknowledgeAllAlerts();
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
    "INSERT INTO alert_rules (metric, operator, threshold, enabled, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(metric, operator, threshold, enabled ? 1 : 0, Date.now());

  return NextResponse.json({ success: true, message: "알림 규칙이 생성되었습니다." });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM alert_rules WHERE id = ?").run(id);
  db.prepare("DELETE FROM alert_events WHERE rule_id = ?").run(id);

  return NextResponse.json({ success: true, message: "알림 규칙이 삭제되었습니다." });
}
