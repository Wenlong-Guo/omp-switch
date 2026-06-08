-- 002_sync.sql: 同步相关表

CREATE TABLE IF NOT EXISTS sync_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER NOT NULL DEFAULT 0,
    server_url TEXT,
    username TEXT,
    password TEXT,
    remote_path TEXT DEFAULT '/omp-switch.db',
    last_sync_at TEXT,
    last_sync_status TEXT,
    last_error TEXT
);

CREATE TABLE IF NOT EXISTS sync_changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    device_id TEXT NOT NULL
);
