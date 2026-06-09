import { useState, useMemo } from "react";
import type { ModelDefinition } from "@/types/provider";
import {
  getAllAttributes,
  getAttributesByCategory,
  getDefaultModel,
  clearCompatPreset,
} from "@/lib/modelAttributes";
import CollapsibleSection from "./CollapsibleSection";
import CheckboxMatrix from "./CheckboxMatrix";
import KeyValueEditor from "./KeyValueEditor";
import ThinkingLevelMapTable from "./ThinkingLevelMapTable";
import CompatPresetSelector from "./CompatPresetSelector";

interface ModelEditorProps {
  initialModel?: Partial<ModelDefinition>;
  onSave: (model: ModelDefinition) => void;
  onCancel: () => void;
}

export default function ModelEditor({ initialModel, onSave, onCancel }: ModelEditorProps) {
  const defaults = useMemo(() => getDefaultModel(), []);
  const [form, setForm] = useState<Partial<ModelDefinition>>({
    ...defaults,
    ...initialModel,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof ModelDefinition>(
    key: K,
    value: ModelDefinition[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.id?.trim()) newErrors.id = "模型 ID 不能为空";
    if (!form.name?.trim()) newErrors.name = "模型名称不能为空";
    if (form.cost?.input !== undefined && form.cost.input < 0) newErrors.cost = "Cost 不能为负数";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form as ModelDefinition);
  };

  const basicAttrs = getAttributesByCategory("basic");
  const capabilityAttrs = getAttributesByCategory("capability");
  const costAttrs = getAttributesByCategory("cost");
  const compatAttrs = getAttributesByCategory("compat");
  const advancedAttrs = getAttributesByCategory("advanced");

  const renderField = (attr: ReturnType<typeof getAllAttributes>[number]) => {
    const key = attr.key as keyof ModelDefinition;
    const val = form[key];

    switch (attr.type) {
      case "text":
        return (
          <div key={attr.key}>
            <label className="block text-sm font-medium mb-1">
              {attr.label} {attr.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={(val as string) || ""}
              onChange={(e) => updateField(key, e.target.value as any)}
              className="w-full px-2 py-1 border rounded text-sm"
              data-testid={`field-${attr.key}`}
            />
            {errors[attr.key] && <span className="text-xs text-red-600">{errors[attr.key]}</span>}
          </div>
        );
      case "number":
        return (
          <div key={attr.key}>
            <label className="block text-sm font-medium mb-1">{attr.label}</label>
            <input
              type="number"
              value={(val as number) ?? ""}
              onChange={(e) => updateField(key, Number(e.target.value) as any)}
              className="w-full px-2 py-1 border rounded text-sm"
              data-testid={`field-${attr.key}`}
            />
          </div>
        );
      case "boolean":
        return (
          <div key={attr.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(val as boolean) || false}
              onChange={(e) => updateField(key, e.target.checked as any)}
              id={`field-${attr.key}`}
              data-testid={`field-${attr.key}`}
            />
            <label htmlFor={`field-${attr.key}`} className="text-sm">
              {attr.label}
            </label>
          </div>
        );
      case "select":
        return (
          <div key={attr.key}>
            <label className="block text-sm font-medium mb-1">{attr.label}</label>
            <select
              value={(val as string) || ""}
              onChange={(e) => updateField(key, e.target.value as any)}
              className="w-full px-2 py-1 border rounded text-sm"
              data-testid={`field-${attr.key}`}
            >
              <option value="">{attr.required ? "请选择" : "（无）"}</option>
              {attr.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        );
      case "multiselect":
        if (attr.key === "modalities") {
          return (
            <div key={attr.key}>
              <label className="block text-sm font-medium mb-1">{attr.label}</label>
              <CheckboxMatrix
                value={(val as { input?: string[]; output?: string[] }) || {}}
                options={attr.options || []}
                onChange={(v) => updateField("modalities", v as any)}
              />
            </div>
          );
        }
        if (attr.key === "input") {
          return (
            <div key={attr.key}>
              <label className="block text-sm font-medium mb-1">{attr.label}</label>
              <div className="flex gap-3">
                {(attr.options || []).map((o) => (
                  <label key={o} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={((val as string[]) || []).includes(o)}
                      onChange={() => {
                        const current = ((val as string[]) || []) as string[];
                        const next = current.includes(o)
                          ? current.filter((x) => x !== o)
                          : [...current, o];
                        updateField("input", next as any);
                      }}
                      data-testid={`field-input-${o}`}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          );
        }
        return null;
      case "json":
        if (attr.key === "thinkingLevelMap") {
          return (
            <div key={attr.key}>
              <label className="block text-sm font-medium mb-1">{attr.label}</label>
              <ThinkingLevelMapTable
                value={(val as Record<string, string | null>) || {}}
                onChange={(v) => updateField("thinkingLevelMap", v as any)}
              />
            </div>
          );
        }
        return (
          <div key={attr.key}>
            <label className="block text-sm font-medium mb-1">{attr.label}</label>
            <textarea
              value={val ? JSON.stringify(val, null, 2) : ""}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                  updateField(key, parsed);
                } catch {
                  // ignore invalid json
                }
              }}
              className="w-full px-2 py-1 border rounded text-sm font-mono text-xs"
              rows={3}
              data-testid={`field-${attr.key}`}
            />
          </div>
        );
      case "keyvalue":
        if (attr.key === "options" || attr.key === "headers" || attr.key === "variants") {
          return (
            <div key={attr.key}>
              <label className="block text-sm font-medium mb-1">{attr.label}</label>
              <KeyValueEditor
                value={val as Record<string, string>}
                onChange={(v) => updateField(key as any, v as any)}
              />
            </div>
          );
        }
        return null;
      case "table":
        if (attr.key === "thinkingLevelMap") {
          return (
            <div key={attr.key}>
              <label className="block text-sm font-medium mb-1">{attr.label}</label>
              <ThinkingLevelMapTable
                value={(val as Record<string, string | null>) || {}}
                onChange={(v) => updateField("thinkingLevelMap", v as any)}
              />
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3" data-testid="model-editor">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">模型编辑器</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90"
            data-testid="model-save"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm px-3 py-1.5 border rounded hover:bg-muted"
            data-testid="model-cancel"
          >
            取消
          </button>
        </div>
      </div>

      <CollapsibleSection title="基本信息" defaultOpen>
        <div className="space-y-2">
          {basicAttrs.map(renderField)}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="能力与模态">
        <div className="space-y-2">
          {capabilityAttrs.map(renderField)}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="成本与限制">
        <div className="space-y-2">
          {costAttrs.map((attr) => {
            if (attr.key === "cost") {
              const cost = (form.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }) as unknown as Record<string, number>;
              return (
                <div key="cost" className="space-y-2">
                  <div className="text-sm font-medium">成本（每百万 token）</div>
                  <div className="grid grid-cols-2 gap-2">
                    {["input", "output", "cacheRead", "cacheWrite"].map((k) => (
                      <div key={k}>
                        <label className="block text-xs text-muted-foreground mb-0.5">{k}</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={cost[k] ?? 0}
                          onChange={(e) => {
                            const next = { ...cost, [k]: Number(e.target.value) };
                            updateField("cost", next as any);
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                          data-testid={`cost-${k}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (attr.key === "costContextOver200k") {
              return (
                <div key="costContextOver200k">
                  <label className="block text-sm font-medium mb-1">超 200k 上下文成本</label>
                  <textarea
                    value={form.cost?.contextOver200k ? JSON.stringify(form.cost.contextOver200k, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                        updateField("cost", { ...form.cost, contextOver200k: parsed } as any);
                      } catch { /* ignore */ }
                    }}
                    className="w-full px-2 py-1 border rounded text-sm font-mono text-xs"
                    rows={3}
                    data-testid="field-costContextOver200k"
                  />
                </div>
              );
            }
            if (attr.key === "limit") {
              const limit = (form.limit || {}) as Record<string, number>;
              return (
                <div key="limit" className="space-y-2">
                  <div className="text-sm font-medium">Token 限制</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["context", "input", "output"].map((k) => (
                      <div key={k}>
                        <label className="block text-xs text-muted-foreground mb-0.5">{k}</label>
                        <input
                          type="number"
                          value={limit[k] ?? ""}
                          onChange={(e) => {
                            const next = { ...limit, [k]: Number(e.target.value) };
                            updateField("limit", next as any);
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                          data-testid={`limit-${k}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return renderField(attr);
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="兼容性">
        <div className="space-y-2">
          <CompatPresetSelector
            onApply={(preset) => {
              const currentCompat = (form.compat || {}) as Record<string, unknown>;
              const newCompat = { ...currentCompat, ...(preset.compat as Record<string, unknown> || {}) };
              updateField("compat", newCompat as any);
            }}
            onClear={() => {
              const cleared = clearCompatPreset();
              updateField("compat", cleared.compat as any);
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            {compatAttrs.map((attr) => {
              if (attr.type === "boolean") {
                const compatKey = attr.key.replace("compat.", "");
                const compat = (form.compat || {}) as Record<string, boolean>;
                return (
                  <div key={attr.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={compat[compatKey] || false}
                      onChange={(e) => {
                        updateField("compat", { ...compat, [compatKey]: e.target.checked } as any);
                      }}
                      id={`compat-${compatKey}`}
                      data-testid={`compat-${compatKey}`}
                    />
                    <label htmlFor={`compat-${compatKey}`} className="text-xs">
                      {attr.label}
                    </label>
                  </div>
                );
              }
              if (attr.type === "text" || attr.type === "select") {
                const compatKey = attr.key.replace("compat.", "");
                const compat = (form.compat || {}) as Record<string, string>;
                return (
                  <div key={attr.key}>
                    <label className="block text-xs text-muted-foreground mb-0.5">{attr.label}</label>
                    {attr.type === "select" ? (
                      <select
                        value={compat[compatKey] || ""}
                        onChange={(e) => updateField("compat", { ...compat, [compatKey]: e.target.value } as any)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        data-testid={`compat-${compatKey}`}
                      >
                        <option value="">（无）</option>
                        {attr.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={compat[compatKey] || ""}
                        onChange={(e) => updateField("compat", { ...compat, [compatKey]: e.target.value } as any)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        data-testid={`compat-${compatKey}`}
                      />
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
          {compatAttrs.filter((a) => a.type === "json").map((attr) => {
            const compatKey = attr.key.replace("compat.", "");
            const compat = (form.compat || {}) as Record<string, unknown>;
            return (
              <div key={attr.key}>
                <label className="block text-sm font-medium mb-1">{attr.label}</label>
                <textarea
                  value={compat[compatKey] ? JSON.stringify(compat[compatKey], null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                      updateField("compat", { ...compat, [compatKey]: parsed } as any);
                    } catch { /* ignore */ }
                  }}
                  className="w-full px-2 py-1 border rounded text-sm font-mono text-xs"
                  rows={3}
                  data-testid={`compat-${compatKey}`}
                />
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="高级选项">
        <div className="space-y-2">
          {advancedAttrs.map(renderField)}
        </div>
      </CollapsibleSection>
    </div>
  );
}

