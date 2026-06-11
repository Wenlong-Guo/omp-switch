use crate::models::provider::{DiscoveryConfig, ModelCost, ModelDefinition, ProviderConfig};
use std::collections::BTreeMap;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn default_builtin_providers() -> Vec<ProviderConfig> {
    vec![
        ProviderConfig { id: "ollama".to_string(), name: "Ollama".to_string(), enabled: true, is_built_in: true, base_url: Some("http://localhost:11434".to_string()), api_key: None, api_type: Some("openai-completions".to_string()), headers: None, auth_header: None, auth: Some("none".to_string()), discovery: Some(DiscoveryConfig { discovery_type: "ollama".to_string() }), model_overrides: None, models: None, created_at: None, updated_at: None },
        ProviderConfig { id: "lm-studio".to_string(), name: "LM Studio".to_string(), enabled: true, is_built_in: true, base_url: Some("http://localhost:1234/v1".to_string()), api_key: None, api_type: Some("openai-completions".to_string()), headers: None, auth_header: None, auth: Some("none".to_string()), discovery: Some(DiscoveryConfig { discovery_type: "lm-studio".to_string() }), model_overrides: None, models: None, created_at: None, updated_at: None },
        ProviderConfig { id: "llama-cpp".to_string(), name: "Llama CPP".to_string(), enabled: true, is_built_in: true, base_url: Some("http://localhost:8080/v1".to_string()), api_key: None, api_type: Some("openai-completions".to_string()), headers: None, auth_header: None, auth: Some("none".to_string()), discovery: None, model_overrides: None, models: None, created_at: None, updated_at: None },
    ]
}

pub fn load_omp_provider_models() -> Vec<ProviderConfig> {
    for executable in omp_executable_candidates() {
        let mut command = Command::new(executable);
        command.arg("--list-models");
        #[cfg(windows)]
        command.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = command.output() {
            if output.status.success() {
                return parse_omp_list_models(&String::from_utf8_lossy(&output.stdout));
            }
        }
    }
    vec![]
}

#[cfg(windows)]
fn omp_executable_candidates() -> [&'static str; 2] {
    ["omp", "omp.cmd"]
}

#[cfg(not(windows))]
fn omp_executable_candidates() -> [&'static str; 1] {
    ["omp"]
}

pub fn parse_omp_list_models(output: &str) -> Vec<ProviderConfig> {
    let mut in_provider_table = false;
    let mut by_provider: BTreeMap<String, Vec<ModelDefinition>> = BTreeMap::new();
    for raw in output.lines() {
        let line = raw.trim();
        if line == "Provider models" { in_provider_table = true; continue; }
        if !in_provider_table || line.is_empty() || line.starts_with("provider ") { continue; }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 6 { continue; }
        let provider_id = parts[0].to_string();
        let model_id = parts[1].to_string();
        let thinking = parts[4];
        let mut input_types = vec!["text".to_string()];
        if parts[5] == "yes" { input_types.push("image".to_string()); }
        by_provider.entry(provider_id).or_default().push(ModelDefinition {
            id: model_id.clone(), name: model_id, api_type: Some("openai-completions".to_string()), reasoning: thinking != "-", input_types,
            cost: ModelCost { input: 0.0, output: 0.0, cache_read: 0.0, cache_write: 0.0 },
            context_window: parse_k_number(parts[2]), max_tokens: parse_k_number(parts[3]), headers: None, compat: None,
            default_temperature: None, default_top_p: None, default_presence_penalty: None, default_frequency_penalty: None, default_seed: None,
        });
    }
    by_provider.into_iter().map(|(id, models)| ProviderConfig {
        name: title_provider_name(&id), id, enabled: true, is_built_in: true, base_url: None, api_key: None, api_type: Some("openai-completions".to_string()),
        headers: None, auth_header: None, auth: Some("apiKey".to_string()), discovery: None, model_overrides: None, models: Some(models), created_at: None, updated_at: None,
    }).collect()
}

fn parse_k_number(value: &str) -> i64 {
    let n = value.trim_end_matches('K').parse::<f64>().unwrap_or(0.0);
    if value.ends_with('K') { (n * 1000.0).round() as i64 } else { n.round() as i64 }
}

fn title_provider_name(id: &str) -> String {
    match id {
        "github-copilot" => "GitHub Copilot".to_string(),
        "lmstudio" | "lm-studio" => "LM Studio".to_string(),
        "llama-cpp" => "Llama CPP".to_string(),
        _ => id.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_provider_models_table() {
        let text = "Provider models\nprovider model context max-out thinking images\ngithub-copilot gpt-5.5 400K 128K low,medium,high,xhigh yes\ngithub-copilot gpt-4 33K 4.1K - no\n";
        let providers = parse_omp_list_models(text);
        assert_eq!(providers[0].id, "github-copilot");
        let models = providers[0].models.as_ref().unwrap();
        assert_eq!(models[0].context_window, 400000);
        assert_eq!(models[0].max_tokens, 128000);
        assert!(models[0].reasoning);
        assert!(!models[1].reasoning);
    }
}
