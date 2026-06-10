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
    fn test_write_models_yaml_filters_disabled_providers() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let enabled = sample_provider("enabled-provider");
        let mut disabled = sample_provider("disabled-provider");
        disabled.enabled = false;
        service.save(enabled).unwrap();
        service.save(disabled).unwrap();
        ConfigWriter::new(&db).write_models_yaml().unwrap();
        let content = std::fs::read_to_string(crate::utils::fs::get_models_yaml_path()).unwrap();
        assert!(content.contains("enabled-provider"));
        assert!(!content.contains("disabled-provider"));
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

    #[test]
    fn test_write_models_yaml_with_models() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("step-plan");
        provider.api_type = Some("openai-completions".to_string());
        provider.base_url = Some("https://api.stepfun.com/step_plan/v1".to_string());
        provider.auth = Some("apiKey".to_string());
        provider.models = Some(vec![
            crate::models::provider::ModelDefinition {
                id: "step-3.7-flash".to_string(),
                name: "Step 3.7 Flash".to_string(),
                api_type: Some("openai-completions".to_string()),
                reasoning: false,
                input_types: vec!["text".to_string()],
                cost: crate::models::provider::ModelCost {
                    input: 0.0,
                    output: 0.0,
                    cache_read: 0.0,
                    cache_write: 0.0,
                },
                context_window: 128000,
                max_tokens: 4096,
                headers: None,
                compat: None,
                default_temperature: None,
                default_top_p: None,
                default_presence_penalty: None,
                default_frequency_penalty: None,
                default_seed: None,
            },
        ]);
        service.save(provider).unwrap();

        // Verify DAO round-trip preserves api_type and models
        let dao = crate::database::provider_dao::ProviderDao::new(&db);
        let retrieved = dao.get_by_id("step-plan").unwrap().unwrap();
        assert_eq!(retrieved.api_type, Some("openai-completions".to_string()));
        assert!(retrieved.models.is_some());
        let models = retrieved.models.unwrap();
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "step-3.7-flash");
        assert_eq!(models[0].api_type, Some("openai-completions".to_string()));
        assert_eq!(models[0].input_types, vec!["text"]);

        // Verify YAML includes models
        let writer = ConfigWriter::new(&db);
        writer.write_models_yaml().unwrap();
        let yaml_path = crate::utils::fs::get_models_yaml_path();
        let content = std::fs::read_to_string(&yaml_path).unwrap();
        assert!(content.contains("step-plan"));
        assert!(content.contains("models"));
        assert!(content.contains("step-3.7-flash"));
        assert!(content.contains("Step 3.7 Flash"));
        assert!(content.contains("contextWindow"));
        assert!(content.contains("maxTokens"));
    }

    #[test]
    fn test_provider_alias_api_field() {
        let db = create_test_db();
        let dao = crate::database::provider_dao::ProviderDao::new(&db);

        // Simulate frontend payload using "api" instead of "apiType"
        let json = r#"{
            "id":"alias-test",
            "name":"Alias Test",
            "enabled":true,
            "isBuiltIn":false,
            "api":"openai-completions",
            "baseUrl":"https://api.test.com"
        }"#;
        let config: crate::models::provider::ProviderConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.api_type, Some("openai-completions".to_string()));
        dao.create(&config).unwrap();
        let retrieved = dao.get_by_id("alias-test").unwrap().unwrap();
        assert_eq!(retrieved.api_type, Some("openai-completions".to_string()));
    }

    #[test]
    fn test_model_alias_input_field() {
        let db = create_test_db();
        let dao = crate::database::provider_dao::ProviderDao::new(&db);

        // Simulate frontend payload using "input" instead of "inputTypes"
        let json = r#"{
            "id":"model-alias-test",
            "name":"Model Alias Test",
            "enabled":true,
            "isBuiltIn":false,
            "api":"openai-completions"
        }"#;
        let provider: crate::models::provider::ProviderConfig = serde_json::from_str(json).unwrap();
        dao.create(&provider).unwrap();

        let model_json = r#"{
            "id":"test-model",
            "name":"Test Model",
            "api":"openai-completions",
            "reasoning":false,
            "input":["text","image"],
            "cost":{"input":0.0,"output":0.0,"cacheRead":0.0,"cacheWrite":0.0},
            "contextWindow":128000,
            "maxTokens":4096
        }"#;
        let model: crate::models::provider::ModelDefinition = serde_json::from_str(model_json).unwrap();
        assert_eq!(model.input_types, vec!["text", "image"]);
    }
}
