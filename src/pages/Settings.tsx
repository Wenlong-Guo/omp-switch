import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AppSettings } from "@/types/settings";

export default function Settings() {
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const [form, setForm] = useState<AppSettings>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">全局设置</h1>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">保存成功</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">默认 Provider</label>
          <input
            value={form.defaultProvider ?? ""}
            onChange={(e) => setForm({ ...form, defaultProvider: e.target.value || undefined })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="anthropic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">默认模型</label>
          <input
            value={form.defaultModel ?? ""}
            onChange={(e) => setForm({ ...form, defaultModel: e.target.value || undefined })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="claude-sonnet-4-20250514"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">默认 Thinking 级别</label>
          <select
            value={form.defaultThinkingLevel ?? ""}
            onChange={(e) => setForm({ ...form, defaultThinkingLevel: e.target.value as any || undefined })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">请选择</option>
            <option value="off">关闭</option>
            <option value="minimal">Minimal</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="xhigh">XHigh</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.hideThinkingBlock ?? false}
            onChange={(e) => setForm({ ...form, hideThinkingBlock: e.target.checked })}
            id="hideThinking"
          />
          <label htmlFor="hideThinking" className="text-sm">隐藏 Thinking 块</label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">主题</label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, theme: t })}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  form.theme === t || (!form.theme && t === "system")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                {t === "light" ? "浅色" : t === "dark" ? "深色" : "跟随系统"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          保存设置
        </button>
      </form>
    </div>
  );
}
