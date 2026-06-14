import type { ApiType, ModelDefinition, ProviderConfig } from "@/types/provider";

export type ProviderLogoConfig = { icon: string; color: string; label: string };

const model = (
  id: string,
  name = id,
  contextWindow = 200_000,
  maxTokens = 32_768,
  reasoning = true,
  input: ("text" | "image")[] = ["text"],
): ModelDefinition => ({
  id,
  name,
  reasoning,
  input,
  contextWindow,
  maxTokens,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
});

const preset = (
  id: string,
  name: string,
  baseUrl: string,
  models: ModelDefinition[],
  api: ApiType = "openai-completions",
): ProviderConfig => ({
  id,
  name,
  enabled: false,
  isBuiltIn: false,
  api,
  auth: "apiKey",
  baseUrl,
  models,
});

const gpt55 = model("gpt-5.5", "GPT-5.5", 400_000, 128_000, true, ["text", "image"]);
const claudeSonnet = model("claude-sonnet-4-6", "Claude Sonnet 4.6", 200_000, 32_000, true, ["text", "image"]);
const claudeOpus = model("claude-opus-4-8", "Claude Opus 4.8", 200_000, 32_000, true, ["text", "image"]);

export const FEATURED_PROVIDER_PRESETS: ProviderConfig[] = [
  preset("shengsuanyun", "胜算云", "https://router.shengsuanyun.com/api/v1", [model("anthropic/claude-opus-4.8", "Claude Opus 4.8"), model("anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6"), model("openai/gpt-5.5", "GPT-5.5", 128_000), model("deepseek-v4-pro", "DeepSeek V4 Pro", 1_000_000), model("google/gemini-3.5-flash", "Gemini 3.5 Flash", 1_000_000)], "anthropic-messages"),
  preset("huoshan-agentplan", "火山Agentplan", "https://ark.cn-beijing.volces.com/api/coding/v3", [model("doubao-seed-2-0-pro", "Doubao Seed 2.0 Pro", 256_000), model("doubao-seed-2-0-lite", "Doubao Seed 2.0 Lite", 128_000), model("ark-code-latest", "Ark Code Latest"), model("doubao-seed-1-6", "Doubao Seed 1.6", 256_000), model("doubao-seed-1-6-flash", "Doubao Seed 1.6 Flash", 256_000)]),
  preset("huoshan-coding-plan", "火山方舟 Coding Plan", "https://ark.cn-beijing.volces.com/api/coding/v3", [model("doubao-seed-2-0-pro", "Doubao Seed 2.0 Pro", 256_000), model("doubao-seed-2-0-lite", "Doubao Seed 2.0 Lite", 128_000), model("ark-code-latest", "Ark Code Latest"), model("doubao-seed-1-6", "Doubao Seed 1.6", 256_000), model("doubao-seed-1-6-flash", "Doubao Seed 1.6 Flash", 256_000)], "anthropic-messages"),
  preset("byteplus", "BytePlus", "https://ark.ap-southeast.bytepluses.com/api/coding/v3", [model("doubao-seed-2-0-pro", "Doubao Seed 2.0 Pro", 256_000), model("doubao-seed-2-0-lite", "Doubao Seed 2.0 Lite", 128_000), model("ark-code-latest", "Ark Code Latest"), model("doubao-seed-1-6", "Doubao Seed 1.6", 256_000), model("doubao-seed-1-6-flash", "Doubao Seed 1.6 Flash", 256_000)]),
  preset("doubao-seed", "DouBaoSeed", "https://ark.cn-beijing.volces.com/api/v3", [model("doubao-seed-2-0-pro", "Doubao Seed 2.0 Pro", 256_000), model("doubao-seed-2-0-lite", "Doubao Seed 2.0 Lite", 128_000), model("doubao-seed-2-0-code-preview-latest", "Doubao Seed 2.0 Code Preview"), model("doubao-seed-1-6", "Doubao Seed 1.6", 256_000), model("doubao-seed-1-6-flash", "Doubao Seed 1.6 Flash", 256_000)]),
  preset("deepseek", "DeepSeek", "https://api.deepseek.com/v1", [model("deepseek-v4-pro", "DeepSeek V4 Pro", 1_000_000, 384_000), model("deepseek-v4-flash", "DeepSeek V4 Flash", 1_000_000, 384_000), model("deepseek-v3.2", "DeepSeek V3.2", 128_000)]),
  preset("zhipu-glm", "Zhipu GLM", "https://open.bigmodel.cn/api/coding/paas/v4", [model("glm-5.1", "GLM-5.1", 202_752, 16_384), model("glm-5", "GLM-5", 200_000), model("glm-5-turbo", "GLM-5 Turbo", 200_000)]),
  preset("zhipu-glm-en", "Zhipu GLM en", "https://api.z.ai/api/coding/paas/v4", [model("glm-5.1", "GLM-5.1", 202_752, 16_384), model("glm-5", "GLM-5", 200_000), model("glm-5-turbo", "GLM-5 Turbo", 200_000)]),
  preset("bailian", "Bailian", "https://dashscope.aliyuncs.com/compatible-mode/v1", [model("qwen3.7-max", "Qwen3.7 Max", 262_144, 32_768), model("qwen3-coder-next", "Qwen3 Coder Next", 262_144, 32_768), model("qwen3-coder-plus", "Qwen3 Coder Plus", 262_144, 32_768), model("qwen3-max", "Qwen3 Max", 262_144, 32_768), model("qwen3.7-plus", "Qwen3.7 Plus", 262_144, 32_768)]),
  preset("bailian-token-plan", "Bailian Token Plan", "https://token-plan.ap-southeast-1.maas.aliyuncs.com/apps/anthropic/v1", [model("qwen3.7-max", "Qwen3.7 Max", 262_144, 32_768), model("qwen3.7-plus", "Qwen3.7 Plus", 262_144, 32_768), model("deepseek-v4-pro", "DeepSeek V4 Pro", 1_000_000, 384_000), model("kimi-k2.6", "Kimi K2.6", 256_000, 32_768), model("glm-5.1", "GLM-5.1", 202_752, 16_384), model("MiniMax-M2.5", "MiniMax M2.5")], "anthropic-messages"),
  preset("bailian-coding-plan", "Bailian Coding Plan", "https://coding-intl.dashscope-intl.aliyuncs.com/apps/anthropic/v1", [model("qwen3.7-max", "Qwen3.7 Max", 262_144, 32_768), model("qwen3.7-plus", "Qwen3.7 Plus", 262_144, 32_768), model("qwen3-coder-next", "Qwen3 Coder Next", 262_144, 32_768), model("qwen3-coder-plus", "Qwen3 Coder Plus", 262_144, 32_768), model("MiniMax-M2.5", "MiniMax M2.5"), model("glm-5", "GLM-5"), model("kimi-k2.5", "Kimi K2.5")], "anthropic-messages"),
  preset("kimi-k26", "Kimi k2.6", "https://api.moonshot.cn/v1", [model("kimi-k2.7-code", "Kimi K2.7 Code", 256_000, 32_768, true, ["text", "image"]), model("kimi-k2.6", "Kimi K2.6", 256_000, 32_768, true, ["text", "image"]), model("kimi-k2.5", "Kimi K2.5", 256_000, 32_768, true, ["text", "image"])]),
  preset("kimi-for-coding", "Kimi For Coding", "https://api.kimi.com/coding/v1", [model("kimi-k2.7-code", "Kimi K2.7 Code", 256_000, 32_768), model("kimi-for-coding", "Kimi For Coding", 256_000, 32_768), model("kimi-k2.6", "Kimi K2.6", 256_000, 32_768), model("kimi-k2.5", "Kimi K2.5", 256_000, 32_768)]),
  preset("stepfun", "StepFun", "https://api.stepfun.com/v1", [model("step-3.7-flash", "Step 3.7 Flash", 256_000, 16_000), model("step-3.5-flash", "Step 3.5 Flash", 128_000, 16_000), model("step-3.5-flash-2603", "Step 3.5 Flash 2603", 128_000, 16_000)]),
  preset("stepfun-en", "StepFun en", "https://api.stepfun.ai/v1", [model("step-3.7-flash", "Step 3.7 Flash", 256_000, 16_000), model("step-3.5-flash", "Step 3.5 Flash", 128_000, 16_000), model("step-3.5-flash-2603", "Step 3.5 Flash 2603", 128_000, 16_000)]),
  preset("stepfun-step-plan", "StepFun Step Plan", "https://api.stepfun.com/step_plan/v1", [model("step-3.7-flash", "Step 3.7 Flash", 256_000, 16_000), model("step-3.5-flash-2603", "Step 3.5 Flash 2603", 128_000, 16_000), model("step-3.5-flash", "Step 3.5 Flash", 128_000, 16_000)]),
  preset("modelscope", "ModelScope", "https://api-inference.modelscope.cn/v1", [model("ZhipuAI/GLM-5.1", "GLM-5.1"), model("Qwen/Qwen3-Coder-480B-A35B-Instruct", "Qwen3 Coder", 256_000), model("deepseek-ai/DeepSeek-V4-Pro", "DeepSeek V4 Pro", 1_000_000), model("inclusionAI/Ling-2.6-1T", "Ling 2.6 1T", 262_000)]),
  preset("kat-coder", "KAT-Coder", "https://vanchin.streamlake.ai/api/gateway/v1/endpoints/${ENDPOINT_ID}/openai", [model("KAT-Coder-Pro-V2", "KAT-Coder Pro V2", 256_000, 81_920), model("KAT-Coder-Pro-V1", "KAT-Coder Pro V1", 256_000, 81_920), model("KAT-Coder-Air-V1", "KAT-Coder Air V1", 128_000, 32_768)]),
  preset("longcat", "Longcat", "https://api.longcat.chat/v1", [model("LongCat-Flash-Chat", "LongCat Flash Chat", 128_000, 16_384), model("LongCat-Flash-Omni", "LongCat Flash Omni", 256_000), model("LongCat-Next", "LongCat Next", 256_000)]),
  preset("minimax", "MiniMax", "https://api.minimaxi.com/v1", [model("MiniMax-M3", "MiniMax M3", 1_000_000, 32_768, true, ["text", "image"]), model("MiniMax-M2.7", "MiniMax M2.7"), model("MiniMax-M2.7-highspeed", "MiniMax M2.7 Highspeed", 204_800), model("MiniMax-M2.5", "MiniMax M2.5"), model("MiniMax-M2.5-highspeed", "MiniMax M2.5 Highspeed", 204_800)]),
  preset("minimax-en", "MiniMax en", "https://api.minimax.io/v1", [model("MiniMax-M3", "MiniMax M3", 1_000_000, 32_768, true, ["text", "image"]), model("MiniMax-M2.7", "MiniMax M2.7"), model("MiniMax-M2.7-highspeed", "MiniMax M2.7 Highspeed", 204_800), model("MiniMax-M2.5", "MiniMax M2.5"), model("MiniMax-M2.5-highspeed", "MiniMax M2.5 Highspeed", 204_800)]),
  preset("bailing", "BaiLing", "https://api.tbox.cn/v1", [model("Ling-2.6-1T", "Ling 2.6 1T", 262_000), model("Ling-2.6-Flash", "Ling 2.6 Flash", 262_000), model("Ring-2.6-1T", "Ring 2.6 1T", 262_000)]),
  preset("xiaomi-mimo", "Xiaomi MiMo", "https://api.xiaomimimo.com/v1", [model("mimo-v2.5-pro", "MiMo V2.5 Pro"), model("mimo-v2.5", "MiMo V2.5"), model("mimo-v2-flash", "MiMo V2 Flash", 256_000)]),
  preset("xiaomi-mimo-token-plan-cn", "Xiaomi MiMo Token Plan (China)", "https://token-plan-cn.xiaomimimo.com/v1", [model("mimo-v2.5-pro", "MiMo V2.5 Pro"), model("mimo-v2.5", "MiMo V2.5"), model("mimo-v2-flash", "MiMo V2 Flash", 256_000)]),
  preset("aihubmix", "AiHubMix", "https://aihubmix.com/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("dmxapi", "DMXAPI", "https://www.dmxapi.cn/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("openrouter", "OpenRouter", "https://openrouter.ai/api/v1", [model("anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6"), model("anthropic/claude-opus-4.8", "Claude Opus 4.8"), model("openai/gpt-5.5", "GPT-5.5")]),
  preset("therouter", "TheRouter", "https://api.therouter.ai/v1", [model("anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6"), model("openai/gpt-5.3-codex", "GPT-5.3 Codex"), model("openai/gpt-5.2", "GPT-5.2"), model("google/gemini-3.5-flash", "Gemini 3.5 Flash"), model("qwen/qwen3-coder-480b", "Qwen3 Coder 480B")]),
  preset("novita-ai", "Novita AI", "https://api.novita.ai/openai/v1", [model("zai-org/glm-5.1", "GLM-5.1")]),
  preset("nvidia", "Nvidia", "https://integrate.api.nvidia.com/v1", [model("moonshotai/kimi-k2.5", "Kimi K2.5")]),
  preset("pipellm", "PIPELLM", "https://cc-api.pipellm.ai/v1", [gpt55, claudeOpus, claudeSonnet, model("claude-haiku-4-5-20251001", "Claude Haiku 4.5")]),
  preset("packycode", "PackyCode", "https://www.packyapi.com/v1", [model("claude-sonnet-4-6", "Claude Sonnet 4.6"), model("claude-opus-4-8", "Claude Opus 4.8")]),
  preset("apikey-fun", "APIKEY.FUN", "https://api.apikey.fun/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("apinebula", "APINebula", "https://apinebula.com/v1", [gpt55]),
  preset("atlascloud", "AtlasCloud", "https://api.atlascloud.ai/v1", [model("zai-org/glm-5.1", "GLM-5.1")]),
  preset("sudocode", "SudoCode", "https://sudocode.us/v1", [gpt55]),
  preset("cubence", "Cubence", "https://api.cubence.com/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("aigocode", "AIGoCode", "https://api.aigocode.com", [gpt55, claudeSonnet, claudeOpus]),
  preset("rightcode", "RightCode", "https://right.codes/codex/v1", [gpt55]),
  preset("aicodemirror", "AICodeMirror", "https://api.aicodemirror.com/api/codex/backend-api/codex", [gpt55]),
  preset("claudecn", "ClaudeCN", "https://claudecn.top/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("runapi", "RunAPI", "https://runapi.co/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("crazyrouter", "CrazyRouter", "https://cn.crazyrouter.com/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("sssaicode", "SSSAiCode", "https://node-hk.sssaicodeapi.com/api/v1", [gpt55, claudeSonnet, claudeOpus]),
  preset("micu", "Micu", "https://www.micuapi.ai/v1", [gpt55, claudeOpus, claudeSonnet]),
  preset("ctok-ai", "CTok.ai", "https://api.ctok.ai/v1", [gpt55, claudeOpus, claudeSonnet]),
  preset("e-flowcode", "E-FlowCode", "https://e-flowcode.cc/v1", [model("gpt-5.2-codex", "GPT-5.2 Codex"), model("gpt-5.3-codex", "GPT-5.3 Codex")]),
  preset("lemondata", "LemonData", "https://api.lemondata.cc/v1", [gpt55]),
  preset("baidu-qianfan-coding", "Baidu Qianfan Coding Plan", "https://qianfan.baidubce.com/v2/coding", [model("qianfan-code-latest", "Qianfan Code Latest")]),
  preset("siliconflow", "SiliconFlow", "https://api.siliconflow.cn/v1", [model("deepseek-ai/DeepSeek-V4-Pro", "DeepSeek V4 Pro", 1_000_000), model("deepseek-ai/DeepSeek-V3.2", "DeepSeek V3.2"), model("Qwen/Qwen3-Coder-480B-A35B-Instruct", "Qwen3 Coder"), model("zai-org/GLM-5.1", "GLM-5.1", 200_000), model("Qwen/Qwen3.6-35B-A3B", "Qwen3.6 35B A3B", 262_000)]),
  preset("openai", "OpenAI", "https://api.openai.com/v1", [gpt55, model("gpt-5.4-mini", "GPT-5.4 Mini", 400_000, 128_000, true, ["text", "image"])], "openai-responses"),
  preset("anthropic", "Anthropic", "https://api.anthropic.com", [claudeOpus, claudeSonnet], "anthropic-messages"),
  preset("google-gemini", "Google Gemini", "https://generativelanguage.googleapis.com/v1beta", [model("gemini-3-pro", "Gemini 3 Pro", 1_000_000, 65_536, true, ["text", "image"]), model("gemini-2.5-flash", "Gemini 2.5 Flash", 1_000_000, 65_536, true, ["text", "image"])], "google-generative-ai"),
  preset("groq", "Groq", "https://api.groq.com/openai/v1", [model("openai/gpt-oss-120b", "GPT OSS 120B", 131_072, 16_384), model("llama-3.3-70b-versatile", "Llama 3.3 70B Versatile", 131_072, 16_384, false)]),
  preset("mistral", "Mistral AI", "https://api.mistral.ai/v1", [model("mistral-large-latest", "Mistral Large", 128_000, 16_384, false), model("codestral-latest", "Codestral", 256_000, 16_384, false)]),
  preset("xai", "xAI", "https://api.x.ai/v1", [model("grok-4", "Grok 4", 256_000, 16_384), model("grok-code-fast-1", "Grok Code Fast 1", 256_000, 16_384)]),
];

const LOGO_ALIASES: Record<string, ProviderLogoConfig> = {
  anthropic: { icon: "anthropic", color: "#D4915D", label: "△" }, claude: { icon: "anthropic", color: "#D4915D", label: "△" }, claudecn: { icon: "anthropic", color: "#D4915D", label: "△" },
  openai: { icon: "openai", color: "#00A67E", label: "◎" }, chatgpt: { icon: "openai", color: "#00A67E", label: "◎" },
  google: { icon: "gemini", color: "#4285F4", label: "✦" }, gemini: { icon: "gemini", color: "#4285F4", label: "✦" },
  github: { icon: "github", color: "#000000", label: "GH" }, copilot: { icon: "github", color: "#000000", label: "GH" },
  shengsuanyun: { icon: "shengsuanyun", color: "#0EA5E9", label: "胜" }, deepseek: { icon: "deepseek", color: "#4D6BFE", label: "DS" }, kimi: { icon: "kimi", color: "#6366F1", label: "K" }, moonshot: { icon: "kimi", color: "#6366F1", label: "K" },
  qwen: { icon: "qwen", color: "#615CED", label: "Q" }, dashscope: { icon: "qwen", color: "#615CED", label: "Q" }, bailian: { icon: "qwen", color: "#615CED", label: "Q" }, alibaba: { icon: "qwen", color: "#615CED", label: "Q" },
  stepfun: { icon: "stepfun", color: "#00A3FF", label: "S" }, zhipu: { icon: "zhipu", color: "#1E50FF", label: "GLM" }, glm: { icon: "zhipu", color: "#1E50FF", label: "GLM" }, "z-ai": { icon: "zhipu", color: "#1E50FF", label: "GLM" },
  minimax: { icon: "minimax", color: "#111827", label: "MM" }, qianfan: { icon: "baidu", color: "#2932E1", label: "千" }, baidu: { icon: "baidu", color: "#2932E1", label: "千" },
  doubao: { icon: "doubao", color: "#7C3AED", label: "豆" }, volcano: { icon: "doubao", color: "#7C3AED", label: "豆" }, volcengine: { icon: "doubao", color: "#7C3AED", label: "豆" }, ark: { icon: "doubao", color: "#7C3AED", label: "豆" }, huoshan: { icon: "doubao", color: "#7C3AED", label: "火" }, byteplus: { icon: "byteplus", color: "#111827", label: "BP" },
  modelscope: { icon: "modelscope", color: "#624AFF", label: "MS" }, kat: { icon: "kat", color: "#F97316", label: "KAT" }, longcat: { icon: "longcat", color: "#F59E0B", label: "LC" }, bailing: { icon: "bailing", color: "#0F766E", label: "百" }, xiaomi: { icon: "mimo", color: "#FF6900", label: "MI" }, mimo: { icon: "mimo", color: "#FF6900", label: "MI" },
  aihubmix: { icon: "aihubmix", color: "#10B981", label: "AI" }, dmxapi: { icon: "dmxapi", color: "#8B5CF6", label: "DMX" }, openrouter: { icon: "openrouter", color: "#111827", label: "OR" }, therouter: { icon: "therouter", color: "#111827", label: "TR" }, novita: { icon: "novita", color: "#6366F1", label: "N" }, nvidia: { icon: "nvidia", color: "#76B900", label: "NV" },
  pipellm: { icon: "pipellm", color: "#0EA5E9", label: "P" }, packycode: { icon: "packycode", color: "#14B8A6", label: "PC" }, apikey: { icon: "apikey", color: "#F59E0B", label: "KEY" }, apinebula: { icon: "apinebula", color: "#7C3AED", label: "AN" }, atlascloud: { icon: "atlascloud", color: "#2563EB", label: "AC" }, sudocode: { icon: "sudocode", color: "#111827", label: "SC" }, cubence: { icon: "cubence", color: "#9333EA", label: "C" }, aigocode: { icon: "aigocode", color: "#06B6D4", label: "AG" }, rightcode: { icon: "rightcode", color: "#0F172A", label: "RC" }, aicodemirror: { icon: "aicodemirror", color: "#0891B2", label: "CM" }, runapi: { icon: "runapi", color: "#16A34A", label: "RA" }, crazyrouter: { icon: "crazyrouter", color: "#DC2626", label: "CR" }, sssaicode: { icon: "sssaicode", color: "#4F46E5", label: "SSS" }, micu: { icon: "micu", color: "#DB2777", label: "M" }, ctok: { icon: "ctok", color: "#0D9488", label: "CT" }, "e-flowcode": { icon: "eflowcode", color: "#06B6D4", label: "EF" }, lemondata: { icon: "lemondata", color: "#EAB308", label: "L" },
  siliconflow: { icon: "siliconflow", color: "#16A34A", label: "SF" }, groq: { icon: "groq", color: "#F55036", label: "G" }, mistral: { icon: "mistral", color: "#FF7000", label: "M" }, xai: { icon: "xai", color: "#000000", label: "xAI" }, azure: { icon: "azure", color: "#0078D4", label: "AZ" },
};

export function getProviderLogo(provider: { id?: string; name?: string; api?: string; baseUrl?: string }): ProviderLogoConfig | null {
  const source = `${provider.id ?? ""} ${provider.name ?? ""} ${provider.api ?? ""} ${provider.baseUrl ?? ""}`.toLowerCase();
  if (source.includes("byteplus") || source.includes("bytepluses")) return LOGO_ALIASES.byteplus;
  if (source.includes("huoshan") || source.includes("volces") || source.includes("volcengine")) return LOGO_ALIASES.huoshan;
  const presetMatch = FEATURED_PROVIDER_PRESETS.find((p) => source.includes(p.id.toLowerCase()) || source.includes(p.name.toLowerCase()));
  const expandedSource = `${source} ${presetMatch?.id ?? ""} ${presetMatch?.name ?? ""}`.toLowerCase();
  const key = Object.keys(LOGO_ALIASES).find((candidate) => expandedSource.includes(candidate));
  return key ? LOGO_ALIASES[key] : null;
}
