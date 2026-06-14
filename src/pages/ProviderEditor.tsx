import { useEffect, useRef, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Plus, FileText, Server } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ProviderConfig, ModelDefinition } from "@/types/provider";
import { invokeCommand } from "@/lib/tauri-api";
import { applyModelMetadata } from "@/lib/modelMetadata";
import ProviderBasicForm from "@/components/ProviderEditor/ProviderBasicForm";
import ModelList from "@/components/ProviderEditor/ModelList";
import ModelEditorDialog from "@/components/ProviderEditor/ModelEditorDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useI18n } from "@/lib/i18n";
import { FEATURED_PROVIDER_PRESETS, getProviderLogo } from "@/lib/providerPresets";
import { getProviderLogoSrc } from "@/lib/providerLogos";

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9-]+$/;

type FetchedModel = { id: string; name?: string };

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
  const [presetModelCandidates, setPresetModelCandidates] = useState<ModelDefinition[]>([]);
  const [selectedPresetModelIds, setSelectedPresetModelIds] = useState<string[]>([]);
  const [nameTouched, setNameTouched] = useState(false);
  const [configText, setConfigText] = useState(toProviderYaml(form));
  const [configError, setConfigError] = useState<string | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const originalFormRef = useRef(toProviderYaml(form));

  const visibleBuiltinPresets = builtinPresets.filter((p) => {
    const haystack = `${p.id} ${p.name}`.toLowerCase();
    return Boolean(p.baseUrl) && !haystack.includes("oh-my-opencode") && !haystack.includes("opencode") && !haystack.includes("github-copilot") && !haystack.includes("lm-studio") && !haystack.includes("llama-cpp") && !haystack.includes("ollama");
  });
  const presetOptions = [...FEATURED_PROVIDER_PRESETS.filter((p) => Boolean(p.baseUrl)), ...visibleBuiltinPresets.filter((p) => !FEATURED_PROVIDER_PRESETS.some((fp) => fp.id === p.id))].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (isEdit) {
      const existing = providers.find((p) => p.id === editId);
      if (existing) {
        setForm(existing);
        setConfigText(toProviderYaml(existing));
        originalFormRef.current = toProviderYaml(existing);
      } else {
        fetchProviders();
      }
    } else {
      originalFormRef.current = toProviderYaml(form);
      fetchBuiltinPresets();
    }
  }, [isEdit, editId, providers, fetchProviders, fetchBuiltinPresets]);

  const validateForm = (target = form): string | null => {
    if (!target.id.trim()) return t("providerIdRequired");
    if (!PROVIDER_ID_PATTERN.test(target.id.trim())) return t("providerIdInvalid");
    if (!target.name.trim()) return t("providerNameRequired");
    if (!target.api) return t("apiFormatRequired");
    if (target.enabled && !target.baseUrl?.trim() && !target.discovery) return t("baseUrlRequired");
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

  const parseConfigTextValue = (text: string): ProviderConfig => {
    const parsed = parseProviderYaml(text);
    return {
      ...parsed,
      enabled: Boolean(parsed.enabled),
      isBuiltIn: Boolean(parsed.isBuiltIn),
      models: Array.isArray(parsed.models) ? parsed.models : [],
    };
  };

  const isDirty = configText !== originalFormRef.current;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = t("unsavedChanges");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, t]);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      if (!isDirty) return;
      const customEvent = event as CustomEvent<{ path: string }>;
      event.preventDefault();
      setPendingPath(customEvent.detail.path);
    };
    window.addEventListener("omp:navigate", handleNavigate);
    return () => window.removeEventListener("omp:navigate", handleNavigate);
  }, [isDirty]);

  const parseConfigText = (): ProviderConfig | null => {
    try {
      return parseConfigTextValue(configText);
    } catch (err) {
      setConfigError(t("yamlParseFailed", { error: err instanceof Error ? err.message : String(err) }));
      return null;
    }
  };

  const handleConfigTextChange = (text: string) => {
    setConfigText(text);
    try {
      setForm(parseConfigTextValue(text));
      setConfigError(null);
    } catch (err) {
      setConfigError(t("yamlParseFailed", { error: err instanceof Error ? err.message : String(err) }));
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
      setPresetModelCandidates([]);
      setSelectedPresetModelIds([]);
      return;
    }

    if (presetId === "openai-compatible") {
      updateForm({ ...form, api: "openai-completions" });
      setPresetModelCandidates([]);
      setSelectedPresetModelIds([]);
      return;
    }

    const preset = presetOptions.find((p) => p.id === presetId);
    if (!preset) return;

    const replacePresetIdentity = !form.id || form.id === selectedPresetId;
    const nextId = replacePresetIdentity ? preset.id : form.id;
    const candidates = preset.models ? [...preset.models] : [];
    setPresetModelCandidates(candidates);
    setSelectedPresetModelIds([]);
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
      models: [],
    });
  };

  const setPresetModelSelection = (ids: string[]) => {
    setSelectedPresetModelIds(ids);
    const selectedModels = presetModelCandidates.filter((m) => ids.includes(m.id));
    updateForm({ ...form, models: selectedModels });
  };

  const togglePresetModel = (modelId: string) => {
    const nextIds = selectedPresetModelIds.includes(modelId)
      ? selectedPresetModelIds.filter((id) => id !== modelId)
      : [...selectedPresetModelIds, modelId];
    setPresetModelSelection(nextIds);
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
      originalFormRef.current = toProviderYaml(submitForm);
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

  const fetchModels = async () => {
    if (!form.baseUrl?.trim() || !form.apiKey?.trim()) return;
    setIsFetchingModels(true);
    try {
      const result = await invokeCommand<FetchedModel[]>("fetch_models_for_config", {
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
        apiType: form.api,
      });
      setFetchedModels(result);
      toast.show(t("fetchedModels", { count: result.length }), "success");
    } catch (err) {
      toast.show(t("fetchModelsFailed", { error: String(err) }), "error");
    } finally {
      setIsFetchingModels(false);
    }
  };

  const addFetchedModel = (item: FetchedModel) => {
    if (models.some((m) => m.id === item.id)) return;
    const base: ModelDefinition = {
      id: item.id,
      name: item.name || item.id,
      api: form.api,
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384,
    };
    updateForm({ ...form, models: [...models, applyModelMetadata(base) as ModelDefinition] });
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
          onClick={() => (isDirty ? setPendingPath("/") : setLocation("/"))}
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
            <div data-testid="preset-grid" className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="preset-card-custom"
                onClick={() => applyPreset("")}
                className={`group text-left rounded-xl border px-2 py-1.5 transition duration-300 ${!selectedPresetId ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-[#1f1f1f] text-muted-foreground hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"}`}
              >
                <div className="truncate text-xs font-medium">{t("manualConfig")}</div>
                <div className="mt-0.5 text-[10px] opacity-70">{t("manualConfigHint")}</div>
              </button>
              {presetOptions.map((preset) => {
                const logo = getProviderLogo(preset);
                const logoSrc = getProviderLogoSrc(logo?.icon);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`preset-card-${preset.id}`}
                    onClick={() => applyPreset(preset.id)}
                    className={`group text-left rounded-xl border px-2 py-1.5 transition duration-300 ${selectedPresetId === preset.id ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-[#1f1f1f] text-muted-foreground hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {logoSrc ? (
                        <img src={logoSrc} alt={preset.name} className="h-4 w-4 shrink-0 rounded" />
                      ) : logo ? (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white" style={{ backgroundColor: logo.color }}>{logo.label}</span>
                      ) : null}
                      <span className="truncate text-xs font-medium">{preset.name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] opacity-70">{t("presetModelCount", { count: preset.models?.length ?? 0 })}</div>
                  </button>
                );
              })}
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
        {!isEdit && selectedPresetId && presetModelCandidates.length > 0 && (
          <section className="space-y-3 rounded-3xl border border-[#222] bg-[#050505] p-5 transition duration-200 hover:border-[#1db7f7]/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-medium text-white">{t("presetModels")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t("presetModelsHint")}</p>
                <p className="mt-1 text-xs text-muted-foreground" data-testid="preset-model-selected-count">已选择 {selectedPresetModelIds.length}/{presetModelCandidates.length}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" data-testid="select-all-preset-models" onClick={() => setPresetModelSelection(presetModelCandidates.map((m) => m.id))} className="rounded-xl border border-[#222] px-3 py-1.5 text-xs text-white transition hover:border-[#1db7f7]/70">全选</button>
                <button type="button" data-testid="clear-preset-models" onClick={() => setPresetModelSelection([])} className="rounded-xl border border-[#222] px-3 py-1.5 text-xs text-white transition hover:border-[#1db7f7]/70">清空</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="preset-model-grid">
              {presetModelCandidates.map((m) => {
                const checked = selectedPresetModelIds.includes(m.id);
                return (
                <label key={m.id} data-testid={`preset-model-card-${m.id}`} className={`rounded-2xl border p-3 transition duration-200 ${checked ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-black/40 hover:border-[#1db7f7]/50"}`}>
                  <div className="flex items-start gap-3">
                    <input data-testid={`preset-model-checkbox-${m.id}`} type="checkbox" checked={checked} onChange={() => togglePresetModel(m.id)} className="mt-1" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 break-all">{m.id}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.contextWindow.toLocaleString()} ctx</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.maxTokens.toLocaleString()} out</span>
                    {m.reasoning && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">thinking</span>}
                    {m.input?.includes("image") && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">multimodal</span>}
                  </div>
                </label>
              );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-[#222] bg-[#050505] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-white">{t("modelConfig")}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchModels}
                disabled={!form.baseUrl?.trim() || !form.apiKey?.trim() || isFetchingModels}
                data-testid="fetch-models-btn"
                className="inline-flex items-center gap-2 rounded-xl border border-[#222] px-3 py-2 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFetchingModels ? t("fetchingModels") : t("fetchModels")}
              </button>
              <button
                type="button"
                onClick={startAddModel}
                data-testid="add-model-btn"
                className="inline-flex items-center gap-2 rounded-xl border border-[#222] px-3 py-2 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111]"
              >
                <Plus className="h-3.5 w-3.5" /> {t("addModel")}
              </button>
            </div>
          </div>

          {fetchedModels.length > 0 && (
            <div className="rounded-2xl border border-[#222] bg-black/30 p-3" data-testid="fetched-models-panel">
              <p className="mb-2 text-xs text-muted-foreground">{t("fetchModelsHint")}</p>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {fetchedModels.map((item) => {
                  const exists = models.some((m) => m.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={exists}
                      onClick={() => addFetchedModel(item)}
                      title={item.id}
                      className="max-w-[260px] truncate rounded-lg border border-border bg-[#111] px-2.5 py-1 font-mono text-[11px] text-white transition hover:border-[#1db7f7]/70 disabled:opacity-45"
                    >
                      {exists ? "✓ " : "+ "}{item.name || item.id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            models={models}
            onSave={saveModel}
            onCancel={() => setEditingModelIdx(null)}
          />
        )}

        {pendingPath && (
          <ConfirmDialog
            title={t("unsavedChanges")}
            message={t("unsavedChanges")}
            confirmLabel={t("confirm")}
            variant="default"
            onCancel={() => setPendingPath(null)}
            onConfirm={() => {
              const path = pendingPath;
              setPendingPath(null);
              setLocation(path);
            }}
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
            onChange={(e) => handleConfigTextChange(e.target.value)}
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
