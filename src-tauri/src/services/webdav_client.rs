use reqwest::{Client, StatusCode};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct WebDavClient {
    client: Client,
    base_url: String,
    auth: (String, String),
}

impl WebDavClient {
    pub fn new(base_url: &str, username: &str, password: &str) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_else(|_| Client::new());

        // Normalize base_url: ensure no trailing slash for host, then add trailing slash for path joining
        let normalized = if base_url.ends_with('/') {
            base_url.to_string()
        } else {
            format!("{}/", base_url)
        };

        Self {
            client,
            base_url: normalized,
            auth: (username.to_string(), password.to_string()),
        }
    }

    fn url(&self, remote_path: &str) -> String {
        let path = if remote_path.starts_with('/') {
            &remote_path[1..]
        } else {
            remote_path
        };
        format!("{}{}", self.base_url, path)
    }

    /// Test connection by sending PROPFIND to server root
    pub async fn test_connection(&self, remote_path: &str) -> Result<bool, String> {
        let url = self.url(remote_path);
        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), &url)
            .basic_auth(&self.auth.0, Some(&self.auth.1))
            .header("Content-Type", "application/xml")
            .header("Depth", "0")
            .body("<?xml version=\"1.0\" encoding=\"utf-8\"?><propfind xmlns=\"DAV:\"><prop><resourcetype/></prop></propfind>")
            .send()
            .await
            .map_err(|e| format!("连接失败: {}", e))?;

        match response.status() {
            StatusCode::OK | StatusCode::MULTI_STATUS | StatusCode::NOT_FOUND => Ok(true),
            StatusCode::UNAUTHORIZED => Err("认证失败: 用户名或密码错误".to_string()),
            status => Err(format!("服务器返回错误: {}", status)),
        }
    }

    /// Get remote file info (check existence and last modified)
    pub async fn get_file_info(&self, remote_path: &str) -> Result<Option<RemoteFileInfo>, String> {
        let url = self.url(remote_path);
        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), &url)
            .basic_auth(&self.auth.0, Some(&self.auth.1))
            .header("Content-Type", "application/xml")
            .header("Depth", "0")
            .body("<?xml version=\"1.0\" encoding=\"utf-8\"?><propfind xmlns=\"DAV:\"><prop><getlastmodified/><getcontentlength/></prop></propfind>")
            .send()
            .await
            .map_err(|e| format!("PROPFIND 失败: {}", e))?;

        if response.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }

        if !response.status().is_success() && response.status() != StatusCode::MULTI_STATUS {
            return Err(format!("PROPFIND 错误: {}", response.status()));
        }

        let body = response.text().await.map_err(|e| e.to_string())?;
        
        // Parse last modified from XML response
        let last_modified = extract_last_modified(&body);
        let size = extract_content_length(&body);

        Ok(Some(RemoteFileInfo {
            last_modified,
            size,
        }))
    }

    /// Download file from WebDAV
    pub async fn download(&self, remote_path: &str, local_path: &PathBuf) -> Result<(), String> {
        let url = self.url(remote_path);
        let response = self
            .client
            .get(&url)
            .basic_auth(&self.auth.0, Some(&self.auth.1))
            .send()
            .await
            .map_err(|e| format!("下载请求失败: {}", e))?;

        match response.status() {
            StatusCode::OK => {
                let bytes = response.bytes().await.map_err(|e| e.to_string())?;
                
                // Verify it's a valid SQLite database (first 16 bytes are "SQLite format 3\0")
                if bytes.len() < 16 || &bytes[..16] != b"SQLite format 3\0" {
                    return Err("下载的文件不是有效的 SQLite 数据库".to_string());
                }

                // Write to temp file first
                let temp_path = local_path.with_extension("db.tmp");
                std::fs::write(&temp_path, &bytes).map_err(|e| format!("写入临时文件失败: {}", e))?;

                // Atomic rename
                std::fs::rename(&temp_path, local_path)
                    .map_err(|e| format!("替换数据库文件失败: {}", e))?;

                Ok(())
            }
            StatusCode::NOT_FOUND => Err("远程文件不存在".to_string()),
            StatusCode::UNAUTHORIZED => Err("认证失败".to_string()),
            status => Err(format!("下载失败: {}", status)),
        }
    }

    /// Upload file to WebDAV
    pub async fn upload(&self, local_path: &PathBuf, remote_path: &str) -> Result<(), String> {
        let data = std::fs::read(local_path)
            .map_err(|e| format!("读取本地文件失败: {}", e))?;

        let url = self.url(remote_path);
        let response = self
            .client
            .put(&url)
            .basic_auth(&self.auth.0, Some(&self.auth.1))
            .header("Content-Type", "application/octet-stream")
            .body(data)
            .send()
            .await
            .map_err(|e| format!("上传请求失败: {}", e))?;

        match response.status() {
            StatusCode::CREATED | StatusCode::NO_CONTENT | StatusCode::OK => Ok(()),
            StatusCode::UNAUTHORIZED => Err("认证失败".to_string()),
            status => Err(format!("上传失败: {}", status)),
        }
    }

    /// Ensure parent directory exists (try MKCOL on parent path)
    pub async fn ensure_parent_dir(&self, remote_path: &str) -> Result<(), String> {
        let parent = if let Some(pos) = remote_path.rfind('/') {
            &remote_path[..pos]
        } else {
            return Ok(());
        };

        if parent.is_empty() || parent == "/" {
            return Ok(());
        }

        let url = self.url(parent);
        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"MKCOL").unwrap(), &url)
            .basic_auth(&self.auth.0, Some(&self.auth.1))
            .send()
            .await
            .map_err(|e| format!("MKCOL 失败: {}", e))?;

        // MKCOL returns 201 Created or 405 Method Not Allowed (already exists) - both OK
        match response.status() {
            StatusCode::CREATED | StatusCode::METHOD_NOT_ALLOWED | StatusCode::OK => Ok(()),
            StatusCode::UNAUTHORIZED => Err("认证失败".to_string()),
            status => Err(format!("创建目录失败: {}", status)),
        }
    }
}

