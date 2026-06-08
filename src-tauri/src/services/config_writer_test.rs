#[cfg(test)]
mod tests {
    use super::super::config_writer::ConfigWriter;
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
    fn test_write_models_yaml_empty() {
        let db = create_test_db();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_models_yaml_with_provider() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("test-1")).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_settings_json_empty() {
        let db = create_test_db();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_settings_json().is_ok());
    }

    #[test]
    fn test_write_settings_json_with_settings() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        let settings = crate::models::settings::AppSettings {
            default_provider: Some("anthropic".to_string()),
            ..Default::default()
        };
        settings_service.save(settings).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_settings_json().is_ok());
    }

    #[test]
    fn test_write_models_yaml_multiple_providers() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("a")).unwrap();
        service.save(sample_provider("b")).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_models_yaml_with_headers() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        let mut headers = std::collections::HashMap::new();
        headers.insert("X-Custom".to_string(), "value".to_string());
        provider.headers = Some(headers);
        service.save(provider).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_models_yaml_with_api_key() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.api_key = Some("sk-test".to_string());
        service.save(provider).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_models_yaml_with_discovery() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.discovery = Some(crate::models::provider::DiscoveryConfig {
            discovery_type: "ollama".to_string(),
        });
        service.save(provider).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_models_yaml().is_ok());
    }

    #[test]
    fn test_write_settings_json_with_full_config() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        let settings = crate::models::settings::AppSettings {
            default_provider: Some("anthropic".to_string()),
            default_model: Some("claude-sonnet-4-20250514".to_string()),
            default_thinking_level: Some("medium".to_string()),
            hide_thinking_block: Some(false),
            thinking_budgets: None,
            model_roles: None,
            retry: None,
        };
        settings_service.save(settings).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_settings_json().is_ok());
    }
}
