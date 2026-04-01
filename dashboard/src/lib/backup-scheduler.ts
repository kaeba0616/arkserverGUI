import cron, { type ScheduledTask } from "node-cron";
import { getDb } from "./db";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.env.ARK_PROJECT_DIR || "/home/hidi/dev/arkSurv", "backups");
const SAVE_DIR = path.join(process.env.ARK_PROJECT_DIR || "/home/hidi/dev/arkSurv", "ark-data/server/ShooterGame/Saved");

let currentTask: ScheduledTask | null = null;

function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1_$2");
  const filename = `ark-backup-${timestamp}.tar.gz`;

  try {
    execSync(`tar -czf "${path.join(BACKUP_DIR, filename)}" -C "${SAVE_DIR}" .`, { timeout: 120000 });
  } catch {
    console.error("Scheduled backup failed");
    return;
  }

  // Cleanup old backups
  const db = getDb();
  const schedule = db.prepare("SELECT * FROM backup_schedule WHERE id = 1").get() as {
    retention_days: number;
    max_count: number;
  };

  if (schedule) {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("ark-backup-") && f.endsWith(".tar.gz"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    const cutoff = Date.now() - schedule.retention_days * 86400000;
    for (const file of files) {
      if (file.time < cutoff) {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      }
    }

    const remaining = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("ark-backup-") && f.endsWith(".tar.gz"))
      .map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (remaining.length > schedule.max_count) {
      for (const file of remaining.slice(schedule.max_count)) {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      }
    }
  }
}

export function startBackupScheduler() {
  const db = getDb();
  const schedule = db.prepare("SELECT * FROM backup_schedule WHERE id = 1").get() as {
    enabled: number;
    cron_expression: string;
  } | undefined;

  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  if (schedule?.enabled && cron.validate(schedule.cron_expression)) {
    currentTask = cron.schedule(schedule.cron_expression, createBackup);
    console.log(`Backup scheduler started: ${schedule.cron_expression}`);
  }
}
