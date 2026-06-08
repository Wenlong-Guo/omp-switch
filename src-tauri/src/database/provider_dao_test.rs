#[cfg(test)]
mod tests {
    use super::super::connection::DbConnection;
    use super::super::provider_dao::ProviderDao;
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
            api_key: Some("test-key".to_string()),
            api_type: Some("openai-completions".to_string()),
            headers: None,
            auth_header: Some(true),
            auth: Some("apiKey".to_string()),
            discovery: None,
            model_overrides: None,
            models: None,
            created_at: None,
            updated_at: None,
        }
    }

    // 1. create
    #[test]
    fn test_create_provider() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        assert!(dao.create(&provider).is_ok());
    }

    #[test]
    fn test_create_duplicate_id_fails() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        assert!(dao.create(&provider).is_err());
    }

    #[test]
    fn test_create_with_empty_id() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("");
        assert!(dao.create(&provider).is_ok());
    }

    #[test]
    fn test_create_disabled_provider() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut provider = sample_provider("test-1");
        provider.enabled = false;
        assert!(dao.create(&provider).is_ok());
        let fetched = dao.get_by_id("test-1").unwrap().unwrap();
        assert!(!fetched.enabled);
    }

    // 2. get_by_id
    #[test]
    fn test_get_by_id_exists() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        let fetched = dao.get_by_id("test-1").unwrap();
        assert!(fetched.is_some());
        assert_eq!(fetched.unwrap().name, "Test Provider");
    }

    #[test]
    fn test_get_by_id_not_found() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let fetched = dao.get_by_id("nonexistent").unwrap();
        assert!(fetched.is_none());
    }

    #[test]
    fn test_get_by_id_preserves_base_url() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        let fetched = dao.get_by_id("test-1").unwrap().unwrap();
        assert_eq!(fetched.base_url, Some("https://api.test.com".to_string()));
    }

    // 3. get_all
    #[test]
    fn test_get_all_empty() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let all = dao.get_all().unwrap();
        assert!(all.is_empty());
    }

    #[test]
    fn test_get_all_multiple() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        dao.create(&sample_provider("a")).unwrap();
        dao.create(&sample_provider("b")).unwrap();
        let all = dao.get_all().unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_get_all_sorted_by_name() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut p1 = sample_provider("z");
        p1.name = "Zebra".to_string();
        let mut p2 = sample_provider("a");
        p2.name = "Apple".to_string();
        dao.create(&p1).unwrap();
        dao.create(&p2).unwrap();
        let all = dao.get_all().unwrap();
        assert_eq!(all[0].name, "Apple");
        assert_eq!(all[1].name, "Zebra");
    }

    // 4. get_enabled
    #[test]
    fn test_get_enabled_filters_disabled() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut p1 = sample_provider("enabled");
        p1.enabled = true;
        let mut p2 = sample_provider("disabled");
        p2.enabled = false;
        dao.create(&p1).unwrap();
        dao.create(&p2).unwrap();
        let enabled = dao.get_enabled().unwrap();
        assert_eq!(enabled.len(), 1);
        assert_eq!(enabled[0].id, "enabled");
    }

    #[test]
    fn test_get_enabled_empty_when_all_disabled() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut p = sample_provider("disabled");
        p.enabled = false;
        dao.create(&p).unwrap();
        let enabled = dao.get_enabled().unwrap();
        assert!(enabled.is_empty());
    }

    // 5. update
    #[test]
    fn test_update_name() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        let mut updated = provider.clone();
        updated.name = "Updated".to_string();
        assert!(dao.update(&updated).is_ok());
        let fetched = dao.get_by_id("test-1").unwrap().unwrap();
        assert_eq!(fetched.name, "Updated");
    }

    #[test]
    fn test_update_not_found() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("nonexistent");
        assert!(dao.update(&provider).is_ok());
    }

    #[test]
    fn test_update_api_type() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        let mut updated = provider.clone();
        updated.api_type = Some("anthropic-messages".to_string());
        dao.update(&updated).unwrap();
        let fetched = dao.get_by_id("test-1").unwrap().unwrap();
        assert_eq!(fetched.api_type, Some("anthropic-messages".to_string()));
    }

    // 6. delete
    #[test]
    fn test_delete_removes_provider() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let provider = sample_provider("test-1");
        dao.create(&provider).unwrap();
        assert!(dao.delete("test-1").is_ok());
        let fetched = dao.get_by_id("test-1").unwrap();
        assert!(fetched.is_none());
    }

    #[test]
    fn test_delete_not_found_no_panic() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        assert!(dao.delete("nonexistent").is_ok());
    }

    // 7. with models
    #[test]
    fn test_create_with_models() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut provider = sample_provider("test-1");
        provider.models = Some(vec![
            crate::models::provider::ModelDefinition {
                id: "gpt-4o".to_string(),
                name: "GPT-4o".to_string(),
                api_type: Some("openai-completions".to_string()),
                reasoning: false,
                input_types: vec!["text".to_string()],
                cost: crate::models::provider::ModelCost {
                    input: 2.5,
                    output: 10.0,
                    cache_read: 1.25,
                    cache_write: 0.0,
                },
                context_window: 128000,
                max_tokens: 16384,
                headers: None,
                compat: None,
            }
        ]);
        assert!(dao.create(&provider).is_ok());
    }

    #[test]
    fn test_create_with_headers() {
        let db = create_test_db();
        let dao = ProviderDao::new(&db);
        let mut provider = sample_provider("test-1");
        let mut headers = std::collections::HashMap::new();
        headers.insert("X-Custom".to_string(), "value".to_string());
        provider.headers = Some(headers);
        assert!(dao.create(&provider).is_ok());
        let fetched = dao.get_by_id("test-1").unwrap().unwrap();
        assert!(fetched.headers.is_some());
    }
}
