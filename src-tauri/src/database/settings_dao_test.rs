#[cfg(test)]
mod tests {
    use super::super::connection::DbConnection;
    use super::super::settings_dao::SettingsDao;
    use crate::models::settings::AppSettings;

    fn create_test_db() -> DbConnection {
        DbConnection::in_memory().unwrap()
    }

    fn sample_settings() -> AppSettings {
        AppSettings {
            default_provider: Some("anthropic".to_string()),
            default_model: Some("claude-sonnet-4-20250514".to_string()),
            default_thinking_level: Some("medium".to_string()),
            hide_thinking_block: Some(false),
            thinking_budgets: None,
            model_roles: None,
            retry: None,
        }
    }

    #[test]
    fn test_get_empty_returns_none() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = dao.get().unwrap();
        assert!(settings.is_none());
    }

    #[test]
    fn test_create_settings() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = sample_settings();
        assert!(dao.update(&settings).is_ok());
        let fetched = dao.get().unwrap().unwrap();
        assert_eq!(fetched.default_provider, Some("anthropic".to_string()));
    }

    #[test]
    fn test_update_settings() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let mut settings = sample_settings();
        dao.update(&settings).unwrap();
        settings.default_provider = Some("openai".to_string());
        assert!(dao.update(&settings).is_ok());
        let fetched = dao.get().unwrap().unwrap();
        assert_eq!(fetched.default_provider, Some("openai".to_string()));
    }

    #[test]
    fn test_update_preserves_id_constraint() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = sample_settings();
        dao.update(&settings).unwrap();
        // Should update, not create new row (id=1 constraint)
        assert!(dao.update(&settings).is_ok());
    }

    #[test]
    fn test_settings_default_model() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = sample_settings();
        dao.update(&settings).unwrap();
        let fetched = dao.get().unwrap().unwrap();
        assert_eq!(fetched.default_model, Some("claude-sonnet-4-20250514".to_string()));
    }

    #[test]
    fn test_settings_thinking_level() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = sample_settings();
        dao.update(&settings).unwrap();
        let fetched = dao.get().unwrap().unwrap();
        assert_eq!(fetched.default_thinking_level, Some("medium".to_string()));
    }

    #[test]
    fn test_settings_hide_thinking_block() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = sample_settings();
        dao.update(&settings).unwrap();
        let fetched = dao.get().unwrap().unwrap();
        assert_eq!(fetched.hide_thinking_block, Some(false));
    }

    #[test]
    fn test_settings_nullable_fields() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let settings = AppSettings::default();
        assert!(dao.update(&settings).is_ok());
        let fetched = dao.get().unwrap().unwrap();
        assert!(fetched.default_provider.is_none());
    }

    #[test]
    fn test_settings_with_model_roles() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let mut settings = sample_settings();
        settings.model_roles = Some(crate::models::settings::ModelRoles {
            default: crate::models::settings::RoleConfig {
                provider: "anthropic".to_string(),
                model: "claude-sonnet-4-20250514".to_string(),
            },
            smol: None,
            slow: None,
            plan: None,
            commit: None,
            paths: None,
        });
        assert!(dao.update(&settings).is_ok());
    }

    #[test]
    fn test_settings_with_thinking_budgets() {
        let db = create_test_db();
        let dao = SettingsDao::new(&db);
        let mut settings = sample_settings();
        let mut budgets = std::collections::HashMap::new();
        budgets.insert("low".to_string(), 4096);
        budgets.insert("medium".to_string(), 8192);
        settings.thinking_budgets = Some(budgets);
        assert!(dao.update(&settings).is_ok());
    }
}
