import type { ModelDefinition } from "@/types/provider";

export interface AttributeMeta {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json' | 'keyvalue' | 'table';
  category: 'basic' | 'capability' | 'cost' | 'compat' | 'advanced';
  defaultValue: unknown;
  required: boolean;
  source: 'pi' | 'opencode' | 'omp-switch';
  options?: string[];
}

export type Category = 'basic' | 'capability' | 'cost' | 'compat' | 'advanced';

export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'] as const;
export const MODALITY_OPTIONS = ['text', 'audio', 'image', 'video', 'pdf'] as const;
export const STATUS_OPTIONS = ['alpha', 'beta', 'deprecated'] as const;
export const API_TYPES = [
  'openai-completions',
  'openai-responses',
  'openai-codex-responses',
  'azure-openai-responses',
  'anthropic-messages',
  'google-generative-ai',
  'google-vertex',
] as const;

const attributes: AttributeMeta[] = [
  // basic
  { key: 'id', label: '模型 ID', type: 'text', category: 'basic', defaultValue: '', required: true, source: 'omp-switch' },
  { key: 'name', label: '模型名称', type: 'text', category: 'basic', defaultValue: '', required: false, source: 'omp-switch' },
  { key: 'api', label: '接口格式', type: 'select', category: 'basic', defaultValue: 'openai-completions', required: false, source: 'omp-switch', options: [...API_TYPES] },
  { key: 'family', label: '模型家族', type: 'text', category: 'basic', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'releaseDate', label: '发布日期', type: 'text', category: 'basic', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'status', label: '状态', type: 'select', category: 'basic', defaultValue: undefined, required: false, source: 'opencode', options: [...STATUS_OPTIONS] },
  { key: 'provider', label: 'Provider 覆盖', type: 'json', category: 'basic', defaultValue: undefined, required: false, source: 'opencode' },

  // capability
  { key: 'reasoning', label: '支持 Reasoning', type: 'boolean', category: 'capability', defaultValue: true, required: false, source: 'omp-switch' },
  { key: 'temperature', label: '支持 Temperature', type: 'boolean', category: 'capability', defaultValue: true, required: false, source: 'opencode' },
  { key: 'toolCall', label: '支持 Tool Call', type: 'boolean', category: 'capability', defaultValue: false, required: false, source: 'opencode' },
  { key: 'attachment', label: '支持附件', type: 'boolean', category: 'capability', defaultValue: false, required: false, source: 'opencode' },
  { key: 'input', label: '输入类型', type: 'multiselect', category: 'capability', defaultValue: ['text', 'image'], required: false, source: 'omp-switch', options: ['text', 'image'] },
  { key: 'modalities', label: '模态', type: 'multiselect', category: 'capability', defaultValue: undefined, required: false, source: 'opencode', options: [...MODALITY_OPTIONS] },
  { key: 'interleaved', label: '交错输出', type: 'json', category: 'capability', defaultValue: undefined, required: false, source: 'opencode' },

  // cost
  { key: 'contextWindow', label: 'Context Window', type: 'number', category: 'cost', defaultValue: 128000, required: false, source: 'omp-switch' },
  { key: 'maxTokens', label: 'Max Tokens', type: 'number', category: 'cost', defaultValue: 16384, required: false, source: 'omp-switch' },
  { key: 'cost', label: '成本', type: 'json', category: 'cost', defaultValue: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, required: false, source: 'omp-switch' },
  { key: 'limit', label: '限制', type: 'json', category: 'cost', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'thinkingLevelMap', label: 'Thinking Level 映射', type: 'table', category: 'cost', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'costContextOver200k', label: '超 200k 成本', type: 'json', category: 'cost', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'defaultTemperature', label: '默认 Temperature (0-2)', type: 'number', category: 'cost', defaultValue: undefined, required: false, source: 'omp-switch' },
  { key: 'defaultTopP', label: '默认 Top P (0-1)', type: 'number', category: 'cost', defaultValue: undefined, required: false, source: 'omp-switch' },
  { key: 'defaultPresencePenalty', label: '默认 Presence Penalty (-2~2)', type: 'number', category: 'cost', defaultValue: undefined, required: false, source: 'omp-switch' },
  { key: 'defaultFrequencyPenalty', label: '默认 Frequency Penalty (-2~2)', type: 'number', category: 'cost', defaultValue: undefined, required: false, source: 'omp-switch' },
  { key: 'defaultSeed', label: '默认 Seed', type: 'number', category: 'cost', defaultValue: undefined, required: false, source: 'omp-switch' },

  // compat (pi)
  { key: 'compat.supportsStore', label: '支持 Store', type: 'boolean', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.supportsDeveloperRole', label: '支持 Developer Role', type: 'boolean', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.supportsReasoningEffort', label: '支持 Reasoning Effort', type: 'boolean', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.supportsUsageInStreaming', label: '支持 Usage In Streaming', type: 'boolean', category: 'compat', defaultValue: true, required: false, source: 'pi' },
  { key: 'compat.maxTokensField', label: 'Max Tokens 字段名', type: 'text', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.requiresToolResultName', label: '需要 Tool Result Name', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.requiresAssistantAfterToolResult', label: 'Tool Result 后需要 Assistant', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.requiresThinkingAsText', label: 'Thinking 转为文本', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.requiresReasoningContentOnAssistantMessages', label: 'Assistant 消息需要 Reasoning Content', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.thinkingFormat', label: 'Thinking 格式', type: 'select', category: 'compat', defaultValue: undefined, required: false, source: 'pi', options: ['reasoning_effort', 'openrouter', 'deepseek', 'together', 'zai', 'qwen', 'qwen-chat-template'] },
  { key: 'compat.cacheControlFormat', label: 'Cache Control 格式', type: 'select', category: 'compat', defaultValue: undefined, required: false, source: 'pi', options: ['anthropic'] },
  { key: 'compat.supportsStrictMode', label: '支持 Strict Mode', type: 'boolean', category: 'compat', defaultValue: true, required: false, source: 'pi' },
  { key: 'compat.supportsLongCacheRetention', label: '支持长缓存保留', type: 'boolean', category: 'compat', defaultValue: true, required: false, source: 'pi' },
  { key: 'compat.supportsEagerToolInputStreaming', label: '支持 Eager Tool Input Streaming', type: 'boolean', category: 'compat', defaultValue: true, required: false, source: 'pi' },
  { key: 'compat.forceAdaptiveThinking', label: '强制 Adaptive Thinking', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.allowEmptySignature', label: '允许空 Signature', type: 'boolean', category: 'compat', defaultValue: false, required: false, source: 'pi' },
  { key: 'compat.supportsCacheControlOnTools', label: '支持 Cache Control On Tools', type: 'boolean', category: 'compat', defaultValue: true, required: false, source: 'pi' },
  { key: 'compat.sendSessionAffinityHeaders', label: '发送 Session Affinity Headers', type: 'boolean', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.openRouterRouting', label: 'OpenRouter 路由', type: 'json', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.vercelGatewayRouting', label: 'Vercel Gateway 路由', type: 'json', category: 'compat', defaultValue: undefined, required: false, source: 'pi' },
  { key: 'compat.extraBody', label: 'Extra Body', type: 'json', category: 'compat', defaultValue: undefined, required: false, source: 'omp-switch' },

  // advanced
  { key: 'options', label: '额外选项', type: 'keyvalue', category: 'advanced', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'variants', label: '变体配置', type: 'keyvalue', category: 'advanced', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'experimental', label: '实验性功能', type: 'json', category: 'advanced', defaultValue: undefined, required: false, source: 'opencode' },
  { key: 'headers', label: '自定义 Headers', type: 'keyvalue', category: 'advanced', defaultValue: undefined, required: false, source: 'pi' },
];

export function getAllAttributes(): AttributeMeta[] {
  return [...attributes];
}

export function getAttributesByCategory(category: Category): AttributeMeta[] {
  return attributes.filter((a) => a.category === category);
}

export function getAttributesBySource(source: 'pi' | 'opencode' | 'omp-switch'): AttributeMeta[] {
  return attributes.filter((a) => a.source === source);
}

export function getAttributeMeta(key: string): AttributeMeta | undefined {
  return attributes.find((a) => a.key === key);
}

export function getDefaultModel(): Partial<ModelDefinition> {
  const result: Record<string, unknown> = {};
  for (const attr of attributes) {
    if (attr.defaultValue !== undefined) {
      const keys = attr.key.split('.');
      let target: Record<string, unknown> = result;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]] as Record<string, unknown>;
      }
      target[keys[keys.length - 1]] = attr.defaultValue;
    }
  }
  return result as Partial<ModelDefinition>;
}

