use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub is_built_in: bool,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api_type: Option<String>,
    pub headers: Option<serde_json::Value>,
    pub auth_header: Option<bool>,
    pub auth: Option<String>,
    pub discovery: Option<serde_json::Value>,
    pub model_overrides: Option<serde_json::Value>,
    pub models: Option<serde_json::Value>,
}

#[tauri::command]
pub fn get_providers() -> Vec<ProviderConfig> {
    vec![]
}

#[tauri::command]
pub fn save_provider(config: ProviderConfig) -> Result<ProviderConfig, String> {
    Ok(config)
}

#[tauri::command]
pub fn delete_provider(id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn set_active_provider(provider_id: String, model_id: Option<String>) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn get_builtin_presets() -> Vec<ProviderConfig> {
    vec![]
}
