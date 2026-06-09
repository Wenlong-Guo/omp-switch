-- 002_model_parameters.sql: 添加 OpenAI 协议参数默认值列

ALTER TABLE provider_models ADD COLUMN default_temperature REAL;
ALTER TABLE provider_models ADD COLUMN default_top_p REAL;
ALTER TABLE provider_models ADD COLUMN default_presence_penalty REAL;
ALTER TABLE provider_models ADD COLUMN default_frequency_penalty REAL;
ALTER TABLE provider_models ADD COLUMN default_seed INTEGER;
