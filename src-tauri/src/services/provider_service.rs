use crate::database::connection::DbConnection;
use crate::database::provider_dao::ProviderDao;
use crate::models::provider::ProviderConfig;
use crate::utils::validate::validate_provider;
use rusqlite::Result;

pub struct ProviderService<'a> {
    db: &'a DbConnection,
}

impl<'a> ProviderService<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn save(&self, config: ProviderConfig) -> Result<ProviderConfig, String> {
        validate_provider(&config).map_err(|e| e.to_string())?;

        let dao = ProviderDao::new(self.db);
        let exists = dao.get_by_id(&config.id).map_err(|e| e.to_string())?.is_some();

        if exists {
            dao.update(&config).map_err(|e| e.to_string())?;
        } else {
            dao.create(&config).map_err(|e| e.to_string())?;
        }

        // Write to models.yml
        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_models_yaml().map_err(|e| e.to_string())?;

        Ok(config)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let dao = ProviderDao::new(self.db);
        dao.delete(id).map_err(|e| e.to_string())?;

        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_models_yaml().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_all(&self) -> Result<Vec<ProviderConfig>, String> {
        let dao = ProviderDao::new(self.db);
        dao.get_all().map_err(|e| e.to_string())
    }

    pub fn get_by_id(&self, id: &str) -> Result<Option<ProviderConfig>, String> {
        let dao = ProviderDao::new(self.db);
        dao.get_by_id(id).map_err(|e| e.to_string())
    }

    pub fn set_active(&self, provider_id: &str, model_id: Option<&str>) -> Result<(), String> {
        let dao = ProviderDao::new(self.db);
        let provider = dao.get_by_id(provider_id).map_err(|e| e.to_string())?;
        if provider.is_none() {
            return Err(format!("Provider '{}' 不存在", provider_id));
        }

        let settings_dao = crate::database::settings_dao::SettingsDao::new(self.db);
        let mut settings = settings_dao.get().map_err(|e| e.to_string())?.unwrap_or_default();

        settings.default_provider = Some(provider_id.to_string());
        settings.default_model = model_id.map(|s| s.to_string());

        settings_dao.update(&settings).map_err(|e| e.to_string())?;

        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_settings_json().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_builtin_presets(&self) -> Vec<ProviderConfig> {
        vec![
            ProviderConfig {
                id: "openai".to_string(),
                name: "OpenAI".to_string(),
                enabled: true,
                is_built_in: true,
                base_url: Some("https://api.openai.com/v1".to_string()),
                api_key: None,
                api_type: Some("openai-completions".to_string()),
                headers: None,
                auth_header: None,
                auth: Some("apiKey".to_string()),
                discovery: None,
                model_overrides: None,
                models: None,
                created_at: None,
                updated_at: None,
            },
            ProviderConfig {
                id: "anthropic".to_string(),
                name: "Anthropic".to_string(),
                enabled: true,
                is_built_in: true,
                base_url: Some("https://api.anthropic.com".to_string()),
                api_key: None,
                api_type: Some("anthropic-messages".to_string()),
                headers: None,
                auth_header: None,
                auth: Some("apiKey".to_string()),
                discovery: None,
                model_overrides: None,
                models: None,
                created_at: None,
                updated_at: None,
            },
            ProviderConfig {
                id: "google".to_string(),
                name: "Google".to_string(),
                enabled: true,
                is_built_in: true,
                base_url: Some("https://generativelanguage.googleapis.com".to_string()),
                api_key: None,
                api_type: Some("google-generative-ai".to_string()),
                headers: None,
                auth_header: None,
                auth: Some("apiKey".to_string()),
                discovery: None,
                model_overrides: None,
                models: None,
                created_at: None,
                updated_at: None,
            },
            ProviderConfig {
                id: "ollama".to_string(),
                name: "Ollama".to_string(),
                enabled: true,
                is_built_in: true,
                base_url: Some("http://localhost:11434".to_string()),
                api_key: None,
                api_type: Some("openai-completions".to_string()),
                headers: None,
                auth_header: None,
                auth: Some("none".to_string()),
                discovery: Some(crate::models::provider::DiscoveryConfig {
                    discovery_type: "ollama".to_string(),
                }),
                model_overrides: None,
                models: None,
                created_at: None,
                updated_at: None,
            },
            ProviderConfig {
                id: "step-plan".to_string(),
                name: "StepFun (Step Plan)".to_string(),
                enabled: true,
                is_built_in: true,
                base_url: Some("https://api.stepfun.com/step_plan/v1".to_string()),
                api_key: None,
                api_type: Some("openai-completions".to_string()),
                headers: None,
                auth_header: None,
                auth: Some("apiKey".to_string()),
                discovery: None,
                model_overrides: None,
                models: Some(vec![
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
                    },
                ]),
                created_at: None,
                updated_at: None,
            },
        ]
    }
}
