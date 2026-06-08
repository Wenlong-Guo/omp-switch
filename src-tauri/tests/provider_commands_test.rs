use omp_switch_lib::commands::provider;
use omp_switch_lib::database::connection::DbConnection;

fn setup_db() -> &'static DbConnection {
    // Commands use global OnceLock, so we use in-memory for testing
    // This is an integration test that exercises the full command layer
    Box::leak(Box::new(DbConnection::in_memory().unwrap()))
}

#[test]
fn test_command_get_providers_empty() {
    let result = provider::get_providers();
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}

#[test]
fn test_command_save_and_get_provider() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    let save_result = provider::save_provider(config.clone());
    assert!(save_result.is_ok());
    
    let get_result = provider::get_providers();
    assert!(get_result.is_ok());
    let providers = get_result.unwrap();
    assert_eq!(providers.len(), 1);
    assert_eq!(providers[0].id, "test-1");
}

#[test]
fn test_command_delete_provider() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    provider::save_provider(config).unwrap();
    
    let delete_result = provider::delete_provider("test-1".to_string());
    assert!(delete_result.is_ok());
    
    let providers = provider::get_providers().unwrap();
    assert!(providers.is_empty());
}

#[test]
fn test_command_delete_nonexistent() {
    let result = provider::delete_provider("nonexistent".to_string());
    assert!(result.is_ok());
}

#[test]
fn test_command_set_active_provider() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    provider::save_provider(config).unwrap();
    
    let result = provider::set_active_provider("test-1".to_string(), None);
    assert!(result.is_ok());
}

#[test]
fn test_command_set_active_nonexistent() {
    let result = provider::set_active_provider("nonexistent".to_string(), None);
    assert!(result.is_err());
}

#[test]
fn test_command_builtin_presets() {
    let presets = provider::get_builtin_presets();
    assert!(!presets.is_empty());
    assert!(presets.iter().any(|p| p.id == "openai"));
}

#[test]
fn test_command_save_invalid_api_type() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    let result = provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_save_empty_id() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    let result = provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_save_empty_name() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    let result = provider::save_provider(config);
    assert!(result.is_err());
}

#[test]
fn test_command_update_provider() {
    let config = provider::ProviderConfig {
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
        model_overrides: None,
        models: None,
    };
    provider::save_provider(config.clone()).unwrap();
    
    let mut updated = config.clone();
    updated.name = "Updated".to_string();
    provider::save_provider(updated).unwrap();
    
    let providers = provider::get_providers().unwrap();
    assert_eq!(providers[0].name, "Updated");
}

#[test]
fn test_command_get_providers_returns_all() {
    for i in 0..5 {
        let config = provider::ProviderConfig {
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
            model_overrides: None,
            models: None,
        };
        provider::save_provider(config).unwrap();
    }
    
    let providers = provider::get_providers().unwrap();
    assert_eq!(providers.len(), 5);
}
