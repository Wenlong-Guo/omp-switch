#[cfg(test)]
mod tests {
    use super::super::connection::DbConnection;
    use super::super::sync_dao::SyncDao;
    use crate::models::sync::{ChangelogEntry, SyncConfig};

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
    fn test_get_empty_returns_none() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let config = dao.get_config().unwrap();
        assert!(config.is_none());
    }

    #[test]
    fn test_create_config() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let config = sample_config();
        assert!(dao.update_config(&config).is_ok());
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.server_url, "https://dav.example.com");
    }

    #[test]
    fn test_update_config() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let mut config = sample_config();
        dao.update_config(&config).unwrap();
        config.server_url = "https://dav2.example.com".to_string();
        assert!(dao.update_config(&config).is_ok());
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.server_url, "https://dav2.example.com");
    }

    #[test]
    fn test_config_password() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let config = sample_config();
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.password, "pass");
    }

    #[test]
    fn test_config_username() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let config = sample_config();
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.username, "user");
    }

    #[test]
    fn test_config_remote_path() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let config = sample_config();
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.remote_path, "/omp-switch.db");
    }

    #[test]
    fn test_config_disabled() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let mut config = sample_config();
        config.enabled = false;
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert!(!fetched.enabled);
    }

    #[test]
    fn test_config_last_sync_at() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let mut config = sample_config();
        config.last_sync_at = Some("2025-01-01T00:00:00Z".to_string());
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.last_sync_at, Some("2025-01-01T00:00:00Z".to_string()));
    }

    #[test]
    fn test_config_last_sync_status() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let mut config = sample_config();
        config.last_sync_status = Some("success".to_string());
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.last_sync_status, Some("success".to_string()));
    }

    #[test]
    fn test_config_last_error() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let mut config = sample_config();
        config.last_error = Some("timeout".to_string());
        dao.update_config(&config).unwrap();
        let fetched = dao.get_config().unwrap().unwrap();
        assert_eq!(fetched.last_error, Some("timeout".to_string()));
    }

    #[test]
    fn test_changelog_append() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let entry = ChangelogEntry {
            table_name: "providers".to_string(),
            record_id: "test-1".to_string(),
            action: "INSERT".to_string(),
            changed_at: "2025-01-01T00:00:00Z".to_string(),
            device_id: "device-1".to_string(),
        };
        assert!(dao.append_changelog(&entry).is_ok());
    }

    #[test]
    fn test_changelog_get_since() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let entry = ChangelogEntry {
            table_name: "providers".to_string(),
            record_id: "test-1".to_string(),
            action: "INSERT".to_string(),
            changed_at: "2025-01-01T00:00:00Z".to_string(),
            device_id: "device-1".to_string(),
        };
        dao.append_changelog(&entry).unwrap();
        let logs = dao.get_changelogs_since("2024-12-31T00:00:00Z").unwrap();
        assert_eq!(logs.len(), 1);
    }

    #[test]
    fn test_changelog_clear_old() {
        let db = create_test_db();
        let dao = SyncDao::new(&db);
        let entry = ChangelogEntry {
            table_name: "providers".to_string(),
            record_id: "test-1".to_string(),
            action: "INSERT".to_string(),
            changed_at: "2024-01-01T00:00:00Z".to_string(),
            device_id: "device-1".to_string(),
        };
        dao.append_changelog(&entry).unwrap();
        dao.clear_old_changelogs("2025-01-01T00:00:00Z").unwrap();
        let logs = dao.get_changelogs_since("2023-01-01T00:00:00Z").unwrap();
        assert!(logs.is_empty());
    }
}
