import { useEffect, useState, useRef } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation } from "wouter";
import { Plus, ArrowRight, Pencil, Trash2, Download, Upload, GripVertical, Copy, FlaskConical, BarChart3 } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { validateProviderImport } from "@/lib/importValidation";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Dashboard() {
  const { providers, fetchProviders, deleteProvider, saveProvider, isLoading } = useProviderStore();
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
  }, [fetchProviders]);

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
        <h1 className="text-2xl font-bold">供应商管理</h1>
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
        </div>
      </div>

      <div className="mb-4">
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索供应商 (名称/ID/接口格式)..."
          className="w-full max-w-md px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3">
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
        <div className="grid grid-cols-1 gap-3">
          {filteredProviders.map((provider) => {
            const isExpanded = expandedId === provider.id;
            const modelCount = provider.models?.length ?? 0;
            const apiType = provider.api ?? "unknown";
            const apiBadgeColor =
              apiType.includes("openai") ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
              apiType.includes("anthropic") ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
              apiType.includes("google") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
              apiType.includes("azure") ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" :
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
            const initial = provider.name.trim().charAt(0).toUpperCase() || provider.id.charAt(0).toUpperCase();
            const modelSummary = modelCount > 0 ? `${modelCount} 个模型` : "未配置模型";
            return (
              <div
                key={provider.id}
                data-testid={`provider-card-${provider.id}`}
                draggable
                onDragStart={() => handleDragStart(provider.id)}
                onDragOver={(e) => handleDragOver(e, provider.id)}
                onDrop={() => handleDrop(provider.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                className={`group min-h-[104px] border rounded-2xl px-5 py-4 transition-all cursor-move flex items-center gap-4 ${provider.enabled ? "border-primary/45 bg-gradient-to-r from-primary/10 via-background to-background hover:border-primary hover:shadow-sm" : "border-border bg-muted/20 opacity-80 hover:opacity-100 hover:border-primary/50"} ${dragOverId === provider.id && dragId !== provider.id ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : ""} ${dragId === provider.id ? "opacity-40" : ""}`}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground/70 shrink-0" />
                <div className="w-12 h-12 rounded-2xl border bg-muted/50 flex items-center justify-center text-lg font-semibold text-muted-foreground shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{provider.name}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${apiBadgeColor}`}>{provider.id}</span>
                    {provider.isBuiltIn && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">内置</span>}
                    {!provider.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 font-medium">未应用</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <span className="truncate max-w-[360px]">{provider.baseUrl || "未配置官网地址"}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <button onClick={() => setExpandedId(isExpanded ? null : provider.id)} className="hover:text-foreground transition-colors shrink-0">
                      {isExpanded ? "收起" : modelSummary}
                    </button>
                  </div>
                  {isExpanded && provider.models && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {provider.models.slice(0, 8).map((m) => (
                        <span key={m.id} className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className={`text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${provider.enabled ? "bg-orange-500/15 text-orange-600 hover:bg-orange-500/20" : "border hover:bg-muted"}`}>
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={async (e) => {
                        await saveProvider({ ...provider, enabled: e.target.checked });
                        toast.show(e.target.checked ? "已应用配置" : "已移除配置", "success");
                      }}
                      data-testid={`provider-enabled-${provider.id}`}
                      className="h-4 w-4 accent-primary"
                    />
                    {provider.enabled ? "移除" : "应用"}
                  </label>
                  <button
                    onClick={() => setLocation(`/provider/edit/${provider.id}`)}
                    aria-label={`编辑 ${provider.name}`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard?.writeText(JSON.stringify(provider, null, 2));
                      toast.show("已复制供应商配置", "success");
                    }}
                    aria-label={`复制 ${provider.name}`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast.show("测试模型功能待接入", "success")}
                    aria-label={`测试模型 ${provider.name}`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <FlaskConical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                    aria-label={`查看模型 ${provider.name}`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmId(provider.id)}
                    aria-label={`删除 ${provider.name}`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-base font-medium">暂无供应商</p>
          <p className="text-sm mt-1 opacity-60 mb-4">添加第一个 AI 供应商开始配置</p>
          <button
            onClick={() => setLocation("/provider/new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm transition-opacity"
          >
            <Plus className="w-4 h-4" />
            添加供应商
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
