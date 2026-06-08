use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    #[serde(rename = "defaultProvider")]
    pub default_provider: Option<String>,
    #[serde(rename = "defaultModel")]
    pub default_model: Option<String>,
    #[serde(rename = "defaultThinkingLevel")]
    pub default_thinking_level: Option<String>,
    #[serde(rename = "hideThinkingBlock")]
    pub hide_thinking_block: Option<bool>,
    #[serde(rename = "thinkingBudgets")]
    pub thinking_budgets: Option<HashMap<String, i64>>,
    #[serde(rename = "modelRoles")]
    pub model_roles: Option<ModelRoles>,
    #[serde(rename = "retry")]
    pub retry: Option<RetryConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRoles {
    pub default: RoleConfig,
    pub smol: Option<RoleConfig>,
    pub slow: Option<RoleConfig>,
    pub plan: Option<RoleConfig>,
    pub commit: Option<RoleConfig>,
    pub paths: Option<HashMap<String, HashMap<String, RoleConfig>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleConfig {
    pub provider: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    #[serde(rename = "fallbackChains")]
    pub fallback_chains: HashMap<String, Vec<FallbackItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FallbackItem {
    pub provider: String,
    pub model: String,
}
