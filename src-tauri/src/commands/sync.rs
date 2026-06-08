use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub enabled: bool,
    pub server_url: String,
    pub username: String,
    pub password: String,
    pub remote_path: String,
    pub last_sync_at: Option<String>,
    pub last_sync_status: Option<String>,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn get_sync_config() -> Option<SyncConfig> {
    None
}

#[tauri::command]
pub fn save_sync_config(config: SyncConfig) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn test_sync_connection() -> Result<bool, String> {
    Ok(false)
}

#[tauri::command]
pub async fn trigger_sync(direction: String) -> Result<SyncResult, String> {
    Ok(SyncResult {
        success: true,
        message: format!("sync {} triggered", direction),
    })
}
