use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub is_built_in: bool,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api_type: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub auth_header: Option<bool>,
    pub auth: Option<String>,
    pub discovery: Option<DiscoveryConfig>,
    pub model_overrides: Option<HashMap<String, ModelOverride>>,
    pub models: Option<Vec<ModelDefinition>>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryConfig {
    #[serde(rename = "type")]
    pub discovery_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDefinition {
    pub id: String,
    pub name: String,
    pub api_type: Option<String>,
    pub reasoning: bool,
    pub input_types: Vec<String>,
    pub cost: ModelCost,
    pub context_window: i64,
    pub max_tokens: i64,
    pub headers: Option<HashMap<String, String>>,
    pub compat: Option<ModelCompat>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCost {
    pub input: f64,
    pub output: f64,
    #[serde(rename = "cacheRead")]
    pub cache_read: f64,
    #[serde(rename = "cacheWrite")]
    pub cache_write: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCompat {
    #[serde(rename = "supportsStore")]
    pub supports_store: Option<bool>,
    #[serde(rename = "supportsDeveloperRole")]
    pub supports_developer_role: Option<bool>,
    #[serde(rename = "supportsReasoningEffort")]
    pub supports_reasoning_effort: Option<bool>,
    #[serde(rename = "maxTokensField")]
    pub max_tokens_field: Option<String>,
    #[serde(rename = "openRouterRouting")]
    pub open_router_routing: Option<serde_json::Value>,
    #[serde(rename = "vercelGatewayRouting")]
    pub vercel_gateway_routing: Option<serde_json::Value>,
    #[serde(rename = "extraBody")]
    pub extra_body: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelOverride {
    pub name: Option<String>,
    pub reasoning: Option<bool>,
    pub input: Option<Vec<String>>,
    pub cost: Option<ModelCost>,
    #[serde(rename = "contextWindow")]
    pub context_window: Option<i64>,
    #[serde(rename = "maxTokens")]
    pub max_tokens: Option<i64>,
    pub headers: Option<HashMap<String, String>>,
    pub compat: Option<ModelCompat>,
    #[serde(rename = "contextPromotionTarget")]
    pub context_promotion_target: Option<String>,
}
