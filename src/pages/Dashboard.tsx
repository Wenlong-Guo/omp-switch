import { useEffect, useState, useRef } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation } from "wouter";
import { Plus, ArrowRight, Star, Pencil, Trash2, Download, Upload } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { validateProviderImport } from "@/lib/importValidation";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Dashboard() {
  const { providers, fetchProviders, deleteProvider, setActiveProvider, saveProvider, isLoading } = useProviderStore();
  const { settings, fetchSettings } = useSettingsStore();
  const toast = useToastStore();
  const [, setLocation] = useLocation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderedProviders, setOrderedProviders] = useState<typeof providers>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrderedProviders(providers);
  }, [providers]);

  useKeyboardShortcuts({
    onSearch: () => {
      searchRef.current?.focus();
    },
  });

  useEffect(() => {
    fetchProviders();
    fetchSettings();
  }, [fetchProviders, fetchSettings]);

  const filteredProviders = orderedProviders.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.api ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Provider 管理</h1>
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
              toast.show("导出成功", "success");
            }}
            className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            导出 JSON
          </button>
          <label className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            导入 JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const imported = JSON.parse(text);
                  const result = validateProviderImport(imported);
                  if (!result.valid) {
                    toast.show(`导入失败：${result.error}`, "error");
                    return;
                  }
                  for (const p of result.providers) {
                    await saveProvider?.(p);
                  }
                  toast.show(`导入成功 ${result.providers.length} 个 Provider`, "success");
                  fetchProviders();
                } catch {
                  toast.show("导入失败", "error");
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="text-sm text-muted-foreground">
            默认: {settings?.defaultProvider ?? "未设置"}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索 Provider (名称/ID/API)...  ⌘K"
          className="w-full max-w-md px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-muted rounded w-20" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => {
            const isExpanded = expandedId === provider.id;
            const modelCount = provider.models?.length ?? 0;
            const apiType = provider.api ?? "unknown";
            const apiColor =
              apiType.includes("openai") ? "border-l-blue-500" :
              apiType.includes("anthropic") ? "border-l-amber-500" :
              apiType.includes("google") ? "border-l-emerald-500" :
              apiType.includes("azure") ? "border-l-sky-600" :
              "border-l-slate-400";
            const apiBadgeColor =
              apiType.includes("openai") ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
              apiType.includes("anthropic") ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
              apiType.includes("google") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
              apiType.includes("azure") ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" :
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
            return (
              <div
                key={provider.id}
                data-testid={`provider-card-${provider.id}`}
                draggable
                onDragStart={() => handleDragStart(provider.id)}
                onDragOver={(e) => handleDragOver(e, provider.id)}
                onDrop={() => handleDrop(provider.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-move border-l-4 ${apiColor} ${provider.enabled ? "border-border bg-background" : "border-dashed opacity-60 bg-muted/20"} ${dragOverId === provider.id && dragId !== provider.id ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : ""} ${dragId === provider.id ? "opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{provider.name}</h3>
                    {provider.isBuiltIn && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        内置
                      </span>
                    )}
                    {!provider.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 font-medium">
                        已停用
                      </span>
                    )}
                  </div>
                  {settings?.defaultProvider === provider.id && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                      默认
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${apiBadgeColor}`}>
                    {apiType}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{provider.baseUrl ?? "无 baseUrl"}</span>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors"
                >
                  <span>{isExpanded ? "▼" : "▶"}</span>
                  <span className="font-medium">{modelCount}</span>
                  <span>个模型</span>
                </button>
                {isExpanded && provider.models && (
                  <div className="mb-3 p-2 bg-muted/50 rounded-md text-sm space-y-1">
                    {provider.models.map((m) => (
                      <div key={m.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span className="font-medium text-foreground">{m.name}</span>
                        <span className="truncate">({m.id})</span>
                        {m.reasoning && <span className="text-[10px] bg-secondary px-1 rounded">reasoning</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if ((provider.models?.length ?? 0) === 0) {
                        toast.show("该 Provider 没有模型，无法设为默认", "error");
                        return;
                      }
                      try {
                        const firstModelId = provider.models?.[0]?.id;
                        await setActiveProvider(provider.id, firstModelId);
                        toast.show("已设为默认 Provider", "success");
                      } catch {
                        toast.show("设置失败", "error");
                      }
                    }}
                    disabled={settings?.defaultProvider === provider.id}
                    className={`text-sm px-3 py-1.5 rounded-md transition-opacity flex items-center gap-1 ${
                      settings?.defaultProvider === provider.id
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {settings?.defaultProvider === provider.id ? "当前默认" : "设为默认"}
                  </button>
                  <button
                    onClick={() => setLocation(`/provider/edit/${provider.id}`)}
                    className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => setConfirmId(provider.id)}
                    className="text-sm px-3 py-1.5 border rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredProviders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-base font-medium">暂无 Provider</p>
          <p className="text-sm mt-1 opacity-60 mb-4">添加第一个 AI Provider 开始配置</p>
          <button
            onClick={() => setLocation("/provider/new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm transition-opacity"
          >
            <Plus className="w-4 h-4" />
            添加 Provider
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除 "${providers.find((p) => p.id === confirmId)?.name ?? confirmId}"？此操作不可撤销。`}
          onConfirm={async () => {
            try {
              await deleteProvider(confirmId);
              toast.show("删除成功", "success");
            } catch {
              toast.show("删除失败", "error");
            }
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
