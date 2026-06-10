import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ProviderConfig, ModelDefinition } from "@/types/provider";
import ProviderBasicForm from "@/components/ProviderEditor/ProviderBasicForm";
import ModelList from "@/components/ProviderEditor/ModelList";
import ModelEditorDialog from "@/components/ProviderEditor/ModelEditorDialog";

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9-]+$/;

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
    api: "openai-completions",
    auth: "apiKey",
    models: [],
  });
  const [editingModelIdx, setEditingModelIdx] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preset/model selection for add mode
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [modelAlias, setModelAlias] = useState<string>("");
  const [nameTouched, setNameTouched] = useState(false);

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
    if (!form.id.trim()) return "供应商 ID 不能为空";
    if (!PROVIDER_ID_PATTERN.test(form.id.trim())) return "供应商 ID 只能包含字母、数字和横线";
    if (!form.name.trim()) return "显示名称不能为空";
    if (!form.api) return "请选择接口格式";
    return null;
  };

  const handleFormChange = (next: ProviderConfig) => {
    const idChanged = next.id !== form.id;
    const nameChanged = next.name !== form.name;
    const touched = nameTouched || (nameChanged && !idChanged);
    setNameTouched(touched);
    setForm({
      ...next,
      name: idChanged && !touched ? next.id : next.name,
    });
  };

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setSelectedModelId("");
    setModelAlias("");

    if (!presetId) return;

    if (presetId === "openai-compatible") {
      setForm({ ...form, api: "openai-completions" });
      return;
    }

    const preset = builtinPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const replacePresetIdentity = !form.id || form.id === selectedPresetId;
    const nextId = replacePresetIdentity ? preset.id : form.id;
    setForm({
      ...form,
      id: nextId,
      name: replacePresetIdentity ? (preset.name || nextId) : (nameTouched && form.name ? form.name : form.name || nextId),
      api: preset.api ?? "openai-completions",
      baseUrl: form.baseUrl || preset.baseUrl,
      auth: preset.auth ?? form.auth,
      apiKey: form.apiKey,
      models: form.models && form.models.length > 0 ? form.models : (preset.models ? [...preset.models] : form.models),
    });
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
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEdit ? `编辑供应商 ${form.name}` : "添加供应商"}
        </h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-md border border-red-800 flex items-center gap-2 text-sm"><span className="font-medium">错误:</span> {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Preset selector for add mode */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium mb-1">选择预设</label>
            <select
              value={selectedPresetId}
              onChange={(e) => applyPreset(e.target.value)}
              data-testid="preset-select"
              className="w-full px-3 py-2 border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">手动配置</option>
              <option value="openai-compatible">OpenAI 兼容接口格式</option>
              {builtinPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <ProviderBasicForm
          form={form}
          isEdit={isEdit}
          onChange={handleFormChange}
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
                className="w-full px-3 py-2 border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-2 border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <Plus className="w-3.5 h-3.5" /> 添加模型
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
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-2 font-medium transition-opacity"
        >
          <Save className="w-4 h-4" />
          保存供应商
        </button>
      </form>
    </div>
  );
}
