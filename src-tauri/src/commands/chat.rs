use crate::commands::provider::get_db;
use crate::services::provider_service::ProviderService;
use crate::services::settings_service::SettingsService;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionRequest {
    pub messages: Vec<ChatMessage>,
    pub model: Option<String>,
    pub provider_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub choices: Vec<ChatChoice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatChoice {
    pub message: ChatMessage,
}

#[tauri::command]
pub async fn chat_completion(req: ChatCompletionRequest) -> Result<ChatCompletionResponse, String> {
    let db = get_db();

    let (provider, model_id) = if let Some(pid) = &req.provider_id {
        let service = ProviderService::new(db);
        let provider = service.get_by_id(pid).map_err(|e| e.to_string())?;
        let provider = provider.ok_or_else(|| format!("Provider '{}' not found", pid))?;
        let model_id = req.model.clone()
            .or_else(|| provider.models.as_ref()?.first().map(|m| m.id.clone()))
            .ok_or("No model specified")?;
        (provider, model_id)
    } else {
        let settings_service = SettingsService::new(db);
        let settings = settings_service.get().map_err(|e| e.to_string())?.unwrap_or_default();
        let default_provider = settings.default_provider.ok_or("No default provider set")?;
        let default_model = settings.default_model.ok_or("No default model set")?;

        let service = ProviderService::new(db);
        let provider = service.get_by_id(&default_provider).map_err(|e| e.to_string())?;
        let provider = provider.ok_or_else(|| format!("Default provider '{}' not found", default_provider))?;
        (provider, default_model)
    };

    let api_key = provider.api_key.as_ref().ok_or("Provider has no API key")?;
    let base_url = provider.base_url.as_ref().ok_or("Provider has no base URL")?;

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model_id,
        "messages": req.messages.iter().map(|m| serde_json::json!({
            "role": m.role,
            "content": m.content,
        })).collect::<Vec<_>>(),
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    let api_response: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    let id = api_response["id"].as_str().unwrap_or("unknown").to_string();
    let choices = api_response["choices"]
        .as_array()
        .ok_or("missing choices")?
        .iter()
        .map(|c| {
            let msg = c["message"].as_object().ok_or("invalid message")?;
            Ok(ChatChoice {
                message: ChatMessage {
                    role: msg["role"].as_str().unwrap_or("assistant").to_string(),
                    content: msg["content"].as_str().unwrap_or("").to_string(),
                },
            })
        })
        .collect::<Result<Vec<_>, String>>()?;

    Ok(ChatCompletionResponse { id, choices })
}
