#[cfg(test)]
mod tests {
    use super::super::config_writer::ConfigWriter;
    use super::super::provider_service::ProviderService;
    use crate::database::connection::DbConnection;
    use crate::models::provider::{ModelCompat, ProviderConfig};
    use std::collections::HashMap;

    fn create_test_db() -> DbConnection {
        let temp = tempfile::tempdir().unwrap().into_path();
        std::env::set_var("PI_CODING_AGENT_DIR", temp);
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
    fn test_write_models_yaml_omits_empty_compat_fields() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("step-plan");
        provider.models = Some(vec![crate::models::provider::ModelDefinition {
            id: "Step-3.7-flash".to_string(),
            name: "Step-3.7-flash".to_string(),
            api_type: Some("openai-completions".to_string()),
            reasoning: true,
            input_types: vec!["text".to_string(), "image".to_string()],
            cost: crate::models::provider::ModelCost {
                input: 0.0,
                output: 0.0,
                cache_read: 0.0,
                cache_write: 0.0,
            },
            context_window: 128000,
            max_tokens: 16384,
            headers: None,
            compat: Some(ModelCompat {
                supports_store: None,
                supports_developer_role: None,
                supports_reasoning_effort: None,
                max_tokens_field: None,
                open_router_routing: None,
                vercel_gateway_routing: None,
                extra_body: None,
            }),
            default_temperature: None,
            default_top_p: None,
            default_presence_penalty: None,
            default_frequency_penalty: None,
            default_seed: None,
            thinking_level_map: None,
        }]);
        service.save(provider).unwrap();

        let content = std::fs::read_to_string(crate::utils::fs::get_models_yaml_path()).unwrap();
        assert!(content.contains("step-plan"));
        assert!(!content.contains("compat:"));
        assert!(!content.contains("null"));
    }

    #[test]
    fn test_write_models_yaml_uses_valid_lm_studio_discovery_type() {
        let provider = crate::services::model_metadata::default_builtin_providers()
            .into_iter()
            .find(|provider| provider.id == "lm-studio")
            .unwrap();

        assert_eq!(
            provider.discovery.unwrap().discovery_type,
            "lm-studio".to_string()
        );
    }

    #[test]
    fn test_write_models_yaml_normalizes_legacy_lmstudio_discovery_type() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("lm-studio");
        provider.discovery = Some(crate::models::provider::DiscoveryConfig {
            discovery_type: "lmstudio".to_string(),
        });
        service.save(provider).unwrap();

