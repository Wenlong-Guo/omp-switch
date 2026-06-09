import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import type { ProviderConfig, ModelDefinition } from "@/types/provider";

const API_TYPES = [
  "openai-completions",
  "openai-responses",
  "openai-codex-responses",
  "azure-openai-responses",
  "anthropic-messages",
  "google-generative-ai",
  "google-vertex",
];

const emptyModel = (): ModelDefinition => ({
  id: "",
  name: "",
  api: undefined,
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 4096,
  maxTokens: 2048,
  headers: undefined,
  compat: undefined,
});

export default function ProviderEditor() {
  const { saveProvider, providers, fetchProviders, builtinPresets, fetchBuiltinPresets } = useProviderStore();
  const toast = useToastStore();
  const [, setLocation] = useLocation();
  const params = useParams();
  const editId = params.id;
  const isEdit = !!editId;

  const [form, setForm] = useState<ProviderConfig>({
    id: "",
    name: "",
    enabled: true,
    isBuiltIn: false,
    models: [],
  });
  const [editingModel, setEditingModel] = useState<number | "new" | null>(null);
  const [modelForm, setModelForm] = useState<ModelDefinition>(emptyModel());
  const [error, setError] = useState<string | null>(null);

  // Preset/model selection for add mode
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [modelAlias, setModelAlias] = useState<string>("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await saveProvider(form);
      toast.show(isEdit ? "更新成功" : "保存成功", "success");
      setLocation("/");
    } catch (err) {
      setError(String(err));
      toast.show("保存失败", "error");
    }
  };

  const models = form.models ?? [];

  const startAddModel = () => {
    setModelForm(emptyModel());
    setEditingModel("new");
  };

  const startEditModel = (idx: number) => {
    setModelForm({ ...models[idx] });
    setEditingModel(idx);
  };

  const saveModel = () => {
    if (!modelForm.id.trim() || !modelForm.name.trim()) return;
    const next = [...models];
    if (editingModel === "new") {
      next.push(modelForm);
    } else if (typeof editingModel === "number") {
      next[editingModel] = modelForm;
    }
    setForm({ ...form, models: next });
    setEditingModel(null);
  };

  const deleteModel = (idx: number) => {
    const next = [...models];
    next.splice(idx, 1);
    setForm({ ...form, models: next });
  };

  const toggleInput = (type: "text" | "image") => {
    const has = modelForm.input.includes(type);
    setModelForm({
      ...modelForm,
      input: has
        ? modelForm.input.filter((t) => t !== type)
        : [...modelForm.input, type],
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? `编辑 Provider ${form.name}` : "添加 Provider"}
      </h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Basic Fields */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">基本信息</h2>

          {/* Preset selector for add mode */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1">选择预设</label>
              <select
                value={selectedPresetId}
                onChange={(e) => {
                  const presetId = e.target.value;
                  setSelectedPresetId(presetId);
                  setSelectedModelId("");
                  setModelAlias("");
                  const preset = builtinPresets.find((p) => p.id === presetId);
                  if (preset) {
                    setForm({
                      ...form,
                      id: preset.id,
                      name: preset.name,
                      api: preset.api,
                      baseUrl: preset.baseUrl,
                      auth: preset.auth,
                      models: preset.models ? [...preset.models] : [],
                    });
                  } else {
                    setForm({ id: "", name: "", enabled: true, isBuiltIn: false, models: [] });
                  }
                }}
                data-testid="preset-select"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">手动配置</option>
                {builtinPresets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Model selection for add mode when preset has models */}
          {!isEdit && selectedPresetId && form.models && form.models.length > 0 && (
            <div className="p-3 border rounded bg-muted/20 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">选择模型</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => {
                    const modelId = e.target.value;
                    setSelectedModelId(modelId);
                    const model = form.models?.find((m) => m.id === modelId);
                    if (model) {
                      setModelAlias(model.name);
                    }
                  }}
                  data-testid="model-select"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">请选择模型</option>
                  {form.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              {selectedModelId && (
                <div>
                  <label className="block text-sm font-medium mb-1">模型别名（可选）</label>
                  <input
                    value={modelAlias}
                    onChange={(e) => {
                      setModelAlias(e.target.value);
                      // Update the alias in form.models
                      const nextModels = form.models?.map((m) =>
                        m.id === selectedModelId ? { ...m, name: e.target.value || m.name } : m
                      );
                      setForm({ ...form, models: nextModels });
                    }}
                    data-testid="model-alias-input"
                    placeholder="自定义显示名称"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Provider ID</label>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
              placeholder="openai"
              required
              disabled={isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">显示名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="OpenAI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API 类型</label>
            <select
              value={form.api ?? ""}
              onChange={(e) => setForm({ ...form, api: e.target.value as any })}
              data-testid="api-type-select"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">请选择</option>
              {API_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base URL</label>
            <input
              value={form.baseUrl ?? ""}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={form.apiKey ?? ""}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="sk-..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="enabled"
            />
            <label htmlFor="enabled" className="text-sm">启用</label>
          </div>
        </div>

        {/* Models Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">模型配置</h2>
            <button
              type="button"
              onClick={startAddModel}
              data-testid="add-model-btn"
              className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
              + 添加模型
            </button>
          </div>

          {models.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无模型配置</p>
          )}

          <div className="space-y-2">
            {models.map((m, idx) => (
              <div
                key={m.id}
                data-testid={`model-item-${m.id}`}
                className="flex items-center justify-between p-3 border rounded bg-muted/50"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {m.id} | Context: {m.contextWindow} | Max Tokens: {m.maxTokens}
                    {m.reasoning && " | Reasoning"}
                    {m.headers && " | Headers"}
                    {m.compat?.supportsStore && " | Store"}
                    {m.compat?.supportsDeveloperRole && " | DevRole"}
                    {m.compat?.supportsReasoningEffort && " | ReasoningEffort"}
                    {m.compat?.maxTokensField && ` | maxTokensField=${m.compat.maxTokensField}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid={`edit-model-${m.id}`}
                    onClick={() => startEditModel(idx)}
                    className="text-sm px-2 py-1 border rounded hover:bg-muted"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-model-${m.id}`}
                    onClick={() => deleteModel(idx)}
                    className="text-sm px-2 py-1 border rounded hover:bg-destructive hover:text-destructive-foreground"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Editor Dialog */}
        {editingModel !== null && (
          <div className="p-4 border rounded bg-muted/30 space-y-3" data-testid="model-editor">
            <h3 className="font-semibold">
              {editingModel === "new" ? "添加模型" : "编辑模型"}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-1">模型 ID</label>
              <input
                value={modelForm.id}
                onChange={(e) => setModelForm({ ...modelForm, id: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="gpt-4-turbo"
                data-testid="model-id-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">模型名称</label>
              <input
                value={modelForm.name}
                onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="GPT-4 Turbo"
                data-testid="model-name-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API 类型</label>
              <select
                value={modelForm.api ?? ""}
                onChange={(e) => setModelForm({ ...modelForm, api: e.target.value as any })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                checked={modelForm.reasoning}
                onChange={(e) => setModelForm({ ...modelForm, reasoning: e.target.checked })}
                id="reasoning"
                data-testid="model-reasoning"
              />
              <label htmlFor="reasoning" className="text-sm">支持 Reasoning</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">输入类型</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={modelForm.input.includes("text")}
                    onChange={() => toggleInput("text")}
                  />
                  文本
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={modelForm.input.includes("image")}
                    onChange={() => toggleInput("image")}
                  />
                  图片
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Context Window</label>
                <input
                  type="number"
                  value={modelForm.contextWindow}
                  onChange={(e) => setModelForm({ ...modelForm, contextWindow: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="model-context-window"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={modelForm.maxTokens}
                  onChange={(e) => setModelForm({ ...modelForm, maxTokens: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="model-max-tokens"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cost Input</label>
                <input
                  type="number"
                  step="0.0001"
                  value={modelForm.cost.input}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      cost: { ...modelForm.cost, input: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost Output</label>
                <input
                  type="number"
                  step="0.0001"
                  value={modelForm.cost.output}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      cost: { ...modelForm.cost, output: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cache Read</label>
                <input
                  type="number"
                  step="0.0001"
                  value={modelForm.cost.cacheRead}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      cost: { ...modelForm.cost, cacheRead: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cache Write</label>
                <input
                  type="number"
                  step="0.0001"
                  value={modelForm.cost.cacheWrite}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      cost: { ...modelForm.cost, cacheWrite: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <label className="block text-sm font-medium mb-1">自定义 Headers (JSON)</label>
              <textarea
                value={modelForm.headers ? JSON.stringify(modelForm.headers, null, 2) : ""}
                onChange={(e) => {
                  try {
                    const val = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                    setModelForm({ ...modelForm, headers: val });
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                placeholder='{"X-Custom-Header": "value"}'
                rows={3}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
              />
            </div>

            {/* ModelCompat */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground">兼容性配置</h4>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modelForm.compat?.supportsStore ?? false}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      compat: { ...modelForm.compat, supportsStore: e.target.checked },
                    })
                  }
                  id="compat-store"
                />
                <label htmlFor="compat-store" className="text-sm">supportsStore</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modelForm.compat?.supportsDeveloperRole ?? false}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      compat: { ...modelForm.compat, supportsDeveloperRole: e.target.checked },
                    })
                  }
                  id="compat-dev-role"
                />
                <label htmlFor="compat-dev-role" className="text-sm">supportsDeveloperRole</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modelForm.compat?.supportsReasoningEffort ?? false}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      compat: { ...modelForm.compat, supportsReasoningEffort: e.target.checked },
                    })
                  }
                  id="compat-reasoning-effort"
                />
                <label htmlFor="compat-reasoning-effort" className="text-sm">supportsReasoningEffort</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">maxTokensField</label>
                <input
                  value={modelForm.compat?.maxTokensField ?? ""}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      compat: { ...modelForm.compat, maxTokensField: e.target.value || undefined },
                    })
                  }
                  placeholder="max_completion_tokens"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">openRouterRouting (JSON)</label>
                <textarea
                  value={modelForm.compat?.openRouterRouting ? JSON.stringify(modelForm.compat.openRouterRouting, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const val = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                      setModelForm({ ...modelForm, compat: { ...modelForm.compat, openRouterRouting: val } });
                    } catch { /* ignore */ }
                  }}
                  placeholder='{"provider": {"order": ["OpenAI"]}}'
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">vercelGatewayRouting (JSON)</label>
                <textarea
                  value={modelForm.compat?.vercelGatewayRouting ? JSON.stringify(modelForm.compat.vercelGatewayRouting, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const val = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                      setModelForm({ ...modelForm, compat: { ...modelForm.compat, vercelGatewayRouting: val } });
                    } catch { /* ignore */ }
                  }}
                  placeholder='{"provider": "openai"}'
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">extraBody (JSON)</label>
                <textarea
                  value={modelForm.compat?.extraBody ? JSON.stringify(modelForm.compat.extraBody, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const val = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                      setModelForm({ ...modelForm, compat: { ...modelForm.compat, extraBody: val } });
                    } catch { /* ignore */ }
                  }}
                  placeholder='{"custom_param": true}'
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={saveModel}
                data-testid="save-model-btn"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                保存模型
              </button>
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                data-testid="cancel-model-btn"
                className="px-4 py-2 border rounded hover:bg-muted"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          data-testid="save-provider-btn"
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          保存 Provider
        </button>
      </form>
    </div>
  );
}
