use crate::models::provider::{ModelCost, ModelDefinition, ModelOverride, ProviderConfig};
use crate::database::connection::DbConnection;
use rusqlite::{params, OptionalExtension, Result};
use serde_json;

pub struct ProviderDao<'a> {
    db: &'a DbConnection,
}

impl<'a> ProviderDao<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn create(&self, provider: &ProviderConfig) -> Result<()> {
        let mut conn = self.db.get_conn();
        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO providers (id, name, enabled, is_built_in, base_url, api_key, api_type, headers, auth_header, auth, discovery, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'), datetime('now'))",
            params![
                provider.id,
                provider.name,
                provider.enabled as i32,
                provider.is_built_in as i32,
                provider.base_url,
                provider.api_key,
                provider.api_type,
                provider.headers.as_ref().map(|h| serde_json::to_string(h).unwrap()),
                provider.auth_header.map(|v| v as i32),
                provider.auth,
                provider.discovery.as_ref().map(|d| serde_json::to_string(d).unwrap()),
            ],
        )?;

        if let Some(models) = &provider.models {
            for model in models {
                self.insert_model(&tx, &provider.id, model)?;
            }
        }

        if let Some(overrides) = &provider.model_overrides {
            for (model_id, model_override) in overrides {
                self.insert_override(&tx, &provider.id, model_id, model_override)?;
            }
        }

        tx.commit()?;
        Ok(())
    }

    pub fn update(&self, provider: &ProviderConfig) -> Result<()> {
        let mut conn = self.db.get_conn();
        let tx = conn.transaction()?;

        tx.execute(
            "UPDATE providers SET name = ?2, enabled = ?3, is_built_in = ?4, base_url = ?5, api_key = ?6, api_type = ?7, headers = ?8, auth_header = ?9, auth = ?10, discovery = ?11, updated_at = datetime('now') WHERE id = ?1",
            params![
                provider.id,
                provider.name,
                provider.enabled as i32,
                provider.is_built_in as i32,
                provider.base_url,
                provider.api_key,
                provider.api_type,
                provider.headers.as_ref().map(|h| serde_json::to_string(h).unwrap()),
                provider.auth_header.map(|v| v as i32),
                provider.auth,
                provider.discovery.as_ref().map(|d| serde_json::to_string(d).unwrap()),
            ],
        )?;

        // Delete old models and overrides, re-insert
        tx.execute("DELETE FROM provider_models WHERE provider_id = ?1", [&provider.id])?;
        tx.execute("DELETE FROM model_overrides WHERE provider_id = ?1", [&provider.id])?;

        if let Some(models) = &provider.models {
            for model in models {
                self.insert_model(&tx, &provider.id, model)?;
            }
        }

        if let Some(overrides) = &provider.model_overrides {
            for (model_id, model_override) in overrides {
                self.insert_override(&tx, &provider.id, model_id, model_override)?;
            }
        }

        tx.commit()?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        let mut conn = self.db.get_conn();
        conn.execute("DELETE FROM providers WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_by_id(&self, id: &str) -> Result<Option<ProviderConfig>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT id, name, enabled, is_built_in, base_url, api_key, api_type, headers, auth_header, auth, discovery, created_at, updated_at
             FROM providers WHERE id = ?1"
        )?;

        let provider = stmt.query_row([id], |row| {
            Ok(ProviderConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                enabled: row.get::<_, i32>(2)? != 0,
                is_built_in: row.get::<_, i32>(3)? != 0,
                base_url: row.get(4)?,
                api_key: row.get(5)?,
                api_type: row.get(6)?,
                headers: row.get::<_, Option<String>>(7)?.and_then(|s| serde_json::from_str(&s).ok()),
                auth_header: row.get::<_, Option<i32>>(8)?.map(|v| v != 0),
                auth: row.get(9)?,
                discovery: row.get::<_, Option<String>>(10)?.and_then(|s| serde_json::from_str(&s).ok()),
                model_overrides: None,
                models: None,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        }).optional()?;

        if let Some(mut p) = provider {
            p.models = self.get_models(&conn, id)?;
            Ok(Some(p))
        } else {
            Ok(None)
        }
    }

    fn get_models(&self, conn: &rusqlite::Connection, provider_id: &str) -> Result<Option<Vec<ModelDefinition>>> {
        let mut stmt = conn.prepare(
            "SELECT model_id, name, api_type, reasoning, input_types, cost, context_window, max_tokens, headers, compat
             FROM provider_models WHERE provider_id = ?1 ORDER BY name"
        )?;

        let models = stmt.query_map([provider_id], |row| {
            Ok(ModelDefinition {
                id: row.get(0)?,
                name: row.get(1)?,
                api_type: row.get(2)?,
                reasoning: row.get::<_, i32>(3)? != 0,
                input_types: row.get::<_, String>(4).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default(),
                cost: row.get::<_, String>(5).ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or(ModelCost { input: 0.0, output: 0.0, cache_read: 0.0, cache_write: 0.0 }),
                context_window: row.get(6)?,
                max_tokens: row.get(7)?,
                headers: row.get::<_, Option<String>>(8)?.and_then(|s| serde_json::from_str(&s).ok()),
                compat: row.get::<_, Option<String>>(9)?.and_then(|s| serde_json::from_str(&s).ok()),
            })
        })?;

        let collected: Vec<ModelDefinition> = models.collect::<Result<Vec<_>>>()?;
        if collected.is_empty() {
            Ok(None)
        } else {
            Ok(Some(collected))
        }
    }

    pub fn get_all(&self) -> Result<Vec<ProviderConfig>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT id, name, enabled, is_built_in, base_url, api_key, api_type, headers, auth_header, auth, discovery, created_at, updated_at
             FROM providers ORDER BY name"
        )?;

        let providers = stmt.query_map([], |row| {
            Ok(ProviderConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                enabled: row.get::<_, i32>(2)? != 0,
                is_built_in: row.get::<_, i32>(3)? != 0,
                base_url: row.get(4)?,
                api_key: row.get(5)?,
                api_type: row.get(6)?,
                headers: row.get::<_, Option<String>>(7)?.and_then(|s| serde_json::from_str(&s).ok()),
                auth_header: row.get::<_, Option<i32>>(8)?.map(|v| v != 0),
                auth: row.get(9)?,
                discovery: row.get::<_, Option<String>>(10)?.and_then(|s| serde_json::from_str(&s).ok()),
                model_overrides: None,
                models: None,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        let mut result = Vec::new();
        for p in providers {
            let mut p = p?;
            p.models = self.get_models(&conn, &p.id)?;
            result.push(p);
        }
        Ok(result)
    }

    pub fn get_enabled(&self) -> Result<Vec<ProviderConfig>> {
        let mut conn = self.db.get_conn();
        let mut stmt = conn.prepare(
            "SELECT id, name, enabled, is_built_in, base_url, api_key, api_type, headers, auth_header, auth, discovery, created_at, updated_at
             FROM providers WHERE enabled = 1 ORDER BY name"
        )?;

        let providers = stmt.query_map([], |row| {
            Ok(ProviderConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                enabled: row.get::<_, i32>(2)? != 0,
                is_built_in: row.get::<_, i32>(3)? != 0,
                base_url: row.get(4)?,
                api_key: row.get(5)?,
                api_type: row.get(6)?,
                headers: row.get::<_, Option<String>>(7)?.and_then(|s| serde_json::from_str(&s).ok()),
                auth_header: row.get::<_, Option<i32>>(8)?.map(|v| v != 0),
                auth: row.get(9)?,
                discovery: row.get::<_, Option<String>>(10)?.and_then(|s| serde_json::from_str(&s).ok()),
                model_overrides: None,
                models: None,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        providers.collect()
    }

    fn insert_model(&self, tx: &rusqlite::Transaction, provider_id: &str, model: &ModelDefinition) -> Result<()> {
        tx.execute(
            "INSERT INTO provider_models (id, provider_id, model_id, name, api_type, reasoning, input_types, cost, context_window, max_tokens, headers, compat)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                format!("{}-{}", provider_id, model.id),
                provider_id,
                model.id,
                model.name,
                model.api_type,
                model.reasoning as i32,
                serde_json::to_string(&model.input_types).unwrap(),
                serde_json::to_string(&model.cost).unwrap(),
                model.context_window,
                model.max_tokens,
                model.headers.as_ref().map(|h| serde_json::to_string(h).unwrap()),
                model.compat.as_ref().map(|c| serde_json::to_string(c).unwrap()),
            ],
        )?;
        Ok(())
    }

    fn insert_override(&self, tx: &rusqlite::Transaction, provider_id: &str, model_id: &str, model_override: &ModelOverride) -> Result<()> {
        tx.execute(
            "INSERT INTO model_overrides (provider_id, model_id, override_data)
             VALUES (?1, ?2, ?3)",
            params![
                provider_id,
                model_id,
                serde_json::to_string(model_override).unwrap(),
            ],
        )?;
        Ok(())
    }
}
