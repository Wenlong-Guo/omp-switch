use crate::database::connection::DbConnection;
use crate::database::sync_dao::SyncDao;
use crate::models::sync::{SyncConfig, SyncResult};
use crate::services::webdav_client::{WebDavClient, get_local_modified_time};
use crate::utils::crypto;
use chrono::Utc;

pub struct SyncService<'a> {
    db: &'a DbConnection,
}

impl<'a> SyncService<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn client_for(&self, config: &SyncConfig) -> Result<WebDavClient, String> {
        let password = if config.password.is_empty() {
            String::new()
        } else {
            crypto::decrypt(&config.password).unwrap_or_else(|_| config.password.clone())
        };
        Ok(WebDavClient::new(&config.server_url, &config.username, &password))
    }

    pub async fn upload(&self) -> Result<SyncResult, String> {
        let dao = SyncDao::new(self.db);
        let config = dao
            .get_config()
            .map_err(|e| e.to_string())?
            .ok_or("同步配置不存在")?;

        if !config.enabled {
            return Ok(SyncResult {
                success: false,
                message: "同步未启用".to_string(),
            });
        }

        let client = self.client_for(&config)?;
        let db_path = crate::utils::fs::get_db_path();

        // Ensure parent directory exists on remote
        client.ensure_parent_dir(&config.remote_path).await?;

        // Upload
        client.upload(&db_path, &config.remote_path).await?;

        // Update sync status
        let now = Utc::now().to_rfc3339();
        let mut updated = config.clone();
        updated.last_sync_at = Some(now.clone());
        updated.last_sync_status = Some("upload_success".to_string());
        updated.last_error = None;
        dao.update_config(&updated).map_err(|e| e.to_string())?;

        Ok(SyncResult {
            success: true,
            message: format!("上传完成: {}", now),
        })
    }

    pub async fn download(&self) -> Result<SyncResult, String> {
        let dao = SyncDao::new(self.db);
        let config = dao
            .get_config()
            .map_err(|e| e.to_string())?
            .ok_or("同步配置不存在")?;

        if !config.enabled {
            return Ok(SyncResult {
                success: false,
                message: "同步未启用".to_string(),
            });
        }

        let client = self.client_for(&config)?;
        let db_path = crate::utils::fs::get_db_path();

        // Download to a temp file, then replace
        let temp_path = db_path.with_extension("download.tmp");
        client.download(&config.remote_path, &temp_path).await?;

        // Close current connection before replacing
        drop(dao);

        // Atomic replace
        if let Err(e) = std::fs::rename(&temp_path, &db_path) {
            let _ = std::fs::remove_file(&temp_path);
            return Err(format!("替换数据库失败: {}", e));
        }

        // Re-open connection and update status
        let dao2 = SyncDao::new(self.db);
        let now = Utc::now().to_rfc3339();
        let mut updated = config.clone();
        updated.last_sync_at = Some(now.clone());
        updated.last_sync_status = Some("download_success".to_string());
        updated.last_error = None;
        dao2.update_config(&updated).map_err(|e| e.to_string())?;

        Ok(SyncResult {
            success: true,
            message: format!("下载完成: {}", now),
        })
    }

    pub async fn test_connection(&self) -> Result<bool, String> {
        let dao = SyncDao::new(self.db);
        let config = dao.get_config().map_err(|e| e.to_string())?;

        if let Some(cfg) = config {
            if cfg.server_url.is_empty() {
                return Ok(false);
            }
            let client = self.client_for(&cfg)?;
            client.test_connection(&cfg.remote_path).await
        } else {
            Ok(false)
        }
    }

    /// Check if remote is newer than local (returns true if remote is newer or unknown)
    pub async fn check_remote_newer(&self) -> Result<bool, String> {
        let dao = SyncDao::new(self.db);
        let config = dao
            .get_config()
            .map_err(|e| e.to_string())?
            .ok_or("同步配置不存在")?;

        if !config.enabled || config.server_url.is_empty() {
            return Ok(false);
        }

        let client = self.client_for(&config)?;
        let db_path = crate::utils::fs::get_db_path();

        let local_mtime = get_local_modified_time(&db_path).unwrap_or(0);
        let remote_info = client.get_file_info(&config.remote_path).await?;

        if let Some(info) = remote_info {
            if let Some(remote_modified) = info.last_modified {
                // Parse HTTP date format (RFC 1123)
                if let Ok(remote_time) = chrono::DateTime::parse_from_rfc2822(&remote_modified) {
                    let remote_ts = remote_time.timestamp() as u64;
                    return Ok(remote_ts > local_mtime);
                }
            }
        }

        // If remote file doesn't exist or can't parse time, assume local is newer
        Ok(false)
    }

    pub fn get_config(&self) -> Result<Option<SyncConfig>, String> {
        let dao = SyncDao::new(self.db);
        let mut config = dao.get_config().map_err(|e| e.to_string())?;
        // Mask password for return
        if let Some(ref mut cfg) = config {
            if !cfg.password.is_empty() {
                cfg.password = "***".to_string();
            }
        }
        Ok(config)
    }

    pub fn get_config_raw(&self) -> Result<Option<SyncConfig>, String> {
        let dao = SyncDao::new(self.db);
        dao.get_config().map_err(|e| e.to_string())
    }

    pub fn save_config(&self, config: &SyncConfig) -> Result<(), String> {
        let dao = SyncDao::new(self.db);
        let mut to_save = config.clone();

        // Encrypt password if it's plaintext (not already encrypted and not masked)
        if !to_save.password.is_empty() && to_save.password != "***" {
            match crypto::encrypt(&to_save.password) {
                Ok(encrypted) => to_save.password = encrypted,
                Err(e) => return Err(format!("密码加密失败: {}", e)),
            }
        } else if to_save.password == "***" {
            // Preserve existing encrypted password
            if let Some(existing) = dao.get_config().map_err(|e| e.to_string())? {
                to_save.password = existing.password;
            }
        }

        dao.update_config(&to_save).map_err(|e| e.to_string())
    }

    pub async fn auto_sync(&self) -> Result<SyncResult, String> {
        let dao = SyncDao::new(self.db);
        let config = dao
            .get_config()
            .map_err(|e| e.to_string())?
            .ok_or("同步配置不存在")?;

        if !config.enabled {
            return Ok(SyncResult {
                success: true,
                message: "同步未启用，跳过".to_string(),
            });
        }

        // Check if remote is newer
        match self.check_remote_newer().await {
            Ok(true) => self.download().await,
            Ok(false) => self.upload().await,
            Err(e) => Ok(SyncResult {
                success: false,
                message: format!("自动同步检测失败: {}", e),
            }),
        }
    }
}
