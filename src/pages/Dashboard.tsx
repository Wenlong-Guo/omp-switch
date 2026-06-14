import { useEffect, useState, useRef } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation } from "wouter";
import { Plus, ArrowRight, Pencil, Trash2, Download, Upload, GripVertical, Copy, FlaskConical } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { validateProviderImport } from "@/lib/importValidation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useI18n } from "@/lib/i18n";
import { invokeCommand } from "@/lib/tauri-api";
import { getProviderLogo, type ProviderLogoConfig } from "@/lib/providerPresets";
import { getProviderLogoSrc } from "@/lib/providerLogos";
import type { ProviderConfig } from "@/types/provider";

const ProviderLogo = ({ name, logo }: { name: string; logo: ProviderLogoConfig | null }) => {
  const logoSrc = getProviderLogoSrc(logo?.icon);

  if (logoSrc) {
    return <img src={logoSrc} alt={logo?.icon ?? name} className="h-full w-full rounded-2xl object-cover" />;
  }

  if (!logo) {
    return <span>{name.trim().charAt(0).toUpperCase() || "?"}</span>;
  }

  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-2xl text-sm font-bold text-white"
      style={{ backgroundColor: logo.color }}
      title={logo.icon}
    >
      {logo.label}
    </span>
  );
};

const getModelName = (model: { id: string; name?: string }) => model.name || model.id;

const canUseOpenAiTest = (api?: string) => !api || api.includes("openai");

const PROVIDER_ORDER_KEY = "omp-switch-provider-order";

const mergeProviderOrder = (providers: ProviderConfig[], savedOrder: string[]) => {
  const byId = new Map(providers.map((provider) => [provider.id, provider]));
  const ordered = savedOrder.flatMap((id) => {
    const provider = byId.get(id);
    if (!provider) return [];
    byId.delete(id);
    return [provider];
  });

  return [...ordered, ...providers.filter((provider) => byId.has(provider.id))];
};

