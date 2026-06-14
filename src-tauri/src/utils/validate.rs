use crate::models::provider::ProviderConfig;

#[derive(Debug, thiserror::Error)]
pub enum ValidationError {
    #[error("Provider ID 不能为空")]
    EmptyId,
    #[error("供应商 ID 只能包含字母、数字和横线")]
    InvalidId,
    #[error("Provider 名称不能为空")]
    EmptyName,
    #[error("无效的 API 类型: {0}")]
    InvalidApiType(String),
    #[error("baseUrl 必须是有效的 URL")]
    InvalidBaseUrl,
    #[error("启用的供应商必须提供 baseUrl（除非有 discovery 配置）")]
    MissingBaseUrl,
    #[error("模型 ID 不能为空")]
    EmptyModelId,
    #[error("模型名称不能为空")]
    EmptyModelName,
}

const VALID_API_TYPES: &[&str] = &[
    "openai-completions",
    "openai-responses",
    "openai-codex-responses",
    "azure-openai-responses",
    "anthropic-messages",
    "google-generative-ai",
    "google-vertex",
];

pub fn validate_provider(config: &ProviderConfig) -> Result<(), ValidationError> {
    if config.id.trim().is_empty() {
        return Err(ValidationError::EmptyId);
    }
    if !config
        .id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-')
    {
        return Err(ValidationError::InvalidId);
    }
    if config.name.trim().is_empty() {
        return Err(ValidationError::EmptyName);
    }
    if let Some(api_type) = &config.api_type {
        if !VALID_API_TYPES.contains(&api_type.as_str()) {
            return Err(ValidationError::InvalidApiType(api_type.clone()));
        }
    }
    match &config.base_url {
        Some(base_url) => {
            if !base_url.is_empty()
                && !base_url.starts_with("http://")
                && !base_url.starts_with("https://")
            {
                return Err(ValidationError::InvalidBaseUrl);
            }
        }
        None => {
            // Only enforce baseUrl for enabled, non-builtin providers without discovery.
            // Disabled providers can be saved incomplete (user configures before enabling).
            if config.enabled && config.discovery.is_none() && !config.is_built_in {
                return Err(ValidationError::MissingBaseUrl);
            }
        }
    }
    Ok(())
}
