use crate::database::connection::DbConnection;
use crate::database::provider_dao::ProviderDao;
use crate::database::settings_dao::SettingsDao;
use crate::models::provider::ProviderConfig;
use crate::models::settings::AppSettings;
use crate::utils::fs::{get_models_yaml_path, get_settings_json_path};
use rusqlite::Result;

pub struct ConfigReader<'a> {
    db: &'a DbConnection,
}

impl<'a> ConfigReader<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn read_models_yaml(&self) -> Result<Vec<ProviderConfig>> {
        let path = get_models_yaml_path();
        if !path.exists() {
            return Ok(vec![]);
        }

        let content = std::fs::read_to_string(&path).unwrap_or_default();
        if content.trim().is_empty() {
            return Ok(vec![]);
        }

        // Parse YAML and return providers
        // For MVP, simplified - just read from SQLite
        let dao = ProviderDao::new(self.db);
        dao.get_all()
    }

    pub fn read_settings_json(&self) -> Result<Option<AppSettings>> {
        let path = get_settings_json_path();
        if !path.exists() {
            return Ok(None);
        }

        let content = std::fs::read_to_string(&path).unwrap_or_default();
        if content.trim().is_empty() {
            return Ok(None);
        }

        let settings: AppSettings = serde_json::from_str(&content).unwrap_or_default();
        
        // Write to SQLite
        let dao = SettingsDao::new(self.db);
        dao.update(&settings)?;

        Ok(Some(settings))
    }
}
