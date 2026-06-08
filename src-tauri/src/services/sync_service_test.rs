#[cfg(test)]
mod tests {
    use super::super::sync_service::SyncService;
    use crate::database::connection::DbConnection;
    use crate::models::sync::SyncConfig;

    fn create_test_db() -> DbConnection {
        DbConnection::in_memory().unwrap()
    }

    fn sample_config() -> SyncConfig {
        SyncConfig {
            enabled: true,
            server_url: "https://dav.example.com".to_string(),
            username: "user".to_string(),
            password: "pass".to_string(),
            remote_path: "/omp-switch.db".to_string(),
            last_sync_at: None,
            last_sync_status: None,
            last_error: None,
        }
    }

    #[test]
    fn test_get_config_empty() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = service.get_config().unwrap();
        assert!(config.is_none());
    }

    #[test]
    fn test_save_config() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = sample_config();
        assert!(service.save_config(&config).is_ok());
    }

    #[test]
    fn test_save_and_get() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = sample_config();
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.server_url, "https://dav.example.com");
    }

    #[test]
    fn test_update_config() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let mut config = sample_config();
        service.save_config(&config).unwrap();
        config.server_url = "https://dav2.example.com".to_string();
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.server_url, "https://dav2.example.com");
    }

    #[test]
    fn test_config_username_preserved() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = sample_config();
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.username, "user");
    }

    #[test]
    fn test_config_password_preserved() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = sample_config();
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.password, "pass");
    }

    #[test]
    fn test_config_remote_path_preserved() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let config = sample_config();
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.remote_path, "/omp-switch.db");
    }

    #[test]
    fn test_config_disabled() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let mut config = sample_config();
        config.enabled = false;
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert!(!fetched.enabled);
    }

    #[test]
    fn test_config_with_last_sync() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let mut config = sample_config();
        config.last_sync_at = Some("2025-01-01T00:00:00Z".to_string());
        config.last_sync_status = Some("success".to_string());
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.last_sync_at, Some("2025-01-01T00:00:00Z".to_string()));
        assert_eq!(fetched.last_sync_status, Some("success".to_string()));
    }

    #[test]
    fn test_config_with_error() {
        let db = create_test_db();
        let service = SyncService::new(&db);
        let mut config = sample_config();
        config.last_error = Some("connection timeout".to_string());
        service.save_config(&config).unwrap();
        let fetched = service.get_config().unwrap().unwrap();
        assert_eq!(fetched.last_error, Some("connection timeout".to_string()));
    }
}