#[derive(Debug, Clone)]
pub struct RemoteFileInfo {
    pub last_modified: Option<String>,
    pub size: Option<u64>,
}

/// Extract getlastmodified from WebDAV PROPFIND XML response
fn extract_last_modified(xml: &str) -> Option<String> {
    // Simple regex-like extraction for <getlastmodified>Wed, 21 Oct 2015 07:28:00 GMT</getlastmodified>
    if let Some(start) = xml.find("<getlastmodified>") {
        let rest = &xml[start + 17..];
        if let Some(end) = rest.find("</getlastmodified>") {
            return Some(rest[..end].to_string());
        }
    }
    None
}

fn extract_content_length(xml: &str) -> Option<u64> {
    if let Some(start) = xml.find("<getcontentlength>") {
        let rest = &xml[start + 18..];
        if let Some(end) = rest.find("</getcontentlength>") {
            return rest[..end].parse().ok();
        }
    }
    None
}

/// Get last modified time of local file
pub fn get_local_modified_time(path: &PathBuf) -> Option<u64> {
    Some(
        std::fs::metadata(path)
            .ok()?
            .modified()
            .ok()?
            .duration_since(UNIX_EPOCH)
            .ok()?
            .as_secs(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_last_modified() {
        let xml = r#"<response><propstat><prop><getlastmodified>Wed, 21 Oct 2015 07:28:00 GMT</getlastmodified></prop></propstat></response>"#;
        assert_eq!(
            extract_last_modified(xml),
            Some("Wed, 21 Oct 2015 07:28:00 GMT".to_string())
        );
    }

    #[test]
    fn test_extract_content_length() {
        let xml = r#"<response><propstat><prop><getcontentlength>12345</getcontentlength></prop></propstat></response>"#;
        assert_eq!(extract_content_length(xml), Some(12345));
    }
}
