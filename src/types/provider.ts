export type ApiType =
  | "openai-completions"
  | "openai-responses"
  | "openai-codex-responses"
  | "azure-openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "google-vertex";

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  isBuiltIn: boolean;
  baseUrl?: string;
  apiKey?: string;
  api?: ApiType;
  headers?: Record<string, string>;
  authHeader?: boolean;
  auth?: "apiKey" | "none";
  discovery?: { type: "ollama" | "lmstudio" };
  modelOverrides?: Record<string, ModelOverride>;
  models?: ModelDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  api?: ApiType;
  reasoning: boolean;
  input: ("text" | "image")[];
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number;
  maxTokens: number;
  headers?: Record<string, string>;
  compat?: ModelCompat;
}

export interface ModelOverride {
  name?: string;
  reasoning?: boolean;
  input?: ("text" | "image")[];
  cost?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  compat?: ModelCompat;
  contextPromotionTarget?: string;
}

export interface ModelCompat {
  supportsStore?: boolean;
  supportsDeveloperRole?: boolean;
  supportsReasoningEffort?: boolean;
  maxTokensField?: string;
  openRouterRouting?: Record<string, unknown>;
  vercelGatewayRouting?: Record<string, unknown>;
  extraBody?: Record<string, unknown>;
}
