import { useEffect, useState, useRef } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { useToastStore } from "@/stores/toastStore";
import {
  ArrowLeft, Cloud, Link2, User, Lock, FolderOpen,
  TestTube2, Save, Upload, Download, AlertCircle, CheckCircle2,
  Info, Wifi, ShieldCheck, RotateCcw
} from "lucide-react";
import { useLocation } from "wouter";
import type { SyncConfig } from "@/types/sync";
import { useI18n } from "@/lib/i18n";

export default function Sync() {
  const { t } = useI18n();
  const { config, fetchConfig, saveConfig, testConnection, triggerSync, isSyncing, error } = useSyncStore();
  const { show: addToast } = useToastStore();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<SyncConfig>({
    enabled: false,
    serverUrl: "",
    username: "",
    password: "",
    remotePath: "/omp-switch.db",
  });
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const passwordEdited = useRef(false);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setForm(config);
      passwordEdited.current = false;
    }
  }, [config]);

  const handleTest = async () => {
    setTestResult(null);
    try {
      const ok = await testConnection();
      setTestResult(ok);
      addToast(ok ? t("connectionSuccess") : t("connectionFailed"), ok ? "success" : "error");
    } catch (e) {
      setTestResult(false);
      addToast(t("testConnectionError", { error: String(e) }), "error");
    }
  };

  const handleSave = async () => {
    try {
      await saveConfig(form);
      addToast(t("configSaved"), "success");
    } catch (e) {
      addToast(t("saveFailed", { error: String(e) }), "error");
    }
  };

  const handleSync = async (direction: "upload" | "download") => {
    try {
      await triggerSync(direction);
      addToast(direction === "upload" ? t("uploadSuccess") : t("downloadSuccess"), "success");
      await fetchConfig();
    } catch (e) {
      addToast(t("syncFailed", { error: String(e) }), "error");
    }
  };

  const isPasswordPlaceholder = config?.password === "***";
  const isDirty = JSON.stringify(form) !== JSON.stringify(config ?? {
    enabled: false,
    serverUrl: "",
    username: "",
    password: "",
    remotePath: "/omp-switch.db",
  });
  const reset = () => {
    setForm(config ?? {
      enabled: false,
      serverUrl: "",
      username: "",
      password: "",
      remotePath: "/omp-switch.db",
    });
    setTestResult(null);
    passwordEdited.current = false;
  };
  const syncStatus = config?.lastSyncStatus;
  const statusTone = syncStatus?.includes("success") ? "text-emerald-200 border-emerald-400/25 bg-emerald-400/10" : "text-red-200 border-red-400/25 bg-red-400/10";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button onClick={() => setLocation("/")} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#222] px-3 py-2 text-xs text-muted-foreground transition duration-200 hover:border-[#1db7f7]/60 hover:bg-[#111] hover:text-white" aria-label={t("back")}>
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </button>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1db7f7]">{t("webdavSync")}</p>
          <h1 aria-label={t("webdavSync")} className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t("cloudSync")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("syncSubtitle")}</p>
        </div>
        <div className="rounded-3xl border border-[#222] bg-[#050505] p-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className={`font-mono text-2xl font-semibold ${form.enabled ? "text-[#8adfff]" : "text-muted-foreground"}`}>{form.enabled ? "ON" : "OFF"}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("syncStatus")}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-transparent bg-[linear-gradient(#050505,#050505)_padding-box,linear-gradient(90deg,#222,#222)_border-box] p-5 transition duration-300 hover:bg-[linear-gradient(90deg,rgba(29,183,247,0.12),rgba(182,0,248,0.14))_padding-box,linear-gradient(90deg,#1db7f7,#b600f8)_border-box]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="pi-gradient-bg flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_0_32px_rgba(29,183,247,0.18)]">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t("connection")}</h2>
                <p className="text-sm text-muted-foreground">{t("connectionSubtitle")}</p>
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#222] bg-black/40 px-3 py-2 text-sm text-white transition duration-200 hover:border-[#1db7f7]/60">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} id="syncEnabled" className="h-4 w-4 accent-[#1db7f7]" />
              {t("enableSync")}
            </label>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><Link2 className="h-4 w-4 text-[#1db7f7]" />{t("serverUrl")}</span>
              <input value={form.serverUrl} onChange={(e) => setForm({ ...form, serverUrl: e.target.value })} className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20" placeholder="https://dav.jianguoyun.com/dav/" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><User className="h-4 w-4 text-[#1db7f7]" />{t("username")}</span>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20" />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><Lock className="h-4 w-4 text-[#b600f8]" />{t("password")}</span>
                <input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); passwordEdited.current = true; }} className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#b600f8] focus:ring-2 focus:ring-[#b600f8]/20" placeholder={isPasswordPlaceholder ? t("savedPasswordPlaceholder") : ""} />
              </label>
            </div>

            {isPasswordPlaceholder && !passwordEdited.current && (
              <p className="flex items-center gap-2 rounded-2xl border border-[#222] bg-[#111] px-4 py-3 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-[#1db7f7]" /> {t("passwordSavedHint")}
              </p>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><FolderOpen className="h-4 w-4 text-[#1db7f7]" />{t("remotePath")}</span>
              <input value={form.remotePath} onChange={(e) => setForm({ ...form, remotePath: e.target.value })} className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none transition duration-200 focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20" />
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#222] bg-[#050505] p-5">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#1db7f7]" />
              <div>
                <h2 className="font-semibold text-white">{t("health")}</h2>
                <p className="text-xs text-muted-foreground">{t("healthSubtitle")}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-[#222] bg-black/40 px-4 py-3"><span className="text-muted-foreground">{t("lastSync")}:</span><span className="text-right text-white">{config?.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString("zh-CN") : t("neverSynced")}</span></div>
              {syncStatus && <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${statusTone}`}>{syncStatus.includes("success") ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{syncStatus}</div>}
              {testResult !== null && <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${testResult ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>{testResult ? <CheckCircle2 className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}{testResult ? t("connectionSuccess") : t("connectionFailed")}</div>}
              {(error || config?.lastError) && <div className="flex items-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-red-200"><AlertCircle className="h-4 w-4" />{error || config?.lastError}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleTest} disabled={isSyncing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#222] px-4 py-3 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"><TestTube2 className="h-4 w-4" />{t("test")}</button>
            <button onClick={reset} disabled={!isDirty || isSyncing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#222] px-4 py-3 text-sm text-white transition duration-200 hover:border-[#b600f8]/70 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-4 w-4" />{t("reset")}</button>
            <button onClick={handleSave} disabled={isSyncing} className="pi-gradient-bg col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(29,183,247,0.18)] transition duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{isDirty ? t("saveConfig") : t("saved")}<span className="sr-only">{t("saveConfig")}</span></button>
            <button onClick={() => handleSync("upload")} disabled={isSyncing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#222] px-4 py-3 text-sm text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"><Upload className="h-4 w-4" />{isSyncing ? t("syncing") : t("upload")}</button>
            <button onClick={() => handleSync("download")} disabled={isSyncing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#222] px-4 py-3 text-sm text-white transition duration-200 hover:border-[#b600f8]/70 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />{isSyncing ? t("syncing") : t("download")}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
