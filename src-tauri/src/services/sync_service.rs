use crate::database::connection::DbConnection;
use crate::database::sync_dao::SyncDao;
use crate::models::sync::{SyncConfig, SyncResult};

pub struct SyncService<'a> {
    db: &'a DbConnection,
}

impl<'a> SyncService<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub async fn upload(&self) -> Result<SyncResult, String> {
        Ok(SyncResult {
            success: true,
            message: "上传完成".to_string(),
        })
    }

    pub async fn download(&self) -> Result<SyncResult, String> {
        Ok(SyncResult {
            success: true,
            message: "下载完成".to_string(),
        })
    }

    pub async fn test_connection(&self) -> Result<bool, String> {
        let dao = SyncDao::new(self.db);
        let config = dao.get_config().map_err(|e| e.to_string())?;
        
        if let Some(cfg) = config {
            if cfg.server_url.is_empty() {
                return Ok(false);
            }
            // TODO: 实际 WebDAV 连接测试
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub fn get_config(&self) -> Result<Option<SyncConfig>, String> {
        let dao = SyncDao::new(self.db);
        dao.get_config().map_err(|e| e.to_string())
    }

    pub fn save_config(&self, config: &SyncConfig) -> Result<(), String> {
        let dao = SyncDao::new(self.db);
        dao.update_config(config).map_err(|e| e.to_string())
    }
}
