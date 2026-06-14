use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchedModel {
    pub id: String,
    pub name: Option<String>,
}

#[tauri::command]
pub async fn fetch_models_for_config(
    base_url: String,
    api_key: String,
    api_type: Option<String>,
) -> Result<Vec<FetchedModel>, String> {
    let base = base_url.trim().trim_end_matches('/');
    if base.is_empty() { return Err("Base URL is required".to_string()); }
    if api_key.trim().is_empty() { return Err("API key is required".to_string()); }

    let client = reqwest::Client::new();
    let is_google = api_type.as_deref().unwrap_or_default().contains("google") || base.contains("generativelanguage.googleapis.com");
    let mut urls = vec![format!("{}/models", base)];
    if !base.ends_with("/v1") && !base.ends_with("/v1beta") {
        urls.push(format!("{}/v1/models", base));
    }

    let mut last_error = String::new();
    for url in urls {
        let mut request = client.get(&url);
        request = if is_google { request.header("x-goog-api-key", api_key.trim()) } else { request.header("Authorization", format!("Bearer {}", api_key.trim())) };
        let response = match request.send().await {
            Ok(response) => response,
            Err(err) => { last_error = format!("{}: {}", url, err); continue; }
        };
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        if !status.is_success() {
            last_error = format!("{} returned {}: {}", url, status, text);
            continue;
        }
        let value: serde_json::Value = serde_json::from_str(&text).map_err(|err| format!("{} returned invalid JSON: {}", url, err))?;
        let items = value.get("data").or_else(|| value.get("models")).and_then(|v| v.as_array()).ok_or_else(|| format!("{} response missing data/models array", url))?;
        let models = items.iter().filter_map(|item| {
            let raw_id = item.get("id").or_else(|| item.get("name"))?.as_str()?;
            let id = raw_id.strip_prefix("models/").unwrap_or(raw_id).to_string();
            if id.is_empty() { return None; }
            let name = item.get("displayName").or_else(|| item.get("owned_by")).and_then(|v| v.as_str()).map(|s| s.to_string());
            Some(FetchedModel { id, name })
        }).collect::<Vec<_>>();
        if models.is_empty() { return Err(format!("{} returned no models", url)); }
        return Ok(models);
    }
    Err(if last_error.is_empty() { "No model endpoint succeeded".to_string() } else { last_error })
}
