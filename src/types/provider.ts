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
  discovery?: { type: "ollama" | "lm-studio" };
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
    contextOver200k?: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
  };
  contextWindow: number;
  maxTokens: number;
  headers?: Record<string, string>;
  compat?: ModelCompat;
  // OpenAI protocol parameter defaults
  defaultTemperature?: number;
  defaultTopP?: number;
  defaultPresencePenalty?: number;
  defaultFrequencyPenalty?: number;
  defaultSeed?: number;
  // New fields from PRD
  family?: string;
  releaseDate?: string;
  attachment?: boolean;
  temperature?: boolean;
  toolCall?: boolean;
  interleaved?: true | { field: "reasoning_content" | "reasoning_details" };
  status?: "alpha" | "beta" | "deprecated";
  provider?: { npm?: string; api?: string };
  modalities?: {
    input?: string[];
    output?: string[];
  };
  limit?: {
    context?: number;
    input?: number;
    output?: number;
  };
  thinkingLevelMap?: Record<string, string | null>;
  options?: Record<string, unknown>;
  variants?: Record<string, { disabled?: boolean } & Record<string, unknown>>;
  experimental?: boolean | {
    modes?: Record<string, {
      cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
      provider?: { body?: Record<string, unknown>; headers?: Record<string, string> };
    }>;
  };
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
    contextOver200k?: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
  };
  contextWindow?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  compat?: ModelCompat;
  // OpenAI protocol parameter defaults
  defaultTemperature?: number;
  defaultTopP?: number;
  defaultPresencePenalty?: number;
  defaultFrequencyPenalty?: number;
  defaultSeed?: number;
  contextPromotionTarget?: string;
  family?: string;
  releaseDate?: string;
  attachment?: boolean;
  temperature?: boolean;
  toolCall?: boolean;
  interleaved?: true | { field: "reasoning_content" | "reasoning_details" };
  status?: "alpha" | "beta" | "deprecated";
  modalities?: {
    input?: string[];
    output?: string[];
  };
  limit?: {
    context?: number;
    input?: number;
    output?: number;
  };
  thinkingLevelMap?: Record<string, string | null>;
  options?: Record<string, unknown>;
  variants?: Record<string, { disabled?: boolean } & Record<string, unknown>>;
  experimental?: boolean | {
    modes?: Record<string, {
      cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
      provider?: { body?: Record<string, unknown>; headers?: Record<string, string> };
    }>;
  };
}

export interface ModelCompat {
  supportsStore?: boolean;
  supportsDeveloperRole?: boolean;
  supportsReasoningEffort?: boolean;
  maxTokensField?: string;
  openRouterRouting?: Record<string, unknown>;
  vercelGatewayRouting?: Record<string, unknown>;
  extraBody?: Record<string, unknown>;
  // New compat fields from PRD
  supportsUsageInStreaming?: boolean;
  requiresToolResultName?: boolean;
  requiresAssistantAfterToolResult?: boolean;
  requiresThinkingAsText?: boolean;
  requiresReasoningContentOnAssistantMessages?: boolean;
  thinkingFormat?: string;
  cacheControlFormat?: string;
  supportsStrictMode?: boolean;
  supportsLongCacheRetention?: boolean;
  supportsEagerToolInputStreaming?: boolean;
  forceAdaptiveThinking?: boolean;
  allowEmptySignature?: boolean;
  supportsCacheControlOnTools?: boolean;
  sendSessionAffinityHeaders?: boolean;
}
