import { useEffect, useState } from "react";
import { useSyncStore } from "@/stores/syncStore";
import type { SyncConfig } from "@/types/sync";

export default function Sync() {
  const { config, fetchConfig, saveConfig, testConnection, triggerSync, isSyncing } = useSyncStore();
  const [form, setForm] = useState<SyncConfig>({
    enabled: false,
    serverUrl: "",
    username: "",
    password: "",
    remotePath: "/omp-switch.db",
  });
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const handleTest = async () => {
    const ok = await testConnection();
    setTestResult(ok);
  };

  const handleSave = async () => {
    await saveConfig(form);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">WebDAV 同步</h1>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            id="syncEnabled"
          />
          <label htmlFor="syncEnabled" className="text-sm font-medium">启用同步</label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">服务器地址</label>
          <input
            value={form.serverUrl}
            onChange={(e) => setForm({ ...form, serverUrl: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://dav.jianguoyun.com/dav/"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">用户名</label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">远程路径</label>
          <input
            value={form.remotePath}
            onChange={(e) => setForm({ ...form, remotePath: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {testResult !== null && (
          <div className={`p-2 rounded text-sm ${testResult ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {testResult ? "连接成功" : "连接失败"}
          </div>
        )}

        {config?.lastSyncAt && (
          <div className="text-sm text-muted-foreground">
            最后同步: {config.lastSyncAt}
            {config.lastSyncStatus && ` (${config.lastSyncStatus})`}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            className="px-4 py-2 border rounded hover:bg-muted"
          >
            测试连接
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            保存配置
          </button>
          <button
            onClick={() => triggerSync("upload")}
            disabled={isSyncing}
            className="px-4 py-2 border rounded hover:bg-muted disabled:opacity-50"
          >
            {isSyncing ? "同步中..." : "上传"}
          </button>
          <button
            onClick={() => triggerSync("download")}
            disabled={isSyncing}
            className="px-4 py-2 border rounded hover:bg-muted disabled:opacity-50"
          >
            {isSyncing ? "同步中..." : "下载"}
          </button>
        </div>
      </div>
    </div>
  );
}
