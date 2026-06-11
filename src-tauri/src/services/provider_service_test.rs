#[cfg(test)]
mod tests {
    use super::super::provider_service::ProviderService;
    use crate::database::connection::DbConnection;
    use crate::models::provider::ProviderConfig;

    fn create_test_db() -> DbConnection {
        DbConnection::in_memory().unwrap()
    }

    fn with_empty_omp_agent_dir<T>(test: impl FnOnce() -> T) -> T {
        let temp = tempfile::tempdir().unwrap();
        let previous = std::env::var("PI_CODING_AGENT_DIR").ok();
        std::env::set_var("PI_CODING_AGENT_DIR", temp.path());

        let result = test();

        if let Some(previous) = previous {
            std::env::set_var("PI_CODING_AGENT_DIR", previous);
        } else {
            std::env::remove_var("PI_CODING_AGENT_DIR");
        }

        result
    }

    fn sample_provider(id: &str) -> ProviderConfig {
        ProviderConfig {
            id: id.to_string(),
            name: "Test Provider".to_string(),
            enabled: true,
            is_built_in: false,
            base_url: Some("https://api.test.com".to_string()),
            api_key: Some("test-key".to_string()),
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
    fn test_save_valid_provider() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let provider = sample_provider("test-1");
        assert!(service.save(provider).is_ok());
    }

    #[test]
    fn test_save_invalid_api_type() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.api_type = Some("invalid-api".to_string());
        assert!(service.save(provider).is_err());
    }

    #[test]
    fn test_save_empty_id() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.id = "".to_string();
        assert!(service.save(provider).is_err());
    }

    #[test]
    fn test_save_empty_name() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.name = "".to_string();
        assert!(service.save(provider).is_err());
    }

    #[test]
    fn test_save_invalid_base_url() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.base_url = Some("not-a-url".to_string());
        assert!(service.save(provider).is_err());
    }

    #[test]
    fn test_save_updates_existing() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let provider = sample_provider("test-1");
        service.save(provider.clone()).unwrap();
        let mut updated = provider.clone();
        updated.name = "Updated".to_string();
        service.save(updated).unwrap();
        let fetched = service.get_by_id("test-1").unwrap().unwrap();
        assert_eq!(fetched.name, "Updated");
    }

    #[test]
    fn test_delete_provider() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let provider = sample_provider("test-1");
        service.save(provider).unwrap();
        assert!(service.delete("test-1").is_ok());
        assert!(service.get_by_id("test-1").unwrap().is_none());
    }

    #[test]
    fn test_delete_nonexistent() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        assert!(service.delete("nonexistent").is_ok());
    }

    #[test]
    fn test_get_all_empty() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let all = service.get_all().unwrap();
        assert!(all.is_empty());
    }

    #[test]
    fn test_get_all_multiple() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        service.save(sample_provider("a")).unwrap();
        service.save(sample_provider("b")).unwrap();
        let all = service.get_all().unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_set_active_provider() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let provider = sample_provider("test-1");
        service.save(provider).unwrap();
        assert!(service.set_active("test-1", None).is_ok());
    }

    #[test]
    fn test_set_active_nonexistent() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        assert!(service.set_active("nonexistent", None).is_err());
    }

    #[test]
    fn test_builtin_presets_not_empty() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(!presets.is_empty());
        });
    }

    #[test]
    fn test_builtin_presets_do_not_guess_github_copilot() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(!presets.iter().any(|p| p.id == "github-copilot"));
        });
    }

    #[test]
    fn test_builtin_presets_do_not_contain_step_plan() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(!presets.iter().any(|p| p.id == "step-plan"));
        });
    }

    #[test]
    fn test_builtin_presets_contain_lm_studio() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(presets.iter().any(|p| p.id == "lm-studio"));
        });
    }

    #[test]
    fn test_builtin_presets_contain_ollama() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(presets.iter().any(|p| p.id == "ollama"));
        });
    }

    #[test]
    fn test_builtin_ollama_discovery() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            let ollama = presets.iter().find(|p| p.id == "ollama").unwrap();
            assert!(ollama.discovery.is_some());
        });
    }

    #[test]
    fn test_builtin_presets_are_built_in() {
        with_empty_omp_agent_dir(|| {
            let db = create_test_db();
            let service = ProviderService::new(&db);
            let presets = service.get_builtin_presets();
            assert!(presets.iter().all(|p| p.is_built_in));
        });
    }

    #[test]
    fn test_save_with_api_key() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.api_key = Some("sk-test123".to_string());
        assert!(service.save(provider).is_ok());
    }

    #[test]
    fn test_save_without_api_type() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.api_type = None;
        assert!(service.save(provider).is_ok());
    }

    #[test]
    fn test_get_by_id_found() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let provider = sample_provider("test-1");
        service.save(provider).unwrap();
        let fetched = service.get_by_id("test-1").unwrap();
        assert!(fetched.is_some());
    }

    #[test]
    fn test_get_by_id_not_found() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let fetched = service.get_by_id("nonexistent").unwrap();
        assert!(fetched.is_none());
    }

    #[test]
    fn test_provider_enabled_field() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        provider.enabled = false;
        service.save(provider).unwrap();
        let fetched = service.get_by_id("test-1").unwrap().unwrap();
        assert!(!fetched.enabled);
    }

    #[test]
    fn test_provider_headers_field() {
        let db = create_test_db();
        let service = ProviderService::new(&db);
        let mut provider = sample_provider("test-1");
        let mut headers = std::collections::HashMap::new();
        headers.insert("X-Custom".to_string(), "value".to_string());
        provider.headers = Some(headers);
        assert!(service.save(provider).is_ok());
    }
}
