import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "dashboard.db");
const LATEST_VERSION = 2;

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    runMigrations(_db);
  }
  return _db;
}

function getSchemaVersion(db: Database.Database): number {
  try {
    const row = db.prepare("SELECT version FROM schema_version WHERE id = 1").get() as { version: number } | undefined;
    return row?.version ?? 0;
  } catch {
    return 0;
  }
}

function setSchemaVersion(db: Database.Database, version: number) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_version (id INTEGER PRIMARY KEY, version INTEGER NOT NULL)");
  db.prepare("INSERT OR REPLACE INTO schema_version (id, version) VALUES (1, ?)").run(version);
}

function runMigrations(db: Database.Database) {
  const current = getSchemaVersion(db);

  if (current < 1) {
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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

      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_alert_events_timestamp ON alert_events(timestamp);
    `);
  }

  if (current < 2) {
    // servers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        game_id TEXT NOT NULL,
        container_name TEXT NOT NULL UNIQUE,
        rcon_host TEXT DEFAULT '127.0.0.1',
        rcon_port INTEGER,
        rcon_password TEXT,
        data_dir TEXT NOT NULL,
        env_overrides TEXT DEFAULT '{}',
        port_mappings TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
    `);

    // Add server_id to existing tables
    const addColumn = (table: string) => {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN server_id TEXT REFERENCES servers(id)`);
      } catch {
        // Column already exists
      }
    };

    addColumn("metrics");
    addColumn("alert_rules");
    addColumn("alert_events");
    addColumn("backup_schedule");

    // Remove the old single-row constraint for backup_schedule
    // The id=1 default row will be associated with the first server during auto-migration

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_metrics_server_timestamp ON metrics(server_id, timestamp);
    `);
  }

  setSchemaVersion(db, LATEST_VERSION);
}
