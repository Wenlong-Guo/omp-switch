-- 001_init.sql: 初始数据库结构

CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    is_built_in INTEGER NOT NULL DEFAULT 0,
    base_url TEXT,
    api_key TEXT,
    api_type TEXT,
    headers TEXT,
    auth_header INTEGER,
    auth TEXT,
    discovery TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS provider_models (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    name TEXT NOT NULL,
    api_type TEXT,
    reasoning INTEGER,
    input_types TEXT,
    cost TEXT,
    context_window INTEGER,
    max_tokens INTEGER,
    headers TEXT,
    compat TEXT,
    UNIQUE(provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS model_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL,
    override_data TEXT NOT NULL,
    UNIQUE(provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_provider TEXT,
    default_model TEXT,
    default_thinking_level TEXT,
    hide_thinking_block INTEGER,
    thinking_budgets TEXT,
    model_roles TEXT,
    retry_fallback_chains TEXT,
    updated_at TEXT
);
