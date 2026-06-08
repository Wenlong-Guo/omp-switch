use omp_switch_lib::commands::sync;
use omp_switch_lib::models::sync::SyncConfig;

#[test]
fn test_command_get_sync_config_empty() {
    let result = sync::get_sync_config();
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());
}

#[test]
fn test_command_save_and_get_sync_config() {
    let config = SyncConfig {
        enabled: true,
        server_url: "https://dav.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: None,
        last_sync_status: None,
        last_error: None,
    };
    let save_result = sync::save_sync_config(config);
    assert!(save_result.is_ok());
    
    let get_result = sync::get_sync_config();
    assert!(get_result.is_ok());
    let fetched = get_result.unwrap();
    assert!(fetched.is_some());
    assert_eq!(fetched.unwrap().server_url, "https://dav.example.com");
}

#[test]
fn test_command_save_sync_config_disabled() {
    let config = SyncConfig {
        enabled: false,
        server_url: "https://dav.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: None,
        last_sync_status: None,
        last_error: None,
    };
    let result = sync::save_sync_config(config);
    assert!(result.is_ok());
}

#[test]
fn test_command_save_sync_config_empty_url() {
    let config = SyncConfig {
        enabled: true,
        server_url: "".to_string(),
        username: "".to_string(),
        password: "".to_string(),
        remote_path: "/".to_string(),
        last_sync_at: None,
        last_sync_status: None,
        last_error: None,
    };
    let result = sync::save_sync_config(config);
    assert!(result.is_ok());
}

#[test]
fn test_command_update_sync_config() {
    let config = SyncConfig {
        enabled: true,
        server_url: "https://dav1.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: None,
        last_sync_status: None,
        last_error: None,
    };
    sync::save_sync_config(config).unwrap();
    
    let updated = SyncConfig {
        enabled: true,
        server_url: "https://dav2.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: None,
        last_sync_status: None,
        last_error: None,
    };
    sync::save_sync_config(updated).unwrap();
    
    let fetched = sync::get_sync_config().unwrap().unwrap();
    assert_eq!(fetched.server_url, "https://dav2.example.com");
}

#[test]
fn test_command_save_sync_with_last_sync() {
    let config = SyncConfig {
        enabled: true,
        server_url: "https://dav.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: Some("2025-01-01T00:00:00Z".to_string()),
        last_sync_status: Some("success".to_string()),
        last_error: None,
    };
    let result = sync::save_sync_config(config);
    assert!(result.is_ok());
}

#[test]
fn test_command_save_sync_with_error() {
    let config = SyncConfig {
        enabled: true,
        server_url: "https://dav.example.com".to_string(),
        username: "user".to_string(),
        password: "pass".to_string(),
        remote_path: "/omp-switch.db".to_string(),
        last_sync_at: None,
        last_sync_status: Some("error".to_string()),
        last_error: Some("timeout".to_string()),
    };
    let result = sync::save_sync_config(config);
    assert!(result.is_ok());
}
