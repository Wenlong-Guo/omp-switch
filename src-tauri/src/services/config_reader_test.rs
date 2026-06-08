#[cfg(test)]
mod tests {
    use super::super::config_reader::ConfigReader;
    use super::super::provider_service::ProviderService;
    use crate::database::connection::DbConnection;
    use crate::models::provider::ProviderConfig;

    fn create_test_db() -> DbConnection {
        DbConnection::in_memory().unwrap()
    }

    fn sample_provider(id: &str) -> ProviderConfig {
        ProviderConfig {
            id: id.to_string(),
            name: "Test Provider".to_string(),
            enabled: true,
            is_built_in: false,
            base_url: Some("https://api.test.com".to_string()),
            api_key: None,
            api_type: Some("openai-completions".to_string()),
            headers: None,
            auth_header: None,
            auth: None,
            discovery: None,
            model_overrides: None,
            models: None,
            created_at: None,
            updated_at: None,
        }
    }

    #[test]
    fn test_read_models_yaml_empty() {
        let db = create_test_db();
        let reader = ConfigReader::new(&db);
        let providers = reader.read_models_yaml().unwrap();
        assert!(providers.is_empty());
    }

    #[test]
    fn test_read_models_yaml_with_data() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("test-1")).unwrap();
        let reader = ConfigReader::new(&db);
        let providers = reader.read_models_yaml().unwrap();
        assert_eq!(providers.len(), 1);
    }

    #[test]
    fn test_read_settings_json_empty() {
        let db = create_test_db();
        let reader = ConfigReader::new(&db);
        let settings = reader.read_settings_json().unwrap();
        assert!(settings.is_none());
    }

    #[test]
    fn test_read_settings_json_with_data() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        let settings = crate::models::settings::AppSettings {
            default_provider: Some("anthropic".to_string()),
            ..Default::default()
        };
        settings_service.save(settings).unwrap();
        let reader = ConfigReader::new(&db);
        let fetched = reader.read_settings_json().unwrap();
        assert!(fetched.is_some());
    }

    #[test]
    fn test_read_models_yaml_multiple_providers() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("a")).unwrap();
        service.save(sample_provider("b")).unwrap();
        let reader = ConfigReader::new(&db);
        let providers = reader.read_models_yaml().unwrap();
        assert_eq!(providers.len(), 2);
    }
}
