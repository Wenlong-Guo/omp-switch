use std::sync::Mutex;
use omp_switch_lib::commands::settings;
use omp_switch_lib::models::settings::AppSettings;

static TEST_LOCK: Mutex<()> = Mutex::new(());

fn clear_db() {
    let db = omp_switch_lib::commands::provider::get_db();
    let conn = db.get_conn();
    let _ = conn.execute("DELETE FROM providers", []);
    let _ = conn.execute("DELETE FROM provider_models", []);
    let _ = conn.execute("DELETE FROM model_overrides", []);
    let _ = conn.execute("DELETE FROM app_settings", []);
    let _ = conn.execute("DELETE FROM sync_config", []);
    let _ = conn.execute("DELETE FROM sync_changelog", []);
}

#[test]
fn test_command_get_settings_empty() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let result = settings::get_settings();
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());
}

#[test]
fn test_command_save_and_get_settings() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let settings = AppSettings {
        default_provider: Some("anthropic".to_string()),
        default_model: Some("claude-sonnet-4-20250514".to_string()),
        default_thinking_level: None,
        hide_thinking_block: None,
        thinking_budgets: None,
        model_roles: None,
        retry: None,
    };
    let save_result = settings::save_settings(settings);
    assert!(save_result.is_ok());
    
    let get_result = settings::get_settings();
    assert!(get_result.is_ok());
    let fetched = get_result.unwrap();
    assert!(fetched.is_some());
    assert_eq!(fetched.unwrap().default_provider, Some("anthropic".to_string()));
}

#[test]
fn test_command_save_settings_with_thinking_level() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let settings = AppSettings {
        default_provider: None,
        default_model: None,
        default_thinking_level: Some("high".to_string()),
        hide_thinking_block: None,
        thinking_budgets: None,
        model_roles: None,
        retry: None,
    };
    let result = settings::save_settings(settings);
    assert!(result.is_ok());
}

#[test]
fn test_command_save_settings_with_hide_thinking() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let settings = AppSettings {
        default_provider: None,
        default_model: None,
        default_thinking_level: None,
        hide_thinking_block: Some(true),
        thinking_budgets: None,
        model_roles: None,
        retry: None,
    };
    let result = settings::save_settings(settings);
    assert!(result.is_ok());
}

#[test]
fn test_command_update_settings() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let settings = AppSettings {
        default_provider: Some("anthropic".to_string()),
        ..Default::default()
    };
    settings::save_settings(settings).unwrap();
    
    let updated = AppSettings {
        default_provider: Some("openai".to_string()),
        ..Default::default()
    };
    settings::save_settings(updated).unwrap();
    
    let fetched = settings::get_settings().unwrap().unwrap();
    assert_eq!(fetched.default_provider, Some("openai".to_string()));
}

#[test]
fn test_command_save_settings_with_budgets() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let mut budgets = std::collections::HashMap::new();
    budgets.insert("low".to_string(), 4096);
    let settings = AppSettings {
        thinking_budgets: Some(budgets),
        ..Default::default()
    };
    let result = settings::save_settings(settings);
    assert!(result.is_ok());
}

#[test]
fn test_command_save_settings_with_roles() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let mut roles_map = std::collections::HashMap::new();
    roles_map.insert("default".to_string(), "anthropic/claude-sonnet-4-20250514".to_string());
    let roles = omp_switch_lib::models::settings::ModelRoles(roles_map);
    let settings = AppSettings {
        model_roles: Some(roles),
        ..Default::default()
    };
    let result = settings::save_settings(settings);
    assert!(result.is_ok());
}

#[test]
fn test_command_save_empty_settings() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let settings = AppSettings::default();
    let result = settings::save_settings(settings);
    assert!(result.is_ok());
}
