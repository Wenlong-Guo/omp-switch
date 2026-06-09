import { useEffect, useState } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { ArrowLeft, RefreshCw, Cloud, Link2, User, Lock, FolderOpen, TestTube2, Save, Upload, Download } from "lucide-react";
import { useLocation } from "wouter";
import type { SyncConfig } from "@/types/sync";

export default function Sync() {
  const { config, fetchConfig, saveConfig, testConnection, triggerSync, isSyncing } = useSyncStore();
  const [, setLocation] = useLocation();
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
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setLocation("/")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">WebDAV 同步</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/20 rounded-lg p-4 space-y-4 border">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="syncEnabled"
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="syncEnabled" className="text-sm font-medium flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
              启用同步
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              服务器地址
            </label>
            <input
              value={form.serverUrl}
              onChange={(e) => setForm({ ...form, serverUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="https://dav.jianguoyun.com/dav/"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              用户名
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
              远程路径
            </label>
            <input
              value={form.remotePath}
              onChange={(e) => setForm({ ...form, remotePath: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {testResult !== null && (
            <div className={`p-2.5 rounded-md text-sm flex items-center gap-2 border ${testResult ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
              {testResult ? <RefreshCw className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {testResult ? "连接成功" : "连接失败"}
            </div>
          )}

          {config?.lastSyncAt && (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              最后同步: {config.lastSyncAt}
              {config.lastSyncStatus && ` (${config.lastSyncStatus})`}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            className="px-4 py-2.5 border rounded-md hover:bg-muted flex items-center gap-1.5 text-sm transition-colors"
          >
            <TestTube2 className="w-4 h-4" />
            测试连接
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1.5 text-sm font-medium transition-opacity"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={() => triggerSync("upload")}
            disabled={isSyncing}
            className="px-4 py-2.5 border rounded-md hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isSyncing ? "同步中..." : "上传"}
          </button>
          <button
            onClick={() => triggerSync("download")}
            disabled={isSyncing}
            className="px-4 py-2.5 border rounded-md hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {isSyncing ? "同步中..." : "下载"}
          </button>
        </div>
      </div>
    </div>
  );
}
