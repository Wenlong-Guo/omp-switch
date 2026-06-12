import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, Check, RotateCcw, Save, Sparkles, Trash2, X } from "lucide-react";
import { useProviderStore } from "@/stores/providerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AppSettings, ModelRole } from "@/types/settings";
import CustomSelect from "@/components/CustomSelect";
import { useI18n } from "@/lib/i18n";

const ROLES: Array<{ id: ModelRole; label: string; descriptionKey: Parameters<ReturnType<typeof useI18n>["t"]>[0]; color: string }> = [
  { id: "default", label: "Default", descriptionKey: "roleDefaultDesc", color: "from-[#1db7f7] to-[#49d6ff]" },
  { id: "smol", label: "Smol", descriptionKey: "roleSmolDesc", color: "from-emerald-400 to-[#1db7f7]" },
  { id: "slow", label: "Slow", descriptionKey: "roleSlowDesc", color: "from-[#b600f8] to-[#dfa0ff]" },
  { id: "plan", label: "Plan", descriptionKey: "rolePlanDesc", color: "from-amber-300 to-[#b600f8]" },
  { id: "commit", label: "Commit", descriptionKey: "roleCommitDesc", color: "from-rose-300 to-[#1db7f7]" },
];

export default function ModelRoles() {
  const { t } = useI18n();
  const { providers, fetchProviders } = useProviderStore();
  const { settings, fetchSettings, saveSettings, isLoading, error } = useSettingsStore();
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

  const assignedCount = Object.keys(form.modelRoles ?? {}).length;
  const initialRoles = settings?.modelRoles ?? {};
  const isDirty = JSON.stringify(form.modelRoles ?? {}) !== JSON.stringify(initialRoles);

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

  const clearAll = () => setForm({ ...form, modelRoles: undefined });
  const reset = () => setForm(settings ?? {});

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#b600f8]">{t("modelRoles")}</p>
          <h1 aria-label={t("modelRoles")} className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t("roleConfiguration")}
            <span className="sr-only">{t("modelRoles")}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("roleSubtitle")}</p>
        </div>
        <div className="rounded-2xl border border-[#222] bg-[#050505] px-4 py-3 text-right">
          <div className="font-mono text-2xl font-semibold text-white">{assignedCount}/{ROLES.length}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("assigned")}</div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-[#222] bg-[#050505] p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {enabledModelOptions.length > 0 ? t("enabledModelsAvailable", { count: enabledModelOptions.length }) : t("noEnabledModels")}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={reset} disabled={!isDirty || isLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-[#222] px-3 py-2 text-xs text-muted-foreground transition duration-200 hover:border-[#1db7f7]/60 hover:bg-[#111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw className="h-3.5 w-3.5" /> {t("reset")}
          </button>
          <button type="button" onClick={clearAll} disabled={assignedCount === 0 || isLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-[#222] px-3 py-2 text-xs text-muted-foreground transition duration-200 hover:border-red-400/60 hover:bg-red-400/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" /> {t("clearAll")}
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <Check className="h-4 w-4" /> {t("saveSuccess")}
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {ROLES.map((role) => {
            const assigned = form.modelRoles?.[role.id];
            return (
              <div key={role.id} className="group relative overflow-visible rounded-3xl border border-[#222] bg-[#1f1f1f] p-5 transition duration-300 hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7_0%,#b600f8_100%)] hover:shadow-[0_20px_80px_rgba(29,183,247,0.24)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.color} text-white shadow-[0_0_28px_rgba(29,183,247,0.18)]`}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{role.label}</h2>
                        <span className="rounded-lg border border-[#222] bg-[#111] px-2 py-0.5 font-mono text-[11px] text-muted-foreground group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">{role.id}</span>
                        {assigned && <span className="rounded-lg border border-[#1db7f7]/30 bg-[#1db7f7]/10 px-2 py-0.5 text-[11px] text-[#8adfff] group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">{t("active")}</span>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground group-hover:text-white/80">{t(role.descriptionKey)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setRole(role.id, "")} disabled={!assigned || isLoading} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#222] px-3 py-2 text-xs text-muted-foreground transition duration-200 hover:border-[#b600f8]/60 hover:bg-[#111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40" data-testid={`clear-role-${role.id}`}>
                    <X className="h-3.5 w-3.5" /> {t("clear")}
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#222] bg-black/40 px-4 py-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#1db7f7]" />
                  <CustomSelect value={assigned ?? ""} options={enabledModelOptions} placeholder={t("unset")} disabled={isLoading || enabledModelOptions.length === 0} testId={`role-select-${role.id}`} onChange={(value) => setRole(role.id, value)} />
                </div>
              </div>
            );
          })}
        </div>

        <button type="submit" disabled={!isDirty || isLoading} className="pi-gradient-bg flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(29,183,247,0.22)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_36px_rgba(182,0,248,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
          <Save className="h-4 w-4" /> {isLoading ? t("saving") : isDirty ? t("saveRoles") : t("saved")}
        </button>
      </form>
    </div>
  );
}
