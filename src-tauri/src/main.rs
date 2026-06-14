#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(test))]
fn main() {
    use tauri::Manager;
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // Initialize builtin presets on first startup
            use omp_switch_lib::commands::provider::get_db;
            use omp_switch_lib::services::config_writer::ConfigWriter;
            use omp_switch_lib::services::provider_service::ProviderService;

            let db = get_db();
            let service = ProviderService::new(db);
            let presets = service.get_builtin_presets();
            for preset in presets {
                if service.get_by_id(&preset.id).ok().flatten().is_none() {
                    let _ = service.save(preset);
                }
            }
            service.prune_deprecated_builtin_presets();
            let _ = ConfigWriter::new(db).write_models_yaml();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Chat commands
            omp_switch_lib::commands::chat::chat_completion,
            omp_switch_lib::commands::model_fetch::fetch_models_for_config,
            // Provider commands
            omp_switch_lib::commands::provider::get_providers,
            omp_switch_lib::commands::provider::save_provider,
            omp_switch_lib::commands::provider::delete_provider,
            omp_switch_lib::commands::provider::set_active_provider,
            omp_switch_lib::commands::provider::get_builtin_presets,
            // Settings commands
            omp_switch_lib::commands::settings::get_settings,
            omp_switch_lib::commands::settings::save_settings,
            // Sync commands
            omp_switch_lib::commands::sync::get_sync_config,
            omp_switch_lib::commands::sync::save_sync_config,
            omp_switch_lib::commands::sync::test_sync_connection,
            omp_switch_lib::commands::sync::trigger_sync,
            omp_switch_lib::commands::sync::auto_sync,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
fn main() {}
