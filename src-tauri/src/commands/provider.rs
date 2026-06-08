use crate::database::connection::DbConnection;
use crate::services::provider_service::ProviderService;
use crate::models::provider::ProviderConfig;
use std::sync::OnceLock;

static DB: OnceLock<DbConnection> = OnceLock::new();

fn get_db() -> &'static DbConnection {
    DB.get_or_init(|| {
        let db_path = crate::utils::fs::get_db_path();
        crate::utils::fs::ensure_dir(&db_path.parent().unwrap().to_path_buf()).unwrap();
        DbConnection::new(db_path).expect("Failed to open database")
    })
}

#[tauri::command]
pub fn get_providers() -> Result<Vec<ProviderConfig>, String> {
    let service = ProviderService::new(get_db());
    service.get_all()
}

#[tauri::command]
pub fn save_provider(config: ProviderConfig) -> Result<ProviderConfig, String> {
    let service = ProviderService::new(get_db());
    service.save(config)
}

#[tauri::command]
pub fn delete_provider(id: String) -> Result<(), String> {
    let service = ProviderService::new(get_db());
    service.delete(&id)
}

#[tauri::command]
pub fn set_active_provider(provider_id: String, model_id: Option<String>) -> Result<(), String> {
    let service = ProviderService::new(get_db());
    service.set_active(&provider_id, model_id.as_deref())
}

#[tauri::command]
pub fn get_builtin_presets() -> Vec<ProviderConfig> {
    let service = ProviderService::new(get_db());
    service.get_builtin_presets()
}
