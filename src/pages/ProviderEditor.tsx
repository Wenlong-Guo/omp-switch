import { useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
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
  const { saveProvider } = useProviderStore();
  const [form, setForm] = useState<ProviderConfig>({
    id: "",
    name: "",
    enabled: true,
    isBuiltIn: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await saveProvider(form);
      setForm({ id: "", name: "", enabled: true, isBuiltIn: false });
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">添加 Provider</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Provider ID</label>
          <input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="openai"
            required
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
