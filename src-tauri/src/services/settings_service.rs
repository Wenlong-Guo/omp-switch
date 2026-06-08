use crate::database::connection::DbConnection;
use crate::database::settings_dao::SettingsDao;
use crate::models::settings::AppSettings;

pub struct SettingsService<'a> {
    db: &'a DbConnection,
}

impl<'a> SettingsService<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn get(&self) -> Result<Option<AppSettings>, String> {
        let dao = SettingsDao::new(self.db);
        dao.get().map_err(|e| e.to_string())
    }

    pub fn save(&self, settings: AppSettings) -> Result<(), String> {
        let dao = SettingsDao::new(self.db);
        dao.update(&settings).map_err(|e| e.to_string())?;

        let writer = super::config_writer::ConfigWriter::new(self.db);
        writer.write_settings_json().map_err(|e| e.to_string())?;

        Ok(())
    }
}
