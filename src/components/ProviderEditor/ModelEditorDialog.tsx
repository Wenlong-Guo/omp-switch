import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ModelDefinition, ApiType } from "@/types/provider";
import {
  getDefaultModel,
  getAttributesByCategory,
} from "@/lib/modelAttributes";
import CollapsibleSection from "@/components/CollapsibleSection";
import CheckboxMatrix from "@/components/CheckboxMatrix";
import ThinkingLevelMapTable from "@/components/ThinkingLevelMapTable";
import CompatPresetSelector from "@/components/CompatPresetSelector";
import { applyModelMetadata } from "@/lib/modelMetadata";
import { useI18n } from "@/lib/i18n";
import { shortcutLabel } from "@/lib/shortcutLabels";

interface Props {
  model?: ModelDefinition;
  models?: ModelDefinition[];
  onSave: (model: ModelDefinition) => void;
  onCancel: () => void;
}

const API_TYPES = [
  "openai-completions",
  "openai-responses",
  "openai-codex-responses",
  "azure-openai-responses",
  "anthropic-messages",
  "google-generative-ai",
  "google-vertex",
];

export default function ModelEditorDialog({ model, models = [], onSave, onCancel }: Props) {
  const { t } = useI18n();
  const defaults = useMemo(() => getDefaultModel(), []);
  const [form, setForm] = useState<Partial<ModelDefinition>>({
    ...defaults,
    ...model,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof ModelDefinition>(key: K, value: ModelDefinition[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return key === "id" ? applyModelMetadata(next) : next;
    });
    if (errors[String(key)]) {
      setErrors((prev) => { const next = { ...prev }; delete next[String(key)]; return next; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.id?.trim()) newErrors.id = t("modelIdRequired");
    else if (isDuplicateId(form.id)) newErrors.id = t("modelIdDuplicate");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDuplicateId = (id: string): boolean => {
    const normalized = id.trim();
    return models.some((m) => m.id === normalized && m.id !== model?.id);
  };

  const validateModelId = () => {
    if (!form.id?.trim()) {
      setErrors((prev) => ({ ...prev, id: t("modelIdRequired") }));
      return;
    }
    if (isDuplicateId(form.id)) {
      setErrors((prev) => ({ ...prev, id: t("modelIdDuplicate") }));
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, name: form.name?.trim() || form.id } as ModelDefinition);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const cost = (form.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  const limit = (form.limit || {});
  const compat = (form.compat || {}) as Record<string, boolean | string | Record<string, unknown>>;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
      data-testid="model-editor-dialog"
    >
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg">{model ? t("editModelLabel") : t("addModelLabel")}</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label={t("closeLabel")}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Basic */}
          <CollapsibleSection title={t("basicInfo")} defaultOpen>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("modelId")} <span className="text-red-500">*</span></label>
                <input
                  value={form.id || ""}
                  onChange={(e) => updateField("id", e.target.value)}
                  onBlur={validateModelId}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  data-testid="model-id-input"
                  placeholder="gpt-4o"
                />
                {errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("modelName")}</label>
                <input
                  value={form.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  data-testid="model-name-input"
                  placeholder="GPT-4o"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("apiFormat")}</label>
                <select
                  value={(form.api) ?? "openai-completions"}
                  onChange={(e) => updateField("api", e.target.value as ApiType | undefined)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  <option value="openai-completions">{t("apiCompatible")}</option>
                  {API_TYPES.filter((t) => t !== "openai-completions").map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reasoning"
                  checked={form.reasoning || false}
                  onChange={(e) => updateField("reasoning", e.target.checked)}
                  data-testid="model-reasoning"
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="reasoning" className="text-sm font-medium">{t("reasoningLabel")}</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("inputType")}</label>
                <div className="flex gap-4">
                  {(["text", "image"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={((form.input as string[]) || []).includes(type)}
                        onChange={() => {
                          const current = ((form.input as string[]) || []) as string[];
                          updateField("input", (current.includes(type) ? current.filter((x) => x !== type) : [...current, type]) as ("text" | "image")[]);
                        }}
                        className="h-4 w-4 accent-primary"
                      />
                      {type === "text" ? t("textLabel") : t("imageLabel")}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t("defaultTemperature")}</label>
                  <input
                    type="number"
                    step="0.1"
                    aria-label={t("defaultTemperature")}
                    value={form.defaultTemperature ?? ""}
                    onChange={(e) => updateField("defaultTemperature", (e.target.value ? Number(e.target.value) : undefined) as ModelDefinition["defaultTemperature"])}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t("defaultTopP")}</label>
                  <input
                    type="number"
                    step="0.1"
                    aria-label={t("defaultTopP")}
                    value={form.defaultTopP ?? ""}
                    onChange={(e) => updateField("defaultTopP", (e.target.value ? Number(e.target.value) : undefined) as ModelDefinition["defaultTopP"])}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Cost */}
          <CollapsibleSection title={t("costAndLimit")}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t("contextWindowLabel")}</label>
                  <input
                    type="number"
                    value={form.contextWindow ?? ""}
                    onChange={(e) => updateField("contextWindow", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="model-context-window"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t("maxTokensLabel")}</label>
                  <input
                    type="number"
                    value={form.maxTokens ?? ""}
                    onChange={(e) => updateField("maxTokens", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="model-max-tokens"
                  />
                </div>
              </div>
              <div className="text-sm font-medium">{t("costPerMillion")}</div>
              <div className="grid grid-cols-2 gap-3">
                {(["input", "output", "cacheRead", "cacheWrite"] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-xs text-muted-foreground mb-1 capitalize">{k}</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={cost[k] ?? 0}
                      onChange={(e) => updateField("cost", { ...cost, [k]: Number(e.target.value) } as ModelDefinition['cost'])}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("tokenLimit")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["context", "input", "output"] as const).map((k) => (
                    <div key={k}>
                      <label className="block text-xs text-muted-foreground mb-1 capitalize">{k}</label>
                      <input
                        type="number"
                        value={limit[k] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          updateField("limit", val !== undefined ? { ...limit, [k]: val } : undefined);
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Compatibility */}
          <CollapsibleSection title={t("compatibility")}>
            <div className="space-y-3">
              <CompatPresetSelector
                onApply={(preset) => updateField("compat", { ...compat, ...(preset.compat || {}) })}
                onClear={() => updateField("compat", {})}
              />
              <div className="grid grid-cols-2 gap-2">
                {getAttributesByCategory("compat").filter((a) => a.type === "boolean").map((attr) => {
                  const key = attr.key.replace("compat.", "");
                  return (
                    <div key={attr.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(compat[key] as boolean) || false}
                        onChange={(e) => updateField("compat", { ...compat, [key]: e.target.checked })}
                        id={`compat-${key}`}
                        className="h-4 w-4 accent-primary"
                      />
                      <label htmlFor={`compat-${key}`} className="text-xs">{attr.label}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          </CollapsibleSection>

          {/* Advanced */}
          <CollapsibleSection title={t("advancedOptions")}>
            <div className="space-y-3">
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-muted-foreground">
                {t("modelYamlWriteHint")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t("defaultSeed")}</label>
                  <input
                    type="number"
                    aria-label={t("defaultSeed")}
                    value={form.defaultSeed ?? ""}
                    onChange={(e) => updateField("defaultSeed", (e.target.value ? Number(e.target.value) : undefined) as ModelDefinition["defaultSeed"])}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("customHeadersJson")}</label>
                <textarea
                  value={form.headers ? JSON.stringify(form.headers, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const val = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                      updateField("headers", val);
                    } catch { /* ignore */ }
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("thinkingLevelMap")}</label>
                <ThinkingLevelMapTable
                  value={form.thinkingLevelMap || {}}
                  onChange={(v) => updateField("thinkingLevelMap", v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("modalities")}</label>
                <CheckboxMatrix
                  value={(form.modalities as { input?: string[]; output?: string[] }) || {}}
                  options={["text", "audio", "image", "video", "pdf"]}
                  onChange={(v) => updateField("modalities", v as { input?: string[]; output?: string[] })}
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-muted text-sm transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            data-testid="save-model-btn"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm transition-opacity"
          >
            {t("saveModelLabel")} <span className="ml-1 text-xs opacity-70">{shortcutLabel("enter")}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
