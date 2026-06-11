#[cfg(test)]
mod tests {
    use super::super::settings_service::SettingsService;
    use crate::database::connection::DbConnection;
    use crate::models::settings::AppSettings;

    fn create_test_db() -> DbConnection {
        DbConnection::in_memory().unwrap()
    }

    #[test]
    fn test_get_empty() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = service.get().unwrap();
        assert!(settings.is_none());
    }

    #[test]
    fn test_save_settings() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = AppSettings {
            default_provider: Some("anthropic".to_string()),
            ..Default::default()
        };
        assert!(service.save(settings).is_ok());
    }

    #[test]
    fn test_save_and_get() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = AppSettings {
            default_provider: Some("openai".to_string()),
            default_model: Some("gpt-4o".to_string()),
            ..Default::default()
        };
        service.save(settings.clone()).unwrap();
        let fetched = service.get().unwrap().unwrap();
        assert_eq!(fetched.default_provider, Some("openai".to_string()));
        assert_eq!(fetched.default_model, Some("gpt-4o".to_string()));
    }

    #[test]
    fn test_update_settings() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let mut settings = AppSettings {
            default_provider: Some("anthropic".to_string()),
            ..Default::default()
        };
        service.save(settings.clone()).unwrap();
        settings.default_provider = Some("google".to_string());
        service.save(settings).unwrap();
        let fetched = service.get().unwrap().unwrap();
        assert_eq!(fetched.default_provider, Some("google".to_string()));
    }

    #[test]
    fn test_save_thinking_level() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = AppSettings {
            default_thinking_level: Some("high".to_string()),
            ..Default::default()
        };
        service.save(settings).unwrap();
        let fetched = service.get().unwrap().unwrap();
        assert_eq!(fetched.default_thinking_level, Some("high".to_string()));
    }

    #[test]
    fn test_save_hide_thinking() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = AppSettings {
            hide_thinking_block: Some(true),
            ..Default::default()
        };
        service.save(settings).unwrap();
        let fetched = service.get().unwrap().unwrap();
        assert_eq!(fetched.hide_thinking_block, Some(true));
    }

    #[test]
    fn test_save_with_budgets() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let mut budgets = std::collections::HashMap::new();
        budgets.insert("low".to_string(), 4096);
        let settings = AppSettings {
            thinking_budgets: Some(budgets),
            ..Default::default()
        };
        assert!(service.save(settings).is_ok());
    }

    #[test]
    fn test_save_with_roles() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let mut roles_map = std::collections::HashMap::new();
        roles_map.insert("default".to_string(), "anthropic/claude-sonnet-4-20250514".to_string());
        let roles = crate::models::settings::ModelRoles(roles_map);
        let settings = AppSettings {
            model_roles: Some(roles),
            ..Default::default()
        };
        assert!(service.save(settings).is_ok());
    }

    #[test]
    fn test_save_with_retry() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let mut chains = std::collections::HashMap::new();
        chains.insert("default".to_string(), vec![
            crate::models::settings::FallbackItem {
                provider: "anthropic".to_string(),
                model: "claude-sonnet-4-20250514".to_string(),
            }
        ]);
        let retry = crate::models::settings::RetryConfig {
            fallback_chains: chains,
        };
        let settings = AppSettings {
            retry: Some(retry),
            ..Default::default()
        };
        assert!(service.save(settings).is_ok());
    }

    #[test]
    fn test_save_null_fields() {
        let db = create_test_db();
        let service = SettingsService::new(&db);
        let settings = AppSettings::default();
        assert!(service.save(settings).is_ok());
    }
}
