use crate::commands::provider::get_db;
use crate::models::sync::{SyncConfig, SyncResult};
use crate::services::sync_service::SyncService;

#[tauri::command]
pub fn get_sync_config() -> Result<Option<SyncConfig>, String> {
    let service = SyncService::new(get_db());
    service.get_config()
}

#[tauri::command]
pub fn save_sync_config(config: SyncConfig) -> Result<(), String> {
    let service = SyncService::new(get_db());
    service.save_config(&config)
}

#[tauri::command]
pub async fn test_sync_connection() -> Result<bool, String> {
    let service = SyncService::new(get_db());
    service.test_connection().await
}

#[tauri::command]
pub async fn trigger_sync(direction: String) -> Result<SyncResult, String> {
    let service = SyncService::new(get_db());
    match direction.as_str() {
        "upload" => service.upload().await,
        "download" => service.download().await,
        _ => Err(format!("Unknown sync direction: {}", direction)),
    }
}