export default function Dashboard() {
  const { t } = useI18n();
  const { providers, fetchProviders, deleteProvider, saveProvider, isLoading } = useProviderStore();
  const toast = useToastStore();
  const [, setLocation] = useLocation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderedProviders, setOrderedProviders] = useState<typeof providers>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [testResults, setTestResults] = useState<Map<string, boolean>>(new Map());
  const searchRef = useRef<HTMLInputElement>(null);
  const deletedProviderRef = useRef<Map<string, { provider: ProviderConfig; timer: number }>>(new Map());

  useEffect(() => {
    let savedOrder: string[] = [];
    try {
      savedOrder = JSON.parse(localStorage.getItem(PROVIDER_ORDER_KEY) ?? "[]");
    } catch {
      savedOrder = [];
    }
    setOrderedProviders(mergeProviderOrder(providers, savedOrder).filter((provider) => !deletedProviderRef.current.has(provider.id)));
  }, [providers]);

  useEffect(() => () => {
    deletedProviderRef.current.forEach(({ timer }) => window.clearTimeout(timer));
  }, []);

  useKeyboardShortcuts({
    onSearch: () => {
      searchRef.current?.focus();
    },
  });

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const filteredProviders = orderedProviders.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      (p.api ?? "").toLowerCase().includes(query) ||
      (p.models ?? []).some((model) =>
        model.id.toLowerCase().includes(query) || (model.name ?? "").toLowerCase().includes(query)
      );
  });

  const persistProviderOrder = (providers: ProviderConfig[]) => {
    localStorage.setItem(PROVIDER_ORDER_KEY, JSON.stringify(providers.map((provider) => provider.id)));
  };

  const importProvidersFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const result = validateProviderImport(imported);
      if (!result.valid) {
        toast.show(`${t("importFailed")}：${result.error}`, "error");
        return;
      }
      for (const p of result.providers) {
        await saveProvider?.(p);
      }
      toast.show(t("importSuccess", { count: result.providers.length }), "success");
      fetchProviders();
    } catch {
      toast.show(t("importFailed"), "error");
    }
  };

  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const newOrder = [...orderedProviders];
    const dragIdx = newOrder.findIndex((p) => p.id === dragId);
    const targetIdx = newOrder.findIndex((p) => p.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;
    const [removed] = newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, removed);
    setOrderedProviders(newOrder);
    persistProviderOrder(newOrder);
    setDragId(null);
    setDragOverId(null);
  };

  const handleTestModel = async (provider: ProviderConfig) => {
    const model = provider.models?.[0];
    if (!model) {
      toast.show(t("testModelNoModel"), "error");
      return;
    }
    if (!provider.apiKey) {
      toast.show(t("testModelNoApiKey"), "error");
      return;
    }
    if (!provider.baseUrl) {
      toast.show(t("testModelNoBaseUrl"), "error");
      return;
    }
    if (!canUseOpenAiTest(provider.api)) {
      toast.show(t("testModelUnsupported"), "error");
      return;
    }

    const modelName = getModelName(model);
    toast.show(t("testModelRunning", { model: modelName }), "success");
    try {
      await invokeCommand("chat_completion", {
        req: {
          provider_id: provider.id,
          model: model.id,
          messages: [{ role: "user", content: "ping" }],
        },
      });
      setTestResults((current) => new Map(current).set(provider.id, true));
      toast.show(t("testModelSuccess", { model: modelName }), "success");
    } catch (error) {
      setTestResults((current) => new Map(current).set(provider.id, false));
      toast.show(t("testModelFailed", { reason: String(error) }), "error");
    }
  };

  const scheduleDeleteProvider = (provider: ProviderConfig) => {
    setOrderedProviders((current) => current.filter((item) => item.id !== provider.id));
    const existing = deletedProviderRef.current.get(provider.id);
    if (existing) window.clearTimeout(existing.timer);
    const timer = window.setTimeout(async () => {
      deletedProviderRef.current.delete(provider.id);
      try {
        await deleteProvider(provider.id);
        toast.show(t("deleteSuccess"), "success");
      } catch {
        toast.show(t("importFailed"), "error");
      }
    }, 5000);
    deletedProviderRef.current.set(provider.id, { provider, timer });
    toast.show(t("deleteUndone"), "success", () => {
      const deleted = deletedProviderRef.current.get(provider.id);
      if (!deleted) return;
      window.clearTimeout(deleted.timer);
      deletedProviderRef.current.delete(provider.id);
      setOrderedProviders((current) => mergeProviderOrder([...current, deleted.provider], [
        ...current.map((item) => item.id),
        deleted.provider.id,
      ]));
    });
  };

  return (
    <div
      className="relative mx-auto w-full max-w-6xl px-6 py-10 md:px-10"
      onDragOver={(e) => {
        if (e.dataTransfer?.items && Array.from(e.dataTransfer.items).some((item) => item.kind === "file")) {
          e.preventDefault();
          setIsFileDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsFileDragOver(false);
      }}
      onDrop={async (e) => {
        if (!e.dataTransfer?.files) return;
        const file = Array.from(e.dataTransfer.files).find((file) => file.name.toLowerCase().endsWith(".json"));
        if (!file) return;
        e.preventDefault();
        setIsFileDragOver(false);
        await importProvidersFromFile(file);
      }}
    >
      {isFileDragOver && (
        <div className="pointer-events-none fixed inset-6 z-40 flex items-center justify-center rounded-3xl border-2 border-dashed border-[#1db7f7] bg-black/70 text-lg font-semibold text-white backdrop-blur-sm">
          {t("dragFileHere")}
        </div>
      )}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1db7f7]">{t("providers")}</p>
          <h1 aria-label={t("providersTitle")} className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t("providersTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t("providersSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const data = JSON.stringify(providers, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `providers-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.show(t("exportSuccess"), "success");
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-[#111] px-4 py-2.5 text-xs font-medium text-white transition duration-200 hover:border-[#1db7f7]/70 hover:bg-[#161616] hover:shadow-[0_0_26px_rgba(29,183,247,0.14)]"
          >
            <Download className="h-3.5 w-3.5" />
            {t("exportJson")}
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-[#111] px-4 py-2.5 text-xs font-medium text-white transition duration-200 hover:border-[#b600f8]/70 hover:bg-[#161616] hover:shadow-[0_0_26px_rgba(182,0,248,0.14)]">
            <Upload className="h-3.5 w-3.5" />
            {t("import")}
            <span className="sr-only">{t("import")}</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await importProvidersFromFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="mb-5">
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchProvider")}
          className="w-full max-w-md rounded-2xl border border-border bg-[#050505] px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-3xl border border-border bg-[#050505] p-5">
              <div className="h-5 w-1/3 rounded bg-[#111]" />
              <div className="h-4 w-2/3 rounded bg-[#111]" />
              <div className="h-4 w-1/2 rounded bg-[#111]" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-20 rounded bg-[#111]" />
                <div className="h-8 w-16 rounded bg-[#111]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-3">
          {filteredProviders.map((provider) => {
            const isExpanded = expandedId === provider.id;
            const modelCount = provider.models?.length ?? 0;
            const enabledModelCount = provider.enabled ? modelCount : 0;
            const testResult = testResults.get(provider.id);
            const apiType = provider.api ?? "unknown";
            const apiBadgeColor =
              apiType.includes("openai") ? "border-[#1db7f7]/35 bg-[#1db7f7]/10 text-[#8adfff]" :
              apiType.includes("anthropic") ? "border-[#b600f8]/35 bg-[#b600f8]/10 text-[#dfa0ff]" :
              apiType.includes("google") ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200" :
              apiType.includes("azure") ? "border-sky-400/35 bg-sky-400/10 text-sky-200" :
              "border-border bg-[#111] text-muted-foreground";
            const logo = getProviderLogo(provider);
            const visibleModels = provider.models?.slice(0, 3) ?? [];
            const hiddenModelCount = Math.max(0, modelCount - visibleModels.length);
            return (
              <div
                key={provider.id}
                data-testid={`provider-card-${provider.id}`}
                onDragOver={(e) => handleDragOver(e, provider.id)}
                onDrop={() => handleDrop(provider.id)}
                className={`group relative flex min-h-[112px] items-center gap-4 overflow-hidden rounded-3xl border border-[#222] bg-[#1f1f1f] px-5 py-4 transition duration-300 hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7_0%,#b600f8_100%)] hover:shadow-[0_20px_80px_rgba(29,183,247,0.24)] ${provider.enabled ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" : "opacity-70 hover:opacity-100"} ${dragOverId === provider.id && dragId !== provider.id ? "scale-[1.01] ring-2 ring-[#1db7f7]/70" : ""} ${dragId === provider.id ? "opacity-40" : ""}`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(provider.id)}
                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  aria-label={`Drag ${provider.name}`}
                  className="-ml-2 cursor-grab rounded-xl p-2 text-muted-foreground/60 transition duration-200 hover:bg-black/20 hover:text-white group-hover:text-white active:cursor-grabbing"
                >
                  <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-[#111] text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:border-white/25 group-hover:bg-black/20">
                  <ProviderLogo name={provider.name || provider.id} logo={logo} />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 max-w-full truncate text-lg font-semibold text-white">{provider.name}</h3>
                    {testResult !== undefined && (
                      <span className={testResult ? "text-xs text-emerald-400" : "text-xs text-red-400"}>●</span>
                    )}
                    <span className="shrink-0 rounded-full border border-[#1db7f7]/35 bg-[#1db7f7]/10 px-2 py-0.5 text-[11px] font-medium text-[#8adfff] group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
                      {modelCount} models, {enabledModelCount} enabled
                    </span>
                    <span title={provider.id} className={`min-w-0 max-w-[220px] truncate rounded-lg border px-2 py-0.5 font-mono text-[11px] font-medium group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white ${apiBadgeColor}`}>{provider.id}</span>
                    {provider.isBuiltIn && <span className="rounded border border-border bg-[#111] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">{t("builtIn")}</span>}
                    {!provider.enabled && <span className="rounded border border-yellow-300/25 bg-yellow-300/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-200 group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">{t("disabled")}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground min-w-0 group-hover:text-white/80">
                    <span className="truncate max-w-[360px]">{provider.baseUrl || t("notConfiguredUrl")}</span>
                  </div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
                    {visibleModels.length > 0 ? visibleModels.map((m) => (
                      <span key={m.id} title={m.id} className="min-w-0 max-w-[160px] truncate rounded-lg border border-border bg-[#111] px-2.5 py-1 font-mono text-[11px] text-muted-foreground group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white/90">
                        {getModelName(m)}
                      </span>
                    )) : (
                      <span className="rounded-lg border border-border bg-[#111] px-2.5 py-1 text-[11px] text-muted-foreground group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white/80">{t("noModels")}</span>
                    )}
                    {hiddenModelCount > 0 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : provider.id)} className="rounded-lg border border-[#1db7f7]/30 bg-[#1db7f7]/10 px-2.5 py-1 font-mono text-[11px] text-[#8adfff] transition hover:bg-white/10 group-hover:border-white/25 group-hover:text-white">
                        {isExpanded ? t("collapse") : t("moreModels", { count: hiddenModelCount })}
                      </button>
                    )}
                  </div>
                  {isExpanded && provider.models && provider.models.length > 3 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {provider.models.slice(3).map((m) => (
                        <span key={m.id} title={m.id} className="max-w-[180px] truncate rounded-lg border border-border bg-[#111] px-2 py-0.5 font-mono text-[11px] text-muted-foreground group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white/80">
                          {getModelName(m)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition duration-200 group-hover:border-white/25 group-hover:bg-black/20 group-hover:text-white ${provider.enabled ? "border border-[#1db7f7]/25 bg-[#1db7f7]/10 text-[#8adfff] hover:bg-[#1db7f7]/15" : "border border-border text-muted-foreground hover:bg-[#111]"}`}>
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={async (e) => {
                        await saveProvider({ ...provider, enabled: e.target.checked });
                        toast.show(e.target.checked ? t("applied") : t("removed"), "success");
                      }}
                      data-testid={`provider-enabled-${provider.id}`}
                      className="h-4 w-4 accent-[#1db7f7]"
                    />
                    {provider.enabled ? t("remove") : t("apply")}
                  </label>
                  <button
                    onClick={() => setLocation(`/provider/edit/${provider.id}`)}
                    aria-label={`${t("edit")} ${provider.name}`}
                    className="rounded-xl p-2 text-muted-foreground transition duration-200 hover:bg-black/20 hover:text-white group-hover:text-white/80"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard?.writeText(JSON.stringify(provider, null, 2));
                      toast.show(t("copiedProvider"), "success");
                    }}
                    aria-label={`${t("copy")} ${provider.name}`}
                    className="rounded-xl p-2 text-muted-foreground transition duration-200 hover:bg-black/20 hover:text-white group-hover:text-white/80"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTestModel(provider)}
                    aria-label={`${t("testModel")} ${provider.name}`}
                    className="rounded-xl p-2 text-muted-foreground transition duration-200 hover:bg-black/20 hover:text-white group-hover:text-white/80"
                  >
                    <FlaskConical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmId(provider.id)}
                    aria-label={`${t("delete")} ${provider.name}`}
                    className="rounded-xl p-2 text-muted-foreground transition duration-200 hover:bg-black/20 hover:text-red-100 group-hover:text-white/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredProviders.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-[#050505] py-16 text-center text-muted-foreground">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1db7f7]/20 to-[#b600f8]/20 text-3xl">π</div>
          <p className="text-base font-medium text-white">{t("emptyProviders")}</p>
          <p className="text-sm mt-1 opacity-60 mb-4">{t("emptyProvidersHint")}</p>
          <button
            onClick={() => setLocation("/provider/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1db7f7] to-[#b600f8] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            {t("addProvider")}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title={t("confirmDelete")}
          message={t("deleteProviderConfirm", { name: providers.find((p) => p.id === confirmId)?.name ?? confirmId })}
          onConfirm={() => {
            const provider = providers.find((p) => p.id === confirmId);
            if (provider) scheduleDeleteProvider(provider);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
