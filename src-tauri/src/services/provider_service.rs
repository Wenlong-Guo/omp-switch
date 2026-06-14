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
        let exists = dao
            .get_by_id(&config.id)
            .map_err(|e| e.to_string())?
            .is_some();

        if exists {
            dao.update(&config).map_err(|e| e.to_string())?;
        } else {
            dao.create(&config).map_err(|e| e.to_string())?;
        }

        // Write to models.yml
        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_models_yaml().map_err(|e| e.to_string())?;
        writer.write_settings_json().map_err(|e| e.to_string())?;

        Ok(config)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let dao = ProviderDao::new(self.db);
        dao.delete(id).map_err(|e| e.to_string())?;

        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_models_yaml().map_err(|e| e.to_string())?;
        writer.write_settings_json().map_err(|e| e.to_string())?;

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
        let provider = provider.unwrap();

        let settings_dao = crate::database::settings_dao::SettingsDao::new(self.db);
        let mut settings = settings_dao
            .get()
            .map_err(|e| e.to_string())?
            .unwrap_or_default();

        let selected_model = model_id.map(|s| s.to_string()).or_else(|| {
            provider
                .models
                .as_ref()
                .and_then(|models| models.first().map(|m| m.id.clone()))
        });
        settings.default_provider = Some(provider_id.to_string());
        settings.default_model = selected_model.clone();

        if let Some(model) = selected_model {
            let mut roles = settings.model_roles.map(|r| r.0).unwrap_or_default();
            roles.insert("default".to_string(), format!("{}/{}", provider_id, model));
            settings.model_roles = Some(crate::models::settings::ModelRoles(roles));
        }

        settings_dao.update(&settings).map_err(|e| e.to_string())?;

        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_settings_json().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_builtin_presets(&self) -> Vec<ProviderConfig> {
        let mut presets = crate::services::model_metadata::load_omp_provider_models();
        for provider in crate::services::model_metadata::default_builtin_providers() {
            if let Some(existing) = presets.iter_mut().find(|p| p.id == provider.id) {
                if existing.base_url.is_none() {
                    existing.base_url = provider.base_url;
                }
                if existing.auth.is_none() {
                    existing.auth = provider.auth;
                }
            } else {
                presets.push(provider);
            }
        }
        presets
    }

    pub fn prune_deprecated_builtin_presets(&self) {
        let deprecated = ["openai", "anthropic", "google", "lmstudio", "step-plan"];
        for id in deprecated {
            if let Ok(Some(provider)) = self.get_by_id(id) {
                if provider.is_built_in {
                    let _ = self.delete(id);
                }
            }
        }

        if let Ok(Some(provider)) = self.get_by_id("github-copilot") {
            if provider.is_built_in
                && provider
                    .models
                    .as_ref()
                    .map_or(true, |models| models.is_empty())
            {
                let _ = self.delete("github-copilot");
            }
        }
    }
}
