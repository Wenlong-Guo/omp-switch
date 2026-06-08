use crate::models::sync::{ChangelogEntry, SyncConfig};
use crate::database::connection::DbConnection;
use rusqlite::{params, Result};

pub struct SyncDao<'a> {
    db: &'a DbConnection,
}

impl<'a> SyncDao<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn get_config(&self) -> Result<Option<SyncConfig>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT enabled, server_url, username, password, remote_path, last_sync_at, last_sync_status, last_error
             FROM sync_config WHERE id = 1"
        )?;

        let config = stmt.query_row([], |row| {
            Ok(SyncConfig {
                enabled: row.get::<_, i32>(0)? != 0,
                server_url: row.get(1)?,
                username: row.get(2)?,
                password: row.get(3)?,
                remote_path: row.get(4)?,
                last_sync_at: row.get(5)?,
                last_sync_status: row.get(6)?,
                last_error: row.get(7)?,
            })
        }).optional()?;

        Ok(config)
    }

    pub fn update_config(&self, config: &SyncConfig) -> Result<()> {
        let mut conn = self.db.get_conn();

        let existing: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sync_config WHERE id = 1",
            [],
            |row| row.get(0),
        )?;

        if existing == 0 {
            conn.execute(
                "INSERT INTO sync_config (id, enabled, server_url, username, password, remote_path, last_sync_at, last_sync_status, last_error)
                 VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    config.enabled as i32,
                    config.server_url,
                    config.username,
                    config.password,
                    config.remote_path,
                    config.last_sync_at,
                    config.last_sync_status,
                    config.last_error,
                ],
            )?;
        } else {
            conn.execute(
                "UPDATE sync_config SET enabled = ?1, server_url = ?2, username = ?3, password = ?4, remote_path = ?5, last_sync_at = ?6, last_sync_status = ?7, last_error = ?8 WHERE id = 1",
                params![
                    config.enabled as i32,
                    config.server_url,
                    config.username,
                    config.password,
                    config.remote_path,
                    config.last_sync_at,
                    config.last_sync_status,
                    config.last_error,
                ],
            )?;
        }

        Ok(())
    }

    pub fn append_changelog(&self, entry: &ChangelogEntry) -> Result<()> {
        let mut conn = self.db.get_conn();
        conn.execute(
            "INSERT INTO sync_changelog (table_name, record_id, action, changed_at, device_id)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                &entry.table_name,
                &entry.record_id,
                &entry.action,
                &entry.changed_at,
                &entry.device_id,
            ],
        )?;
        Ok(())
    }

    pub fn get_changelogs_since(&self, since: &str) -> Result<Vec<ChangelogEntry>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT table_name, record_id, action, changed_at, device_id
             FROM sync_changelog WHERE changed_at > ?1 ORDER BY changed_at"
        )?;

        let entries = stmt.query_map([since], |row| {
            Ok(ChangelogEntry {
                table_name: row.get(0)?,
                record_id: row.get(1)?,
                action: row.get(2)?,
                changed_at: row.get(3)?,
                device_id: row.get(4)?,
            })
        })?;

        entries.collect()
    }

    pub fn clear_old_changelogs(&self, before: &str) -> Result<()> {
        let mut conn = self.db.get_conn();
        conn.execute(
            "DELETE FROM sync_changelog WHERE changed_at < ?1",
            [before],
        )?;
        Ok(())
    }
}
