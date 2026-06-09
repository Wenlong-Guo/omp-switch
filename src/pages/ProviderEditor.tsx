import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Globe, Key, Tag, Type, ToggleRight } from "lucide-react";
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

export default function ProviderEditor() {
  const { saveProvider, providers, fetchProviders } = useProviderStore();
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
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const existing = providers.find((p) => p.id === editId);
      if (existing) {
        setForm(existing);
      } else {
        fetchProviders();
      }
    }
  }, [isEdit, editId, providers, fetchProviders]);

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">
          {isEdit ? `编辑 Provider ${form.name}` : "添加 Provider"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm border border-red-100">
          <span className="font-medium">错误:</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-muted/20 rounded-lg p-4 space-y-4 border">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              Provider ID
            </label>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed bg-background"
              placeholder="openai"
              required
              disabled={isEdit}
            />
            <p className="text-xs text-muted-foreground mt-1">唯一标识符，保存后不可修改</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground" />
              显示名称
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="OpenAI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API 类型</label>
            <select
              value={form.api ?? ""}
              onChange={(e) => setForm({ ...form, api: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">请选择</option>
              {API_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Base URL
            </label>
            <input
              value={form.baseUrl ?? ""}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              API Key
            </label>
            <input
              type="password"
              value={form.apiKey ?? ""}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground mt-1">密钥将被 AES-256-GCM 加密存储</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="enabled"
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="enabled" className="text-sm flex items-center gap-1.5">
              <ToggleRight className="w-3.5 h-3.5 text-muted-foreground" />
              启用此 Provider
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-2 font-medium transition-opacity"
        >
          <Save className="w-4 h-4" />
          保存 Provider
        </button>
      </form>
    </div>
  );
}
