import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { ArrowLeft, Save, Brain, EyeOff, Server, Bot } from "lucide-react";
import { useLocation } from "wouter";
import type { AppSettings, ThinkingLevel } from "@/types/settings";

export default function Settings() {
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const [form, setForm] = useState<AppSettings>({});
  const [saved, setSaved] = useState(false);
  const [, setLocation] = useLocation();

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
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">全局设置</h1>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-900/30 text-green-400 rounded-md flex items-center gap-2 text-sm border border-green-800">
          <Save className="w-4 h-4" />
          保存成功
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-muted/20 rounded-lg p-4 space-y-4 border">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-muted-foreground" />
              默认 Provider
            </label>
            <input
              value={form.defaultProvider ?? ""}
              onChange={(e) => setForm({ ...form, defaultProvider: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="anthropic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              默认模型
            </label>
            <input
              value={form.defaultModel ?? ""}
              onChange={(e) => setForm({ ...form, defaultModel: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="claude-sonnet-4-20250514"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-muted-foreground" />
              默认 Thinking 级别
            </label>
            <select
              value={form.defaultThinkingLevel ?? ""}
              onChange={(e) => setForm({ ...form, defaultThinkingLevel: (e.target.value as ThinkingLevel) || undefined })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="hideThinking" className="text-sm flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              隐藏 Thinking 块
            </label>
          </div>

        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-2 font-medium transition-opacity"
        >
          <Save className="w-4 h-4" />
          保存设置
        </button>
      </form>
    </div>
  );
}
