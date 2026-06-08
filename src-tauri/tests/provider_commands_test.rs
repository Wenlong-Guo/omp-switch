use std::sync::Mutex;

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
fn test_command_get_providers_empty() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let result = omp_switch_lib::commands::provider::get_providers();
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}

#[test]
fn test_command_save_and_get_provider() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    let save_result = omp_switch_lib::commands::provider::save_provider(config.clone());
    assert!(save_result.is_ok());
    
    let get_result = omp_switch_lib::commands::provider::get_providers();
    assert!(get_result.is_ok());
    let providers = get_result.unwrap();
    assert_eq!(providers.len(), 1);
    assert_eq!(providers[0].id, "test-1");
}

#[test]
fn test_command_delete_provider() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    omp_switch_lib::commands::provider::save_provider(config).unwrap();
    
    let delete_result = omp_switch_lib::commands::provider::delete_provider("test-1".to_string());
    assert!(delete_result.is_ok());
    
    let providers = omp_switch_lib::commands::provider::get_providers().unwrap();
    assert!(providers.is_empty());
}

#[test]
fn test_command_delete_nonexistent() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let result = omp_switch_lib::commands::provider::delete_provider("nonexistent".to_string());
    assert!(result.is_ok());
}

#[test]
fn test_command_set_active_provider() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    omp_switch_lib::commands::provider::save_provider(config).unwrap();
    
    let result = omp_switch_lib::commands::provider::set_active_provider("test-1".to_string(), None);
    assert!(result.is_ok());
}

#[test]
fn test_command_set_active_nonexistent() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let result = omp_switch_lib::commands::provider::set_active_provider("nonexistent".to_string(), None);
    assert!(result.is_err());
}

#[test]
fn test_command_builtin_presets() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let presets = omp_switch_lib::commands::provider::get_builtin_presets();
    assert!(!presets.is_empty());
    assert!(presets.iter().any(|p| p.id == "openai"));
}

#[test]
fn test_command_save_invalid_api_type() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("invalid-api".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    let result = omp_switch_lib::commands::provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_save_empty_id() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    let result = omp_switch_lib::commands::provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_save_empty_name() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    let result = omp_switch_lib::commands::provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_update_provider() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    let config = omp_switch_lib::models::provider::ProviderConfig {
        id: "test-1".to_string(),
        name: "Test".to_string(),
        enabled: true,
        is_built_in: false,
        base_url: None,
        api_key: None,
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: None,
        discovery: None,
            created_at: None,
            updated_at: None,
        model_overrides: None,
        models: None,
    };
    omp_switch_lib::commands::provider::save_provider(config.clone()).unwrap();
    
    let mut updated = config.clone();
    updated.name = "Updated".to_string();
    omp_switch_lib::commands::provider::save_provider(updated).unwrap();
    
    let providers = omp_switch_lib::commands::provider::get_providers().unwrap();
    assert_eq!(providers[0].name, "Updated");
}

#[test]
fn test_command_get_providers_returns_all() {
    let _lock = TEST_LOCK.lock().unwrap();
    clear_db();
    for i in 0..5 {
        let config = omp_switch_lib::models::provider::ProviderConfig {
            id: format!("test-{}", i),
            name: format!("Test {}", i),
            enabled: true,
            is_built_in: false,
            base_url: None,
            api_key: None,
            api_type: Some("openai-completions".to_string()),
            headers: None,
            auth_header: None,
            auth: None,
            discovery: None,
            created_at: None,
            updated_at: None,
            model_overrides: None,
            models: None,
        };
        omp_switch_lib::commands::provider::save_provider(config).unwrap();
    }
    
    let providers = omp_switch_lib::commands::provider::get_providers().unwrap();
    assert_eq!(providers.len(), 5);
}
