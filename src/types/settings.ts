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

export interface ModelRoles {
  default: RoleConfig;
  smol?: RoleConfig;
  slow?: RoleConfig;
  plan?: RoleConfig;
  commit?: RoleConfig;
  paths?: Record<string, Record<string, RoleConfig>>;
}

export interface RoleConfig {
  provider: string;
  model: string;
}

export interface RetryConfig {
  fallbackChains: Record<string, FallbackItem[]>;
}

export interface FallbackItem {
  provider: string;
  model: string;
}
