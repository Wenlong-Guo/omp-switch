use std::process::Command;

fn clear_db(db: &omp_switch_lib::database::connection::DbConnection) {
    let conn = db.get_conn();
    let _ = conn.execute("DELETE FROM providers", []);
    let _ = conn.execute("DELETE FROM provider_models", []);
    let _ = conn.execute("DELETE FROM model_overrides", []);
    let _ = conn.execute("DELETE FROM app_settings", []);
    let _ = conn.execute("DELETE FROM sync_config", []);
    let _ = conn.execute("DELETE FROM sync_changelog", []);
}

fn step_plan_provider() -> omp_switch_lib::models::provider::ProviderConfig {
    omp_switch_lib::models::provider::ProviderConfig {
        id: "step-plan".to_string(),
        name: "StepFun (Step Plan)".to_string(),
        enabled: true,
        is_built_in: true,
        base_url: Some("https://api.stepfun.com/step_plan/v1".to_string()),
        api_key: Some("sk-test-key".to_string()),
        api_type: Some("openai-completions".to_string()),
        headers: None,
        auth_header: None,
        auth: Some("apiKey".to_string()),
        discovery: None,
        model_overrides: None,
        models: Some(vec![
            omp_switch_lib::models::provider::ModelDefinition {
                id: "step-3.7-flash".to_string(),
                name: "Step 3.7 Flash".to_string(),
                api_type: Some("openai-completions".to_string()),
                reasoning: false,
                input_types: vec!["text".to_string()],
                cost: omp_switch_lib::models::provider::ModelCost {
                    input: 0.0,
                    output: 0.0,
                    cache_read: 0.0,
                    cache_write: 0.0,
                },
                context_window: 128000,
                max_tokens: 4096,
                headers: None,
                compat: None,
                default_temperature: None,
                default_top_p: None,
                default_presence_penalty: None,
                default_frequency_penalty: None,
                default_seed: None,
            },
        ]),
        created_at: None,
        updated_at: None,
    }
}

#[test]
fn test_step_plan_seeded_when_db_not_empty() {
    let db = omp_switch_lib::database::connection::DbConnection::in_memory().unwrap();
    clear_db(&db);

    let service = omp_switch_lib::services::provider_service::ProviderService::new(&db);

    // Simulate an existing DB with one provider already present
    let mut existing = step_plan_provider();
    existing.id = "openai".to_string();
    existing.name = "OpenAI".to_string();
    existing.models = None;
    service.save(existing).unwrap();

    // Now run the same upsert logic as main.rs setup()
    let presets = service.get_builtin_presets();
    for preset in presets {
        if service.get_by_id(&preset.id).ok().flatten().is_none() {
            let _ = service.save(preset);
        }
    }

    // Bug 1 regression: step-plan should now exist even though DB was not empty
    let step_plan = service.get_by_id("step-plan").unwrap();
    assert!(step_plan.is_some(), "step-plan should be seeded even when DB already has providers");

    // Existing provider should not be overwritten
    let openai = service.get_by_id("openai").unwrap().unwrap();
    assert_eq!(openai.name, "OpenAI");
}

#[test]
fn test_full_pipeline_yaml_has_models() {
    let db = omp_switch_lib::database::connection::DbConnection::in_memory().unwrap();
    clear_db(&db);

    let service = omp_switch_lib::services::provider_service::ProviderService::new(&db);
    service.save(step_plan_provider()).unwrap();

    // Trigger YAML write (ProviderService::save already calls write_models_yaml)
    let yaml_path = omp_switch_lib::utils::fs::get_models_yaml_path();
    let content = std::fs::read_to_string(&yaml_path).unwrap();

    // Bug 2 regression: YAML must contain model entries
    assert!(content.contains("step-plan"), "YAML should contain step-plan provider");
    assert!(content.contains("models"), "YAML should have models array");
    assert!(content.contains("step-3.7-flash"), "YAML should contain model id");
    assert!(content.contains("Step 3.7 Flash"), "YAML should contain model name");
    assert!(content.contains("contextWindow"), "YAML should contain contextWindow");
    assert!(content.contains("maxTokens"), "YAML should contain maxTokens");

    // Parse YAML and verify structure matches what omp expects
    let parsed: serde_yaml::Value = serde_yaml::from_str(&content).unwrap();
    let providers = parsed.get("providers").unwrap().as_mapping().unwrap();
    let step_plan = providers.get(&serde_yaml::Value::String("step-plan".to_string())).unwrap();
    let models = step_plan.get("models").unwrap().as_sequence().unwrap();
    assert_eq!(models.len(), 1);

    let model = &models[0];
    assert!(model.get("id").is_some());
    assert!(model.get("name").is_some());
    assert!(model.get("api").is_some());
    assert!(model.get("reasoning").is_some());
    assert!(model.get("input").is_some());
    assert!(model.get("cost").is_some());
    assert!(model.get("contextWindow").is_some());
    assert!(model.get("maxTokens").is_some());
}

