import { getDb } from "./db";
import { getAdapter } from "./adapters";
import fs from "fs";
import path from "path";

export interface ServerRecord {
  id: string;
  name: string;
  game_id: string;
  container_name: string;
  rcon_host: string;
  rcon_port: number | null;
  rcon_password: string | null;
  data_dir: string;
  env_overrides: string;
  port_mappings: string;
  created_at: number;
  sort_order: number;
}

export function getServers(): ServerRecord[] {
  const db = getDb();
  return db.prepare("SELECT * FROM servers ORDER BY sort_order, created_at").all() as ServerRecord[];
}

export function getServer(id: string): ServerRecord | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM servers WHERE id = ?").get(id) as ServerRecord) || null;
}

export function createServer(server: {
  id: string;
  name: string;
  game_id: string;
  container_name: string;
  rcon_host?: string;
  rcon_port?: number;
  rcon_password?: string;
  data_dir: string;
  env_overrides?: Record<string, string>;
  port_mappings?: Record<string, number>;
}): ServerRecord {
  const db = getDb();

  // Validate adapter exists
  getAdapter(server.game_id);

  const dataDir = server.data_dir;
  fs.mkdirSync(path.join(dataDir, "config"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "backups"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "server-data"), { recursive: true });

  db.prepare(`
    INSERT INTO servers (id, name, game_id, container_name, rcon_host, rcon_port, rcon_password, data_dir, env_overrides, port_mappings, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    server.id,
    server.name,
    server.game_id,
    server.container_name,
    server.rcon_host || "127.0.0.1",
    server.rcon_port || null,
    server.rcon_password || null,
    dataDir,
    JSON.stringify(server.env_overrides || {}),
    JSON.stringify(server.port_mappings || {}),
    Date.now(),
  );

  // Create backup schedule for this server
  db.prepare(`
    INSERT INTO backup_schedule (server_id, enabled, cron_expression, retention_days, max_count)
    VALUES (?, 0, '0 */6 * * *', 7, 20)
  `).run(server.id);

  return getServer(server.id)!;
}

export function updateServer(id: string, updates: Partial<{
  name: string;
  rcon_host: string;
  rcon_port: number;
  rcon_password: string;
  env_overrides: Record<string, string>;
  port_mappings: Record<string, number>;
  sort_order: number;
}>): ServerRecord | null {
  const db = getDb();
  const server = getServer(id);
  if (!server) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.rcon_host !== undefined) { fields.push("rcon_host = ?"); values.push(updates.rcon_host); }
  if (updates.rcon_port !== undefined) { fields.push("rcon_port = ?"); values.push(updates.rcon_port); }
  if (updates.rcon_password !== undefined) { fields.push("rcon_password = ?"); values.push(updates.rcon_password); }
  if (updates.env_overrides !== undefined) { fields.push("env_overrides = ?"); values.push(JSON.stringify(updates.env_overrides)); }
  if (updates.port_mappings !== undefined) { fields.push("port_mappings = ?"); values.push(JSON.stringify(updates.port_mappings)); }
  if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }

  if (fields.length === 0) return server;

  values.push(id);
  db.prepare(`UPDATE servers SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return getServer(id);
}

export function deleteServer(id: string): boolean {
  const db = getDb();
  const server = getServer(id);
  if (!server) return false;

  db.prepare("DELETE FROM metrics WHERE server_id = ?").run(id);
  db.prepare("DELETE FROM alert_events WHERE server_id = ?").run(id);
  db.prepare("DELETE FROM alert_rules WHERE server_id = ?").run(id);
  db.prepare("DELETE FROM backup_schedule WHERE server_id = ?").run(id);
  db.prepare("DELETE FROM servers WHERE id = ?").run(id);

  return true;
}
