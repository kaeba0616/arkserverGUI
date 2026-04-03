import cron, { type ScheduledTask } from "node-cron";
import { getDb } from "./db";
import { getServer } from "./server-registry";
import { getAdapter } from "./adapters";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const tasks: Map<string, ScheduledTask> = new Map();

function createBackup(serverId: string) {
  const server = getServer(serverId);
  if (!server) return;

  const adapter = getAdapter(server.game_id);
  const backupDir = path.join(server.data_dir, "backups");
  const saveDir = path.join(server.data_dir, adapter.savePathRelative);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1_$2");
  const filename = `${adapter.backupPrefix}-${timestamp}.tar.gz`;

  try {
    execSync(`tar -czf "${path.join(backupDir, filename)}" -C "${saveDir}" .`, { timeout: 120000 });
  } catch {
    console.error(`Scheduled backup failed for server ${serverId}`);
    return;
  }

  // Cleanup old backups
  const db = getDb();
  const schedule = db.prepare("SELECT * FROM backup_schedule WHERE server_id = ?").get(serverId) as {
    retention_days: number;
    max_count: number;
  } | undefined;

  if (schedule) {
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith(".tar.gz"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    const cutoff = Date.now() - schedule.retention_days * 86400000;
    for (const file of files) {
      if (file.time < cutoff) {
        fs.unlinkSync(path.join(backupDir, file.name));
      }
    }

    const remaining = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith(".tar.gz"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (remaining.length > schedule.max_count) {
      for (const file of remaining.slice(schedule.max_count)) {
        fs.unlinkSync(path.join(backupDir, file.name));
      }
    }
  }
}

export function startBackupScheduler() {
  // Stop all existing tasks
  for (const task of tasks.values()) {
    task.stop();
  }
  tasks.clear();

  const db = getDb();
  const schedules = db.prepare("SELECT * FROM backup_schedule WHERE enabled = 1").all() as {
    server_id: string;
    cron_expression: string;
  }[];

  for (const schedule of schedules) {
    if (schedule.server_id && cron.validate(schedule.cron_expression)) {
      const task = cron.schedule(schedule.cron_expression, () => createBackup(schedule.server_id));
      tasks.set(schedule.server_id, task);
      console.log(`Backup scheduler started for ${schedule.server_id}: ${schedule.cron_expression}`);
    }
  }
}
