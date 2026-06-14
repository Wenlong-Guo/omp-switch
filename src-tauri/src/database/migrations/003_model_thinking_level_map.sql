-- 003_model_thinking_level_map.sql: persist omp model thinkingLevelMap

ALTER TABLE provider_models ADD COLUMN thinking_level_map TEXT;
