import type { ModelDefinition } from "@/types/provider";

type ModelDefaults = Pick<ModelDefinition, "reasoning" | "input" | "contextWindow" | "maxTokens"> & {
  thinkingLevelMap?: Record<string, string | null>;
};

const KNOWN_MODEL_DEFAULTS: Record<string, ModelDefaults> = {
  "step-3.7-flash": {
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 4096,
    thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "high" },
  },
  "gpt-5.5": {
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 400000,
    maxTokens: 128000,
    thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh" },
  },
  "gpt-5.2": {
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 272000,
    maxTokens: 128000,
    thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh" },
  },
};

export function getModelMetadata(modelId: string): Partial<ModelDefinition> | undefined {
  const id = modelId.trim();
  if (!id) return undefined;
  if (KNOWN_MODEL_DEFAULTS[id]) return KNOWN_MODEL_DEFAULTS[id];
  if (/gpt-5|claude|gemini|grok|raptor/i.test(id)) {
    return {
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 128000,
      maxTokens: 64000,
      thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh" },
    };
  }
  return undefined;
}

export function applyModelMetadata(model: Partial<ModelDefinition>): Partial<ModelDefinition> {
  const metadata = getModelMetadata(model.id ?? "");
  if (!metadata) return model;
  return {
    ...model,
    ...metadata,
    contextWindow: model.contextWindow && model.contextWindow !== 128000 ? model.contextWindow : metadata.contextWindow,
    maxTokens: model.maxTokens && model.maxTokens !== 16384 ? model.maxTokens : metadata.maxTokens,
  };
}
