import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ProviderConfig, ModelDefinition } from "@/types/provider";
import ProviderBasicForm from "@/components/ProviderEditor/ProviderBasicForm";
import ModelList from "@/components/ProviderEditor/ModelList";
import ModelEditorDialog from "@/components/ProviderEditor/ModelEditorDialog";

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
  const [editingModelIdx, setEditingModelIdx] = useState<number | "new" | null>(null);
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

  const validateForm = (): string | null => {
    if (!form.id.trim()) return "Provider ID 不能为空";
    if (!form.name.trim()) return "显示名称不能为空";
    if (!form.api) return "请选择 API 类型";
    if (!form.models || form.models.length === 0) return "至少需要配置一个模型";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
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
    setForm({ ...form, models: next });
    setEditingModelIdx(null);
  };

  const deleteModel = (idx: number) => {
    const next = [...models];
    next.splice(idx, 1);
    setForm({ ...form, models: next });
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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? `编辑 Provider ${form.name}` : "添加 Provider"}
      </h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <ProviderBasicForm
          form={form}
          isEdit={isEdit}
          onChange={setForm}
        />

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

          <ModelList
            models={models}
            onEdit={startEditModel}
            onDelete={deleteModel}
          />
        </div>

        {/* Model Editor Dialog */}
        {editingModelIdx !== null && (
          <ModelEditorDialog
            model={editingModelIdx === "new" ? undefined : models[editingModelIdx]}
            onSave={saveModel}
            onCancel={() => setEditingModelIdx(null)}
          />
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
