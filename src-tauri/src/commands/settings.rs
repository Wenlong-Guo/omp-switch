use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub default_provider: Option<String>,
    pub default_model: Option<String>,
    pub default_thinking_level: Option<String>,
    pub hide_thinking_block: Option<bool>,
    pub thinking_budgets: Option<serde_json::Value>,
    pub model_roles: Option<serde_json::Value>,
    pub retry_fallback_chains: Option<serde_json::Value>,
}

#[tauri::command]
pub fn get_settings() -> Option<AppSettings> {
    None
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    Ok(())
}
