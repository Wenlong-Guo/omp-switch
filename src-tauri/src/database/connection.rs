use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbConnection {
    conn: Mutex<Connection>,
}

impl DbConnection {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    pub fn in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    pub fn get_conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().expect("数据库连接锁被污染")
    }

    fn run_migrations(&self) -> Result<()> {
        let mut conn = self.get_conn();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS __migrations (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                applied_at TEXT NOT NULL
            )",
            [],
        )?;
        drop(conn);

        let migrations = vec![
            ("001_init.sql", include_str!("migrations/001_init.sql")),
            ("002_sync.sql", include_str!("migrations/002_sync.sql")),
            (
                "002_model_parameters.sql",
                include_str!("migrations/002_model_parameters.sql"),
            ),
            (
                "003_model_thinking_level_map.sql",
                include_str!("migrations/003_model_thinking_level_map.sql"),
            ),
        ];

        for (name, sql) in migrations {
            let mut conn = self.get_conn();
            let count: i64 = conn.query_row(
                "SELECT COUNT(*) FROM __migrations WHERE name = ?",
                [name],
                |row| row.get(0),
            )?;

            if count == 0 {
                conn.execute_batch(sql)?;
                conn.execute(
                    "INSERT INTO __migrations (name, applied_at) VALUES (?, datetime('now'))",
                    [name],
                )?;
            }
        }

        Ok(())
    }
}
