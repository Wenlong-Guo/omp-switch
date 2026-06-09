use crate::database::connection::DbConnection;
use crate::database::provider_dao::ProviderDao;
use crate::database::settings_dao::SettingsDao;
use crate::utils::fs::{atomic_write, get_models_yaml_path, get_settings_json_path};
use std::collections::HashMap;

#[derive(Debug, thiserror::Error)]
pub enum ConfigWriterError {
    #[error("数据库错误: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("序列化错误: {0}")]
    Serialize(String),
    #[error("文件写入错误: {0}")]
    FileWrite(String),
}

pub type Result<T> = std::result::Result<T, ConfigWriterError>;

pub struct ConfigWriter<'a> {
    db: &'a DbConnection,
}

impl<'a> ConfigWriter<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn write_models_yaml(&self) -> Result<()> {
        let dao = ProviderDao::new(self.db);
        let providers = dao.get_all()?;

        let mut providers_map = HashMap::new();
        for p in providers {
            let mut config = serde_json::Map::new();
            config.insert("name".to_string(), serde_json::Value::String(p.name));
            if let Some(url) = p.base_url {
                config.insert("baseUrl".to_string(), serde_json::Value::String(url));
            }
            if let Some(key) = p.api_key {
                config.insert("apiKey".to_string(), serde_json::Value::String(key));
            }
            if let Some(api) = p.api_type {
                config.insert("api".to_string(), serde_json::Value::String(api));
            }
            if let Some(headers) = p.headers {
                config.insert("headers".to_string(), serde_json::Value::Object(
                    headers.into_iter().map(|(k, v)| (k, serde_json::Value::String(v))).collect()
                ));
            }
            if let Some(auth_header) = p.auth_header {
                config.insert("authHeader".to_string(), serde_json::Value::Bool(auth_header));
            }
            if let Some(auth) = p.auth {
                config.insert("auth".to_string(), serde_json::Value::String(auth));
            }
            if let Some(discovery) = p.discovery {
                config.insert("discovery".to_string(), serde_json::to_value(discovery).unwrap());
            }
            providers_map.insert(p.id, serde_json::Value::Object(config));
        }

        let yaml_data = serde_json::json!({ "providers": providers_map });
        let yaml_str = serde_yaml::to_string(&yaml_data)
            .map_err(|e| ConfigWriterError::Serialize(e.to_string()))?;
        let path = get_models_yaml_path();
        crate::utils::fs::ensure_dir(&path.parent().unwrap_or(&path).to_path_buf())
            .map_err(|e| ConfigWriterError::FileWrite(e.to_string()))?;
        atomic_write(&path, &yaml_str)
            .map_err(|e| ConfigWriterError::FileWrite(e.to_string()))?;

        Ok(())
    }

    pub fn write_settings_json(&self) -> Result<()> {
        let dao = SettingsDao::new(self.db);
        if let Some(settings) = dao.get()? {
            let json_str = serde_json::to_string_pretty(&settings)
                .map_err(|e| ConfigWriterError::Serialize(e.to_string()))?;
            let path = get_settings_json_path();
            crate::utils::fs::ensure_dir(&path.parent().unwrap_or(&path).to_path_buf())
                .map_err(|e| ConfigWriterError::FileWrite(e.to_string()))?;
            atomic_write(&path, &json_str)
                .map_err(|e| ConfigWriterError::FileWrite(e.to_string()))?;
        }
        Ok(())
    }
}
