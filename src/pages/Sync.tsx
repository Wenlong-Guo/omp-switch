import { useEffect, useState, useRef } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { useToastStore } from "@/stores/toastStore";
import {
  ArrowLeft, RefreshCw, Cloud, Link2, User, Lock, FolderOpen,
  TestTube2, Save, Upload, Download, AlertCircle, CheckCircle2,
  Info, Wifi
} from "lucide-react";
import { useLocation } from "wouter";
import type { SyncConfig } from "@/types/sync";

export default function Sync() {
  const { config, fetchConfig, saveConfig, testConnection, triggerSync, isSyncing } = useSyncStore();
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
      addToast(ok ? "连接成功" : "连接失败", ok ? "success" : "error");
    } catch (e) {
      setTestResult(false);
      addToast("测试连接出错: " + String(e), "error");
    }
  };

  const handleSave = async () => {
    try {
      await saveConfig(form);
      addToast("配置已保存", "success");
    } catch (e) {
      addToast("保存失败: " + String(e), "error");
    }
  };

  const handleSync = async (direction: "upload" | "download") => {
    try {
      await triggerSync(direction);
      addToast(direction === "upload" ? "上传成功" : "下载成功", "success");
      await fetchConfig();
    } catch (e) {
      addToast("同步失败: " + String(e), "error");
    }
  };

  const isPasswordPlaceholder = config?.password === "***";

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
        {/* Status Card */}
        {config?.lastSyncAt && (
          <div className="bg-muted/20 rounded-lg p-4 border flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <span className="text-muted-foreground">最后同步:</span>{" "}
              <span className="font-medium">{new Date(config.lastSyncAt).toLocaleString("zh-CN")}</span>
              {config.lastSyncStatus && (
                <span className={`ml-2 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                  config.lastSyncStatus.includes("success")
                    ? "bg-green-900/40 text-green-400"
                    : "bg-red-900/40 text-red-400"
                }`}>
                  {config.lastSyncStatus.includes("success") ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {config.lastSyncStatus}
                </span>
              )}
            </div>
          </div>
        )}

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
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                passwordEdited.current = true;
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder={isPasswordPlaceholder ? "已保存 (留空保持不变)" : ""}
            />
            {isPasswordPlaceholder && !passwordEdited.current && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                密码已加密保存，如需修改请直接输入新密码
              </p>
            )}
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
            <div className={`p-2.5 rounded-md text-sm flex items-center gap-2 border ${testResult ? "bg-green-900/30 text-green-400 border-green-800" : "bg-red-900/30 text-red-400 border-red-800"}`}>
              {testResult ? <CheckCircle2 className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              {testResult ? "连接成功" : "连接失败"}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTest}
            disabled={isSyncing}
            className="px-4 py-2.5 border rounded-md hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 text-sm transition-colors"
          >
            <TestTube2 className="w-4 h-4" />
            测试连接
          </button>
          <button
            onClick={handleSave}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium transition-opacity"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={() => handleSync("upload")}
            disabled={isSyncing}
            className="px-4 py-2.5 border rounded-md hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isSyncing ? "同步中..." : "上传"}
          </button>
          <button
            onClick={() => handleSync("download")}
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
