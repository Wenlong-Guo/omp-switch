import type { ProviderConfig } from "@/types/provider";

const API_TYPES = [
  "openai-completions",
  "openai-responses",
  "openai-codex-responses",
  "azure-openai-responses",
  "anthropic-messages",
  "google-generative-ai",
  "google-vertex",
];

export function validateProviderImport(data: unknown): { valid: true; providers: ProviderConfig[] } | { valid: false; error: string } {
  if (!Array.isArray(data)) {
    return { valid: false, error: "导入数据必须是 Provider 数组" };
  }

  const providers: ProviderConfig[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== "object" || item === null) {
      return { valid: false, error: `第 ${i + 1} 项不是有效的对象` };
    }

    const p = item as Record<string, unknown>;

    if (!p.id || typeof p.id !== "string" || !p.id.trim()) {
      return { valid: false, error: `第 ${i + 1} 项缺少有效的 id` };
    }
    if (!p.name || typeof p.name !== "string" || !p.name.trim()) {
      return { valid: false, error: `第 ${i + 1} 项 (${p.id}) 缺少有效的 name` };
    }
    if (p.api && typeof p.api === "string" && !API_TYPES.includes(p.api)) {
      return { valid: false, error: `第 ${i + 1} 项 (${p.id}) 的 api 类型无效: ${p.api}` };
    }

    providers.push(p as unknown as ProviderConfig);
  }

  return { valid: true, providers };
}
