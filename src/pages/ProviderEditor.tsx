import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Plus, Star, FileText, Server } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ProviderConfig, ModelDefinition } from "@/types/provider";
import ProviderBasicForm from "@/components/ProviderEditor/ProviderBasicForm";
import ModelList from "@/components/ProviderEditor/ModelList";
import ModelEditorDialog from "@/components/ProviderEditor/ModelEditorDialog";
import { useI18n } from "@/lib/i18n";

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9-]+$/;

const model = (id: string, name: string, contextWindow: number, maxTokens: number, reasoning = false, input: ("text" | "image")[] = ["text"]): ModelDefinition => ({
  id,
  name,
  reasoning,
  input,
  contextWindow,
  maxTokens,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
});

const FEATURED_PRESETS: ProviderConfig[] = [
  { id: "deepseek", name: "DeepSeek", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://api.deepseek.com", models: [model("deepseek-v4-pro", "DeepSeek V4 Pro", 1_000_000, 384_000, true), model("deepseek-v4-flash", "DeepSeek V4 Flash", 1_000_000, 384_000, true)] },
  { id: "kimi", name: "Kimi K2.6", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://api.moonshot.ai/v1", models: [model("kimi-k2.6", "Kimi K2.6", 256_000, 32_768, true, ["text", "image"]), model("kimi-k2.5", "Kimi K2.5", 256_000, 32_768, true, ["text", "image"])] },
  { id: "stepfun", name: "StepFun", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://api.stepfun.ai/v1", models: [model("step-3.7-flash", "Step 3.7 Flash", 128_000, 16_000, true, ["text", "image"]), model("step-3.5-flash", "Step 3.5 Flash", 128_000, 16_000, true)] },
  { id: "z-ai", name: "Zhipu GLM", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://api.z.ai/api/paas/v4", models: [model("glm-4.5", "GLM-4.5", 128_000, 16_000, true), model("glm-4.5-air", "GLM-4.5 Air", 128_000, 16_000, true)] },
  { id: "qwen", name: "Qwen / DashScope", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", models: [model("qwen3-max", "Qwen3 Max", 262_144, 32_768, true), model("qwen3-coder-plus", "Qwen3 Coder Plus", 262_144, 32_768, true), model("qwen3-coder-flash", "Qwen3 Coder Flash", 262_144, 32_768, true)] },
  { id: "minimax", name: "MiniMax", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://api.minimax.io/v1", models: [model("MiniMax-M3", "MiniMax M3", 1_000_000, 32_768, true, ["text", "image"]), model("MiniMax-M2.7-highspeed", "MiniMax M2.7 Highspeed", 204_800, 32_768, true)] },
  { id: "openai", name: "OpenAI", enabled: false, isBuiltIn: false, api: "openai-responses", auth: "apiKey", baseUrl: "https://api.openai.com/v1", models: [model("gpt-5.5", "GPT-5.5", 400_000, 128_000, true, ["text", "image"]), model("gpt-5.4-mini", "GPT-5.4 Mini", 400_000, 128_000, true, ["text", "image"])] },
  { id: "anthropic", name: "Anthropic", enabled: false, isBuiltIn: false, api: "anthropic-messages", auth: "apiKey", baseUrl: "https://api.anthropic.com", models: [model("claude-opus-4-8", "Claude Opus 4.8", 200_000, 32_000, true, ["text", "image"]), model("claude-sonnet-4-6", "Claude Sonnet 4.6", 200_000, 32_000, true, ["text", "image"])] },
  { id: "openrouter", name: "OpenRouter", enabled: false, isBuiltIn: false, api: "openai-completions", auth: "apiKey", baseUrl: "https://openrouter.ai/api/v1", models: [model("openai/gpt-5.5", "OpenAI GPT-5.5", 400_000, 128_000, true, ["text", "image"]), model("anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6", 200_000, 32_000, true, ["text", "image"])] },
];

const scalarToYaml = (value: unknown) => {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  return JSON.stringify(value);
};

function toProviderYaml(value: unknown, depth = 0): string {
  const indent = "  ".repeat(depth);
  if (Array.isArray(value)) {
    return value.map((item) => item && typeof item === "object" ? `${indent}-\n${toProviderYaml(item, depth + 1)}` : `${indent}- ${scalarToYaml(item)}`).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => v && typeof v === "object" ? `${indent}${k}:\n${toProviderYaml(v, depth + 1)}` : `${indent}${k}: ${scalarToYaml(v)}`)
      .join("\n");
  }
  return `${indent}${scalarToYaml(value)}`;
}

const countIndent = (line: string) => line.match(/^ */)?.[0].length ?? 0;
const parseScalar = (value: string): unknown => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return JSON.parse(value.replace(/^'/, '"').replace(/'$/, '"'));
  return value;
};

function parseYamlBlock(lines: string[], start: number, indent: number): [unknown, number] {
  if (start >= lines.length) return [{}, start];
  const first = lines[start].slice(indent).trimStart();
  if (first.startsWith("-")) {
    const result: unknown[] = [];
    let i = start;
    while (i < lines.length && countIndent(lines[i]) === indent && lines[i].slice(indent).trimStart().startsWith("-")) {
      const rest = lines[i].slice(indent).trimStart().slice(1).trim();
      if (rest) {
        result.push(parseScalar(rest));
        i += 1;
      } else {
        const [value, next] = parseYamlBlock(lines, i + 1, indent + 2);
        result.push(value);
        i = next;
      }
    }
    return [result, i];
  }

  const result: Record<string, unknown> = {};
  let i = start;
  while (i < lines.length && countIndent(lines[i]) === indent) {
    const trimmed = lines[i].slice(indent);
    const colon = trimmed.indexOf(":");
    if (colon < 0) throw new Error(`invalid line: ${trimmed}`);
    const key = trimmed.slice(0, colon).trim();
    const rest = trimmed.slice(colon + 1).trim();
    if (rest) {
      result[key] = parseScalar(rest);
      i += 1;
    } else {
      const [value, next] = parseYamlBlock(lines, i + 1, indent + 2);
      result[key] = value;
      i = next;
    }
  }
  return [result, i];
}

function parseProviderYaml(text: string): ProviderConfig {
  const lines = text.split("\n").filter((line) => line.trim() && !line.trimStart().startsWith("#"));
  const [value] = parseYamlBlock(lines, 0, 0);
  return value as ProviderConfig;
}

export default function ProviderEditor() {
  const { t } = useI18n();
  const { saveProvider, providers, fetchProviders, builtinPresets, fetchBuiltinPresets } = useProviderStore();
  const toast = useToastStore();
  const [, setLocation] = useLocation();
  const params = useParams();
  const editId = params.id;
  const isEdit = !!editId;

  const [form, setForm] = useState<ProviderConfig>({
    id: "",
    name: "",
    enabled: false,
    isBuiltIn: false,
    api: "openai-completions",
    auth: "apiKey",
    models: [],
  });
  const [editingModelIdx, setEditingModelIdx] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preset/model selection for add mode
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [nameTouched, setNameTouched] = useState(false);
  const [configText, setConfigText] = useState(toProviderYaml(form));
  const [configError, setConfigError] = useState<string | null>(null);

  const visibleBuiltinPresets = builtinPresets.filter((p) => {
    const haystack = `${p.id} ${p.name}`.toLowerCase();
    return !haystack.includes("oh-my-opencode") && !haystack.includes("opencode");
  });
  const presetOptions = [...FEATURED_PRESETS, ...visibleBuiltinPresets.filter((p) => !FEATURED_PRESETS.some((fp) => fp.id === p.id))];

  useEffect(() => {
    if (isEdit) {
      const existing = providers.find((p) => p.id === editId);
      if (existing) {
        setForm(existing);
      } else {
        fetchProviders();
      }
    } else {
      fetchBuiltinPresets();
    }
  }, [isEdit, editId, providers, fetchProviders, fetchBuiltinPresets]);

  const validateForm = (target = form): string | null => {
    if (!target.id.trim()) return t("providerIdRequired");
    if (!PROVIDER_ID_PATTERN.test(target.id.trim())) return t("providerIdInvalid");
    if (!target.name.trim()) return t("providerNameRequired");
    if (!target.api) return t("apiFormatRequired");
    return null;
  };

  const handleFormChange = (next: ProviderConfig) => {
    const idChanged = next.id !== form.id;
    const nameChanged = next.name !== form.name;
    const touched = nameTouched || (nameChanged && !idChanged);
    setNameTouched(touched);
    updateForm({
      ...next,
      name: idChanged && !touched ? next.id : next.name,
    });
  };

  const updateForm = (next: ProviderConfig) => {
    setForm(next);
    setConfigError(null);
    setConfigText(toProviderYaml(next));
  };

  const parseConfigText = (): ProviderConfig | null => {
    try {
      const parsed = parseProviderYaml(configText);
      return {
        ...parsed,
        enabled: Boolean(parsed.enabled),
        isBuiltIn: Boolean(parsed.isBuiltIn),
        models: Array.isArray(parsed.models) ? parsed.models : [],
      };
    } catch (err) {
      setConfigError(t("yamlParseFailed", { error: err instanceof Error ? err.message : String(err) }));
      return null;
    }
  };

  const applyConfigText = () => {
    const parsed = parseConfigText();
    if (!parsed) return false;
    updateForm(parsed);
    return true;
  };

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);

    if (!presetId) {
      updateForm({
        id: "",
        name: "",
        enabled: false,
        isBuiltIn: false,
        api: "openai-completions",
        auth: "apiKey",
        models: [],
      });
      return;
    }

    if (presetId === "openai-compatible") {
      updateForm({ ...form, api: "openai-completions" });
      return;
    }

    const preset = presetOptions.find((p) => p.id === presetId);
    if (!preset) return;

    const replacePresetIdentity = !form.id || form.id === selectedPresetId;
    const nextId = replacePresetIdentity ? preset.id : form.id;
    updateForm({
      ...form,
      id: nextId,
      name: replacePresetIdentity ? (preset.name || nextId) : (nameTouched && form.name ? form.name : form.name || nextId),
      api: preset.api ?? "openai-completions",
      baseUrl: preset.baseUrl || form.baseUrl,
      auth: preset.auth ?? form.auth,
      apiKey: form.apiKey,
      enabled: false,
      isBuiltIn: false,
      models: preset.models ? [...preset.models] : [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitForm = configText === toProviderYaml(form) ? form : parseConfigText();
    if (!submitForm) return;
    const validationError = validateForm(submitForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await saveProvider(submitForm);
      toast.show(isEdit ? t("updateSuccess") : t("saveSuccess"), "success");
      setLocation("/");
    } catch (err) {
      setError(String(err));
      toast.show(t("saveFailedShort"), "error");
    }
  };

  const models = form.models ?? [];

  const startAddModel = () => {
    setEditingModelIdx("new");
  };

  const startEditModel = (idx: number) => {
    setEditingModelIdx(idx);
  };

  const saveModel = (model: ModelDefinition) => {
    const next = [...models];
    if (editingModelIdx === "new") {
      next.push(model);
    } else if (typeof editingModelIdx === "number") {
      next[editingModelIdx] = model;
    }
    updateForm({ ...form, models: next });
    setEditingModelIdx(null);
  };

  const deleteModel = (idx: number) => {
    const next = [...models];
    next.splice(idx, 1);
    updateForm({ ...form, models: next });
  };

  useKeyboardShortcuts({
    onEscape: () => {
      if (editingModelIdx !== null) {
        setEditingModelIdx(null);
      }
    },
    onSave: () => {
      const formEl = document.querySelector("form");
      if (formEl) formEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    },
  }, [editingModelIdx]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
        <button
          onClick={() => setLocation("/")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#222] px-3 py-2 text-xs text-muted-foreground transition duration-200 hover:border-[#1db7f7]/60 hover:bg-[#111] hover:text-white"
          aria-label={t("back")}
        >
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1db7f7]">Provider</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{isEdit ? `${t("editProvider")} ${form.name}` : t("addProvider")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("providerSubtitle")}</p>
        </div>
        <div className="rounded-3xl border border-[#222] bg-[#050505] p-4 text-right">
          <div className="font-mono text-2xl font-semibold text-white">{models.length}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("modelConfig")}</div>
        </div>
      </div>

      {error && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"><span className="font-medium">{t("error")}:</span> {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {!isEdit && (
          <section className="rounded-3xl border border-transparent bg-[linear-gradient(#050505,#050505)_padding-box,linear-gradient(90deg,#222,#222)_border-box] p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">{t("selectPreset")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("selectPresetHint")}</p>
            </div>
            <div data-testid="preset-grid" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                data-testid="preset-card-custom"
                onClick={() => applyPreset("")}
                className={`group text-left rounded-3xl border p-4 transition duration-300 ${!selectedPresetId ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-[#1f1f1f] text-muted-foreground hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"}`}
              >
                <div className="font-medium">{t("manualConfig")}</div>
                <div className="mt-1 text-xs opacity-70">{t("manualConfigHint")}</div>
              </button>
              {presetOptions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`preset-card-${preset.id}`}
                  onClick={() => applyPreset(preset.id)}
                  className={`group text-left rounded-3xl border p-4 transition duration-300 ${selectedPresetId === preset.id ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-[#1f1f1f] text-muted-foreground hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{preset.name}</span>
                    {FEATURED_PRESETS.some((p) => p.id === preset.id) && <Star className="h-4 w-4 shrink-0 text-white" />}
                  </div>
                  <div className="mt-1 truncate text-xs opacity-70">{preset.baseUrl || t("localOrAuto")}</div>
                  <div className="mt-2 text-xs opacity-70">{t("presetModelCount", { count: preset.models?.length ?? 0 })}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-transparent bg-[linear-gradient(#050505,#050505)_padding-box,linear-gradient(90deg,#222,#222)_border-box] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="pi-gradient-bg flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_0_32px_rgba(29,183,247,0.18)]"><Server className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t("connection")}</h2>
              <p className="text-sm text-muted-foreground">{t("providerSubtitle")}</p>
            </div>
          </div>
          <ProviderBasicForm form={form} isEdit={isEdit} onChange={handleFormChange} />
        </section>

        {/* Model cards for add mode when preset has models */}
        {!isEdit && selectedPresetId && form.models && form.models.length > 0 && (
          <section className="space-y-3 rounded-3xl border border-[#222] bg-[#050505] p-5 transition duration-200 hover:border-[#1db7f7]/40">
            <div>
              <h2 className="text-sm font-medium text-white">{t("presetModels")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("presetModelsHint")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="preset-model-grid">
              {form.models.map((m) => (
                <div key={m.id} data-testid={`preset-model-card-${m.id}`} className="rounded-2xl border border-[#222] bg-black/40 p-3 transition duration-200 hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)]">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1 break-all">{m.id}</div>
                  <div className="flex flex-wrap gap-1.5 mt-3 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.contextWindow.toLocaleString()} ctx</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.maxTokens.toLocaleString()} out</span>
                    {m.reasoning && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">thinking</span>}
                    {m.input?.includes("image") && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">multimodal</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-[#222] bg-[#050505] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t("modelConfig")}</h2>
            <button
              type="button"
              onClick={startAddModel}
              data-testid="add-model-btn"
              className="inline-flex items-center gap-2 rounded-xl border border-[#222] px-3 py-2 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111]"
            >
              <Plus className="h-3.5 w-3.5" /> {t("addModel")}
            </button>
          </div>

          <ModelList
            models={models}
            onEdit={startEditModel}
            onDelete={deleteModel}
          />
        </section>

        {/* Model Editor Dialog */}
        {editingModelIdx !== null && (
          <ModelEditorDialog
            model={editingModelIdx === "new" ? undefined : models[editingModelIdx]}
            onSave={saveModel}
            onCancel={() => setEditingModelIdx(null)}
          />
        )}

        <section className="space-y-3 rounded-3xl border border-[#222] bg-[#050505] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{t("yamlEditor")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("yamlHint")}</p>
            </div>
            <div className="text-xs px-3 py-1.5 rounded border inline-flex items-center gap-1 bg-primary text-primary-foreground border-primary">
              <FileText className="w-3.5 h-3.5" /> YAML
            </div>
          </div>
          <textarea
            data-testid="provider-config-editor"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            className="min-h-72 w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          />
          {configError && <div className="text-sm text-red-400" data-testid="provider-config-error">{configError}</div>}
          <button
            type="button"
            data-testid="apply-config-editor"
            onClick={applyConfigText}
            className="rounded-xl border border-[#222] px-3 py-2 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111]"
          >
            {t("applyYaml")}
          </button>
        </section>

        <div className="sticky bottom-0 z-20 -mx-6 mt-6 border-t border-[#222] bg-black/85 px-6 py-4 backdrop-blur" data-testid="sticky-save-bar">
          <button
            type="submit"
            data-testid="save-provider-btn"
            className="pi-gradient-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white shadow-[0_0_28px_rgba(29,183,247,0.22)] transition duration-200 hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            {t("saveProvider")}
          </button>
        </div>
      </form>
    </div>
  );
}
