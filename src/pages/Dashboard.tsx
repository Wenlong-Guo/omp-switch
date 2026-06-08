import { useEffect } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function Dashboard() {
  const { providers, fetchProviders, deleteProvider, setActiveProvider, isLoading } = useProviderStore();
  const { settings, fetchSettings } = useSettingsStore();

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

      {isLoading && <p className="text-muted-foreground">加载中...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`border rounded-lg p-4 ${provider.enabled ? "border-border" : "border-dashed opacity-60"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{provider.name}</h3>
              {settings?.defaultProvider === provider.id && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  默认
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{provider.api ?? "未配置 API"}</p>
            <p className="text-sm text-muted-foreground mb-3 truncate">{provider.baseUrl ?? "无 baseUrl"}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveProvider(provider.id)}
                className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                设为默认
              </button>
              <button
                onClick={() => deleteProvider(provider.id)}
                className="text-sm px-3 py-1.5 border rounded hover:bg-destructive hover:text-destructive-foreground"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          暂无 Provider，点击上方添加
        </div>
      )}
    </div>
  );
}