#[test]
fn test_provider_serde_alias_preserves_api_type() {
    let db = omp_switch_lib::database::connection::DbConnection::in_memory().unwrap();
    clear_db(&db);

    // Bug 3 regression: simulate frontend payload using "api" instead of "apiType"
    let json = r#"{
        "id":"alias-test",
        "name":"Alias Test",
        "enabled":true,
        "isBuiltIn":false,
        "api":"openai-completions",
        "baseUrl":"https://api.test.com",
        "models":[{
            "id":"model-1",
            "name":"Model 1",
            "api":"openai-completions",
            "reasoning":false,
            "input":["text"],
            "cost":{"input":0.0,"output":0.0,"cacheRead":0.0,"cacheWrite":0.0},
            "contextWindow":128000,
            "maxTokens":4096
        }]
    }"#;

    let config: omp_switch_lib::models::provider::ProviderConfig = serde_json::from_str(json).unwrap();
    assert_eq!(config.api_type, Some("openai-completions".to_string()));
    assert!(!config.models.as_ref().unwrap().is_empty());
    assert_eq!(config.models.as_ref().unwrap()[0].api_type, Some("openai-completions".to_string()));
    assert_eq!(config.models.as_ref().unwrap()[0].input_types, vec!["text".to_string()]);

    let service = omp_switch_lib::services::provider_service::ProviderService::new(&db);
    service.save(config).unwrap();

    // Verify round-trip: DB stores it, YAML writes it
    let retrieved = service.get_by_id("alias-test").unwrap().unwrap();
    assert_eq!(retrieved.api_type, Some("openai-completions".to_string()));

    let yaml_path = omp_switch_lib::utils::fs::get_models_yaml_path();
    let content = std::fs::read_to_string(&yaml_path).unwrap();
    assert!(content.contains("alias-test"));
    assert!(content.contains("model-1"));
}

#[test]
fn test_omp_cli_reads_yaml_without_crash() {
    let db = omp_switch_lib::database::connection::DbConnection::in_memory().unwrap();
    clear_db(&db);

    let service = omp_switch_lib::services::provider_service::ProviderService::new(&db);
    service.save(step_plan_provider()).unwrap();

    // Create a temp HOME so omp reads our YAML
    let tmp_home = tempfile::tempdir().unwrap();
    let omp_agent = tmp_home.path().join(".omp").join("agent");
    std::fs::create_dir_all(&omp_agent).unwrap();

    // Copy the generated models.yml into temp HOME/.omp/agent/
    let src_yaml = omp_switch_lib::utils::fs::get_models_yaml_path();
    let dst_yaml = omp_agent.join("models.yml");
    std::fs::copy(&src_yaml, &dst_yaml).unwrap();

    // Run omp --list-models with the temp HOME
    let output = Command::new("omp")
        .arg("--list-models")
        .env("HOME", tmp_home.path())
        .env("STEPFUN_API_KEY", "sk-test")
        .output()
        .expect("omp command should be available in PATH");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // We expect "No models available" because test API key isn't real,
    // but it must NOT crash with YAML parse errors
    assert!(
        !stderr.to_lowercase().contains("yaml") &&
        !stderr.to_lowercase().contains("parse") &&
        !stdout.to_lowercase().contains("yaml") &&
        !stdout.to_lowercase().contains("parse"),
        "omp should not report YAML parse errors. stdout: {}, stderr: {}",
        stdout, stderr
    );

    // Exit code should be 0 (omp exits 0 even when no models available)
    assert_eq!(output.status.code(), Some(0), "omp should exit 0");
}
