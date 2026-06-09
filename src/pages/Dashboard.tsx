import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useToastStore } from "@/stores/toastStore";
import { useLocation } from "wouter";
import { Plus, Pencil, Trash2, Star, Server, ExternalLink, ArrowRight } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Dashboard() {
  const { providers, fetchProviders, deleteProvider, setActiveProvider, isLoading } = useProviderStore();
  const { settings, fetchSettings } = useSettingsStore();
  const toast = useToastStore();
  const [, setLocation] = useLocation();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
    fetchSettings();
  }, [fetchProviders, fetchSettings]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Provider 管理</h1>
        <div className="text-sm text-muted-foreground">
          默认: {settings?.defaultProvider ?? "未设置"}
        </div>
      </div>

      {isLoading && <LoadingSpinner text="加载 Provider 列表..." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`group border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
              provider.enabled ? "border-border bg-background" : "border-dashed opacity-60 bg-muted/20"
            } ${settings?.defaultProvider === provider.id ? "ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">{provider.name}</h3>
              </div>
              {settings?.defaultProvider === provider.id && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  默认
                </span>
              )}
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{provider.api ?? "未配置 API"}</span>
              </p>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {provider.baseUrl ?? "无 baseUrl"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveProvider(provider.id)}
                disabled={settings?.defaultProvider === provider.id}
                className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-opacity"
              >
                <Star className="w-3.5 h-3.5" />
                设为默认
              </button>
              <button
                onClick={() => setLocation(`/provider/edit/${provider.id}`)}
                className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted flex items-center gap-1 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑
              </button>
              <button
                onClick={() => setConfirmId(provider.id)}
                className="text-sm px-3 py-1.5 border rounded-md hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Server className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2 font-medium">暂无 Provider</p>
          <p className="text-sm text-muted-foreground/60 mb-4">添加第一个 AI Provider 开始配置</p>
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
