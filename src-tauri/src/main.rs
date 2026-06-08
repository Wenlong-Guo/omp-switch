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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
fn main() {}
