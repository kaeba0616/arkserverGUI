import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "dashboard.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    initTables(_db);
  }
  return _db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_percent REAL,
      mem_usage_mb REAL,
      mem_limit_mb REAL,
      player_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS backup_schedule (
      id INTEGER PRIMARY KEY DEFAULT 1,
      enabled INTEGER DEFAULT 0,
      cron_expression TEXT DEFAULT '0 */6 * * *',
      retention_days INTEGER DEFAULT 7,
      max_count INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      operator TEXT NOT NULL,
      threshold REAL NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER REFERENCES alert_rules(id),
      timestamp INTEGER NOT NULL,
      value REAL NOT NULL,
      acknowledged INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO backup_schedule (id) VALUES (1);

    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alert_events_timestamp ON alert_events(timestamp);
  `);
}
