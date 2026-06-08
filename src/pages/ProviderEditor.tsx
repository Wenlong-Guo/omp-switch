import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation, useParams } from "wouter";
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
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? `编辑 Provider ${form.name}` : "添加 Provider"}
      </h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          保存 Provider
        </button>
      </form>
    </div>
  );
}
