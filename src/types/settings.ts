export interface AppSettings {
  defaultProvider?: string;
  defaultModel?: string;
  defaultThinkingLevel?: ThinkingLevel;
  hideThinkingBlock?: boolean;
  thinkingBudgets?: Record<ThinkingLevel, number>;
  modelRoles?: ModelRoles;
  retry?: RetryConfig;
  theme?: "light" | "dark" | "system";
}

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type ModelRole = "default" | "smol" | "slow" | "plan" | "commit";
export type ModelRoles = Partial<Record<ModelRole, string>>;

export interface RetryConfig {
  fallbackChains: Record<string, FallbackItem[]>;
}

export interface FallbackItem {
  provider: string;
  model: string;
}
