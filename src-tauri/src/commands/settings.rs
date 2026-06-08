use crate::commands::provider::get_db;
use crate::models::settings::AppSettings;
use crate::services::settings_service::SettingsService;

#[tauri::command]
pub fn get_settings() -> Result<Option<AppSettings>, String> {
    let service = SettingsService::new(get_db());
    service.get()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let service = SettingsService::new(get_db());
    service.save(settings)
}