        let content = std::fs::read_to_string(crate::utils::fs::get_models_yaml_path()).unwrap();
        assert!(content.contains("type: lm-studio"));
        assert!(!content.contains("type: lmstudio"));
    }

    #[test]
    fn test_write_settings_json_with_full_config() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        let mut thinking_budgets = HashMap::new();
        thinking_budgets.insert("high".to_string(), 16384);
        let mut fallback_chains = HashMap::new();
        fallback_chains.insert(
            "schema-test/model-a".to_string(),
            vec![crate::models::settings::FallbackItem {
                provider: "schema-test".to_string(),
                model: "model-b".to_string(),
            }],
        );
        let settings = crate::models::settings::AppSettings {
            default_provider: Some("anthropic".to_string()),
            default_model: Some("claude-sonnet-4-20250514".to_string()),
            default_thinking_level: Some("medium".to_string()),
            hide_thinking_block: Some(false),
            thinking_budgets: Some(thinking_budgets),
            model_roles: None,
            retry: Some(crate::models::settings::RetryConfig { fallback_chains }),
        };
        settings_service.save(settings).unwrap();
        let writer = ConfigWriter::new(&db);
        assert!(writer.write_settings_json().is_ok());

        let config_content =
            std::fs::read_to_string(crate::utils::fs::get_config_yml_path()).unwrap();
        let parsed: serde_yaml::Value = serde_yaml::from_str(&config_content).unwrap();
        assert_eq!(parsed["defaultThinkingLevel"].as_str(), Some("medium"));
        assert_eq!(parsed["hideThinkingBlock"].as_bool(), Some(false));
        assert_eq!(parsed["thinkingBudgets"]["high"].as_i64(), Some(16384));
        assert_eq!(
            parsed["retry"]["fallbackChains"]["schema-test/model-a"][0]["model"].as_str(),
            Some("model-b")
        );
    }

    #[test]
    fn test_write_settings_json_can_clear_default_provider_and_model() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        settings_service
            .save(crate::models::settings::AppSettings {
                default_provider: Some("step-plan".to_string()),
                default_model: Some("Step-3.7-flash".to_string()),
                ..Default::default()
            })
            .unwrap();
        settings_service
            .save(crate::models::settings::AppSettings::default())
            .unwrap();

        let content = std::fs::read_to_string(crate::utils::fs::get_settings_json_path()).unwrap();
        assert!(content.contains("null") || !content.contains("defaultProvider"));
        let settings = settings_service.get().unwrap().unwrap();
        assert!(settings.default_provider.is_none());
        assert!(settings.default_model.is_none());
    }

    #[test]
    fn test_write_settings_json_with_model_roles_strings() {
        let db = create_test_db();
        let settings_service = super::super::settings_service::SettingsService::new(&db);
        let mut roles = std::collections::HashMap::new();
        roles.insert(
            "default".to_string(),
            "step-plan/Step-3.7-flash".to_string(),
        );
        roles.insert(
            "plan".to_string(),
            "step-plan/Step-3.7-flash:high".to_string(),
        );
        settings_service
            .save(crate::models::settings::AppSettings {
                model_roles: Some(crate::models::settings::ModelRoles(roles)),
                ..Default::default()
            })
            .unwrap();

        let content = std::fs::read_to_string(crate::utils::fs::get_settings_json_path()).unwrap();
        assert!(content.contains("modelRoles"));
        assert!(content.contains("step-plan/Step-3.7-flash"));
        assert!(content.contains("step-plan/Step-3.7-flash:high"));

        let config_content =
            std::fs::read_to_string(crate::utils::fs::get_config_yml_path()).unwrap();
        assert!(config_content.contains("modelRoles"));
        assert!(config_content.contains("step-plan/Step-3.7-flash"));
        assert!(config_content.contains("step-plan/Step-3.7-flash:high"));
    }

    #[test]
    fn test_set_active_writes_default_model_role_to_config_yml() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("step-plan")).unwrap();

        service.set_active("step-plan", Some("model-1")).unwrap();

        let config_content =
            std::fs::read_to_string(crate::utils::fs::get_config_yml_path()).unwrap();
        let parsed: serde_yaml::Value = serde_yaml::from_str(&config_content).unwrap();
        assert_eq!(
            parsed["modelRoles"]["default"].as_str(),
            Some("step-plan/model-1")
        );
    }

    #[test]
    fn test_write_models_yaml_with_models() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("step-plan");
        provider.api_type = Some("openai-completions".to_string());
        provider.base_url = Some("https://api.stepfun.com/step_plan/v1".to_string());
        provider.auth = Some("apiKey".to_string());
        provider.models = Some(vec![crate::models::provider::ModelDefinition {
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
            thinking_level_map: None,
        }]);
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
        let model: crate::models::provider::ModelDefinition =
            serde_json::from_str(model_json).unwrap();
        assert_eq!(model.input_types, vec!["text", "image"]);
    }

    #[test]
    fn test_config_yml_contains_enabled_models() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("my-provider");
        provider.base_url = Some("https://api.example.com/v1".to_string());
        provider.models = Some(vec![
            crate::models::provider::ModelDefinition {
                id: "model-a".to_string(),
                name: "Model A".to_string(),
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
                thinking_level_map: None,
            },
            crate::models::provider::ModelDefinition {
                id: "model-b".to_string(),
                name: "Model B".to_string(),
                api_type: Some("openai-completions".to_string()),
                reasoning: true,
                input_types: vec!["text".to_string(), "image".to_string()],
                cost: crate::models::provider::ModelCost {
                    input: 0.0,
                    output: 0.0,
                    cache_read: 0.0,
                    cache_write: 0.0,
                },
                context_window: 200000,
                max_tokens: 8192,
                headers: None,
                compat: None,
                default_temperature: None,
                default_top_p: None,
                default_presence_penalty: None,
                default_frequency_penalty: None,
                default_seed: None,
                thinking_level_map: None,
            },
        ]);
        service.save(provider).unwrap();

        // set_active triggers write_settings_json -> write_config_yml
        service.set_active("my-provider", Some("model-a")).unwrap();

        let config_content =
            std::fs::read_to_string(crate::utils::fs::get_config_yml_path()).unwrap();
        let parsed: serde_yaml::Value = serde_yaml::from_str(&config_content).unwrap();
        let enabled = parsed["enabledModels"]
            .as_sequence()
            .expect("enabledModels should be a sequence");
        let items: Vec<&str> = enabled.iter().filter_map(|v| v.as_str()).collect();
        assert!(
            items.contains(&"my-provider/model-a"),
            "should contain my-provider/model-a, got {:?}",
            items
        );
        assert!(
            items.contains(&"my-provider/model-b"),
            "should contain my-provider/model-b, got {:?}",
            items
        );
    }

    #[test]
    fn test_config_yml_preserves_unmanaged_enabled_models_and_removes_disabled_managed_models() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let config_path = crate::utils::fs::get_config_yml_path();
        crate::utils::fs::ensure_dir(&config_path.parent().unwrap().to_path_buf()).unwrap();
        std::fs::write(
            &config_path,
            "enabledModels:\n- external/provider-model\n- managed/model-old\n",
        )
        .unwrap();

        let mut provider = sample_provider("managed");
        provider.models = Some(vec![crate::models::provider::ModelDefinition {
            id: "model-new".to_string(),
            name: "Model New".to_string(),
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
            thinking_level_map: None,
        }]);
        service.save(provider).unwrap();

        let parsed: serde_yaml::Value =
            serde_yaml::from_str(&std::fs::read_to_string(&config_path).unwrap()).unwrap();
        let items: Vec<&str> = parsed["enabledModels"]
            .as_sequence()
            .unwrap()
            .iter()
            .filter_map(|v| v.as_str())
            .collect();
        assert!(items.contains(&"external/provider-model"));
        assert!(items.contains(&"managed/model-new"));
        assert!(!items.contains(&"managed/model-old"));

        let mut disabled = sample_provider("managed");
        disabled.enabled = false;
        service.save(disabled).unwrap();
        let parsed: serde_yaml::Value =
            serde_yaml::from_str(&std::fs::read_to_string(&config_path).unwrap()).unwrap();
        let items: Vec<&str> = parsed["enabledModels"]
            .as_sequence()
            .unwrap()
            .iter()
            .filter_map(|v| v.as_str())
            .collect();
        assert!(items.contains(&"external/provider-model"));
        assert!(!items.iter().any(|item| item.starts_with("managed/")));
    }

    #[test]
    fn test_write_models_yaml_skips_builtin_without_base_url_or_discovery() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("github-copilot");
        provider.name = "GitHub Copilot".to_string();
        provider.is_built_in = true;
        provider.base_url = None;
        provider.discovery = None;
        provider.models = Some(vec![crate::models::provider::ModelDefinition {
            id: "gpt-5.5".to_string(),
            name: "gpt-5.5".to_string(),
            api_type: Some("openai-completions".to_string()),
            reasoning: true,
            input_types: vec!["text".to_string()],
            cost: crate::models::provider::ModelCost {
                input: 0.0,
                output: 0.0,
                cache_read: 0.0,
                cache_write: 0.0,
            },
            context_window: 400000,
            max_tokens: 128000,
            headers: None,
            compat: None,
            default_temperature: None,
            default_top_p: None,
            default_presence_penalty: None,
            default_frequency_penalty: None,
            default_seed: None,
            thinking_level_map: None,
        }]);
        service.save(provider).unwrap();
        let content = std::fs::read_to_string(crate::utils::fs::get_models_yaml_path()).unwrap();
        assert!(!content.contains("github-copilot"));
    }

    #[test]
    fn test_write_models_yaml_writes_omp_supported_model_fields() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("schema-test");
        let mut thinking = HashMap::new();
        thinking.insert("off".to_string(), None);
        thinking.insert("high".to_string(), Some("high".to_string()));
        provider.models = Some(vec![crate::models::provider::ModelDefinition {
            id: "model-a".to_string(),
            name: "Model A".to_string(),
            api_type: Some("openai-completions".to_string()),
            reasoning: true,
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
            compat: Some(ModelCompat {
                supports_store: None,
                supports_developer_role: None,
                supports_reasoning_effort: Some(true),
                max_tokens_field: None,
                open_router_routing: None,
                vercel_gateway_routing: None,
                extra_body: None,
            }),
            default_temperature: Some(0.2),
            default_top_p: Some(0.9),
            default_presence_penalty: Some(0.1),
            default_frequency_penalty: Some(0.2),
            default_seed: Some(1),
            thinking_level_map: Some(thinking),
        }]);
        service.save(provider).unwrap();
        let content = std::fs::read_to_string(crate::utils::fs::get_models_yaml_path()).unwrap();
        assert!(content.contains("defaultTemperature: 0.2"));
        assert!(content.contains("defaultTopP: 0.9"));
        assert!(content.contains("defaultSeed: 1"));
        assert!(content.contains("thinkingLevelMap:"));
        assert!(content.contains("supportsReasoningEffort: true"));
        assert!(!content.contains("fallback:"));
    }
}
