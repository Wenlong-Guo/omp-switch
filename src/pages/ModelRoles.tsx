import { useEffect, useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import { useProviderStore } from "@/stores/providerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AppSettings, ModelRole } from "@/types/settings";

const ROLES: Array<{ id: ModelRole; label: string; description: string }> = [
  { id: "default", label: "Default", description: "普通对话/实现默认模型" },
  { id: "smol", label: "Smol", description: "轻量任务/子任务" },
  { id: "slow", label: "Slow", description: "深度推理/复杂排查" },
  { id: "plan", label: "Plan", description: "计划模式" },
  { id: "commit", label: "Commit", description: "提交信息/变更说明" },
];

export default function ModelRoles() {
  const { providers, fetchProviders } = useProviderStore();
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const [form, setForm] = useState<AppSettings>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchSettings();
  }, [fetchProviders, fetchSettings]);

  useEffect(() => {
    setForm(settings ?? {});
  }, [settings]);

  const enabledModelOptions = useMemo(() => providers
    .filter((provider) => provider.enabled)
    .flatMap((provider) => (provider.models ?? []).map((model) => ({
      value: `${provider.id}/${model.id}`,
      label: `${provider.name} / ${model.name}`,
    }))), [providers]);

  const setRole = (role: ModelRole, value: string) => {
    const nextRoles = { ...(form.modelRoles ?? {}) };
    if (value) nextRoles[role] = value;
    else delete nextRoles[role];
    setForm({ ...form, modelRoles: Object.keys(nextRoles).length ? nextRoles : undefined });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">模型角色</h1>
        <p className="text-sm text-muted-foreground mt-1">写入 omp modelRoles：default、smol、slow、plan、commit。</p>
      </div>
      {saved && <div className="mb-4 p-3 bg-green-900/30 text-green-400 rounded-md border border-green-800 text-sm">保存成功</div>}
      <form onSubmit={save} className="space-y-4">
        {ROLES.map((role) => (
          <div key={role.id} className="border rounded-lg p-4 bg-muted/20">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="font-semibold">{role.label}</h2>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
              <button type="button" onClick={() => setRole(role.id, "")} disabled={!form.modelRoles?.[role.id]} className="text-xs px-2 py-1 border rounded-md disabled:opacity-50 flex items-center gap-1" data-testid={`clear-role-${role.id}`}>
                <X className="w-3 h-3" /> 清空
              </button>
            </div>
            <select value={form.modelRoles?.[role.id] ?? ""} onChange={(e) => setRole(role.id, e.target.value)} data-testid={`role-select-${role.id}`} className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">未设置</option>
              {enabledModelOptions.map((option) => <option key={`${role.id}-${option.value}`} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ))}
        <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-2 font-medium">
          <Save className="w-4 h-4" /> 保存模型角色
        </button>
      </form>
    </div>
  );
}
