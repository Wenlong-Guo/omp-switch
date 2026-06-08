use crate::models::settings::AppSettings;
use crate::database::connection::DbConnection;
use rusqlite::{params, Result};

pub struct SettingsDao<'a> {
    db: &'a DbConnection,
}

impl<'a> SettingsDao<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn get(&self) -> Result<Option<AppSettings>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT default_provider, default_model, default_thinking_level, hide_thinking_block, thinking_budgets, model_roles, retry_fallback_chains
             FROM app_settings WHERE id = 1"
        )?;

        let settings = stmt.query_row([], |row| {
            let thinking_budgets: Option<String> = row.get(4)?;
            let model_roles: Option<String> = row.get(5)?;
            let retry: Option<String> = row.get(6)?;

            Ok(AppSettings {
                default_provider: row.get(0)?,
                default_model: row.get(1)?,
                default_thinking_level: row.get(2)?,
                hide_thinking_block: row.get::<_, Option<i32>>(3)?.map(|v| v != 0),
                thinking_budgets: thinking_budgets.and_then(|s| serde_json::from_str(&s).ok()),
                model_roles: model_roles.and_then(|s| serde_json::from_str(&s).ok()),
                retry: retry.and_then(|s| serde_json::from_str(&s).ok()),
            })
        }).optional()?;

        Ok(settings)
    }

    pub fn update(&self, settings: &AppSettings) -> Result<()> {
        let mut conn = self.db.get_conn();

        let existing: i64 = conn.query_row(
            "SELECT COUNT(*) FROM app_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )?;

        if existing == 0 {
            conn.execute(
                "INSERT INTO app_settings (id, default_provider, default_model, default_thinking_level, hide_thinking_block, thinking_budgets, model_roles, retry_fallback_chains, updated_at)
                 VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))",
                params![
                    settings.default_provider,
                    settings.default_model,
                    settings.default_thinking_level,
                    settings.hide_thinking_block.map(|v| v as i32),
                    settings.thinking_budgets.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                    settings.model_roles.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                    settings.retry.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                ],
            )?;
        } else {
            conn.execute(
                "UPDATE app_settings SET default_provider = ?1, default_model = ?2, default_thinking_level = ?3, hide_thinking_block = ?4, thinking_budgets = ?5, model_roles = ?6, retry_fallback_chains = ?7, updated_at = datetime('now') WHERE id = 1",
                params![
                    settings.default_provider,
                    settings.default_model,
                    settings.default_thinking_level,
                    settings.hide_thinking_block.map(|v| v as i32),
                    settings.thinking_budgets.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                    settings.model_roles.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                    settings.retry.as_ref().map(|v| serde_json::to_string(v).unwrap()),
                ],
            )?;
        }

        Ok(())
    }
}