export interface CompatPreset {
  name: string;
  label: string;
  fields: Record<string, boolean | string | Record<string, unknown>>;
}

export const COMPAT_PRESETS: CompatPreset[] = [
  {
    name: 'ollama',
    label: 'Ollama 兼容',
    fields: {
      'compat.supportsDeveloperRole': false,
      'compat.supportsReasoningEffort': false,
      'compat.supportsUsageInStreaming': true,
      'compat.maxTokensField': 'max_tokens',
    },
  },
  {
    name: 'anthropic',
    label: 'Anthropic 兼容',
    fields: {
      'compat.supportsEagerToolInputStreaming': true,
      'compat.supportsLongCacheRetention': true,
      'compat.forceAdaptiveThinking': true,
      'compat.allowEmptySignature': false,
      'compat.supportsCacheControlOnTools': true,
      'compat.sendSessionAffinityHeaders': true,
    },
  },
  {
    name: 'openrouter',
    label: 'OpenRouter 兼容',
    fields: {
      'compat.supportsStore': true,
      'compat.supportsDeveloperRole': true,
      'compat.supportsReasoningEffort': true,
      'compat.thinkingFormat': 'openrouter',
      'compat.openRouterRouting': {},
    },
  },
];

export function applyCompatPreset(presetName: string): Record<string, unknown> | undefined {
  const preset = COMPAT_PRESETS.find((p) => p.name === presetName);
  if (!preset) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(preset.fields)) {
    const keys = key.split('.');
    let target: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = value;
  }
  return result;
}

export function clearCompatPreset(): Record<string, unknown> {
  const compatAttrs = getAttributesByCategory('compat');
  const result: Record<string, unknown> = { compat: {} };
  for (const attr of compatAttrs) {
    if (attr.key.startsWith('compat.')) {
      const key = attr.key.replace('compat.', '');
      (result.compat as Record<string, unknown>)[key] = undefined;
    }
  }
  return result;
}

export function getCategories(): Category[] {
  return ['basic', 'capability', 'cost', 'compat', 'advanced'];
}
