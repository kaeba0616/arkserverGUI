import { getDb } from "./db";
import type { AlertRule } from "@/types/alert";

export function checkAlerts(serverId: string, cpuPercent: number, memUsageMb: number, playerCount: number) {
  const db = getDb();
  const rules = db.prepare("SELECT * FROM alert_rules WHERE server_id = ? AND enabled = 1").all(serverId) as AlertRule[];

  for (const rule of rules) {
    let value: number;
    switch (rule.metric) {
      case "cpu": value = cpuPercent; break;
      case "memory": value = memUsageMb; break;
      case "players": value = playerCount; break;
      default: continue;
    }

    let triggered = false;
    switch (rule.operator) {
      case "gt": triggered = value > rule.threshold; break;
      case "lt": triggered = value < rule.threshold; break;
      case "eq": triggered = value === rule.threshold; break;
    }

    if (triggered) {
      const recent = db.prepare(
        "SELECT id FROM alert_events WHERE rule_id = ? AND timestamp > ? AND acknowledged = 0"
      ).get(rule.id, Date.now() - 300000);

      if (!recent) {
        db.prepare(
          "INSERT INTO alert_events (server_id, rule_id, timestamp, value, acknowledged) VALUES (?, ?, ?, ?, 0)"
        ).run(serverId, rule.id, Date.now(), value);
      }
    }
  }
}

export function getUnacknowledgedAlerts(serverId?: string) {
  const db = getDb();
  if (serverId) {
    return db.prepare(`
      SELECT ae.*, ar.metric, ar.operator, ar.threshold
      FROM alert_events ae
      JOIN alert_rules ar ON ae.rule_id = ar.id
      WHERE ae.server_id = ? AND ae.acknowledged = 0
      ORDER BY ae.timestamp DESC
      LIMIT 50
    `).all(serverId);
  }
  return db.prepare(`
    SELECT ae.*, ar.metric, ar.operator, ar.threshold
    FROM alert_events ae
    JOIN alert_rules ar ON ae.rule_id = ar.id
    WHERE ae.acknowledged = 0
    ORDER BY ae.timestamp DESC
    LIMIT 50
  `).all();
}

export function acknowledgeAlert(id: number) {
  const db = getDb();
  db.prepare("UPDATE alert_events SET acknowledged = 1 WHERE id = ?").run(id);
}

export function acknowledgeAllAlerts(serverId?: string) {
  const db = getDb();
  if (serverId) {
    db.prepare("UPDATE alert_events SET acknowledged = 1 WHERE server_id = ? AND acknowledged = 0").run(serverId);
  } else {
    db.prepare("UPDATE alert_events SET acknowledged = 1 WHERE acknowledged = 0").run();
  }
}
