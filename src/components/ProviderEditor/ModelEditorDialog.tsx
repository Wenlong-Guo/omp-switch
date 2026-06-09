import { useState, useMemo } from "react";
import type { ModelDefinition, ApiType } from "@/types/provider";
import {
  getDefaultModel,
  getAttributesByCategory,
} from "@/lib/modelAttributes";
import CollapsibleSection from "@/components/CollapsibleSection";
import CheckboxMatrix from "@/components/CheckboxMatrix";
import ThinkingLevelMapTable from "@/components/ThinkingLevelMapTable";
import CompatPresetSelector from "@/components/CompatPresetSelector";

interface Props {
  model?: ModelDefinition;
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

export default function ModelEditorDialog({ model, onSave, onCancel }: Props) {
  const defaults = useMemo(() => getDefaultModel(), []);
  const [form, setForm] = useState<Partial<ModelDefinition>>({
    ...defaults,
    ...model,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof ModelDefinition>(key: K, value: ModelDefinition[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[String(key)]) {
      setErrors((prev) => { const next = { ...prev }; delete next[String(key)]; return next; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.id?.trim()) newErrors.id = "模型 ID 不能为空";
    if (!form.name?.trim()) newErrors.name = "模型名称不能为空";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form as ModelDefinition);
  };

  const cost = (form.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  const limit = (form.limit || {});
  const compat = (form.compat || {}) as Record<string, boolean | string | Record<string, unknown>>;

  return (
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
          <h3 className="font-semibold text-lg">{model ? "编辑模型" : "添加模型"}</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Basic */}
          <CollapsibleSection title="基本信息" defaultOpen>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">模型 ID <span className="text-red-500">*</span></label>
                <input
                  value={form.id || ""}
                  onChange={(e) => updateField("id", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  data-testid="model-id-input"
                  placeholder="gpt-4o"
                />
                {errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">模型名称 <span className="text-red-500">*</span></label>
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
                <label className="block text-sm font-medium mb-1">API 类型</label>
                <select
                  value={(form.api) ?? ""}
                  onChange={(e) => updateField("api", e.target.value as ApiType | undefined)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  <option value="">继承 Provider</option>
                  {API_TYPES.map((t) => (
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
                <label htmlFor="reasoning" className="text-sm font-medium">支持 Reasoning</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">输入类型</label>
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
                      {type === "text" ? "文本" : "图片"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Cost */}
          <CollapsibleSection title="成本与限制">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Context Window</label>
                  <input
                    type="number"
                    value={form.contextWindow ?? ""}
                    onChange={(e) => updateField("contextWindow", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="model-context-window"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={form.maxTokens ?? ""}
                    onChange={(e) => updateField("maxTokens", Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="model-max-tokens"
                  />
                </div>
              </div>
              <div className="text-sm font-medium">成本（每百万 token）</div>
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
                <label className="block text-sm font-medium mb-1">Token 限制</label>
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
          <CollapsibleSection title="兼容性">
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
          <CollapsibleSection title="高级选项">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">自定义 Headers (JSON)</label>
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
                <label className="block text-sm font-medium mb-1">Thinking Level 映射</label>
                <ThinkingLevelMapTable
                  value={form.thinkingLevelMap || {}}
                  onChange={(v) => updateField("thinkingLevelMap", v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">模态</label>
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
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            data-testid="save-model-btn"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm transition-opacity"
          >
            保存模型
          </button>
        </div>
      </div>
    </div>
  );
}
