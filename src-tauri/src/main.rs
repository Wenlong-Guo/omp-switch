#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
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
            commands::provider::get_providers,
            commands::provider::save_provider,
            commands::provider::delete_provider,
            commands::provider::set_active_provider,
            commands::provider::get_builtin_presets,
            // Settings commands
            commands::settings::get_settings,
            commands::settings::save_settings,
            // Sync commands
            commands::sync::get_sync_config,
            commands::sync::save_sync_config,
            commands::sync::test_sync_connection,
            commands::sync::trigger_sync,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
