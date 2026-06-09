import React, { useEffect, useState } from "react";
import { Route, Router, useLocation } from "wouter";
import { LayoutDashboard, Plus, Settings as SettingsIcon, RefreshCw } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import ProviderEditor from "@/pages/ProviderEditor";
import Settings from "@/pages/Settings";
import Sync from "@/pages/Sync";
import Toast from "@/components/Toast";
import { getVersion } from "@tauri-apps/api/app";

function PageWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, [children]);
  return (
    <div
      className={`transition-all duration-300 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {children}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/provider/new", label: "添加 Provider", icon: Plus },
    { path: "/settings", label: "设置", icon: SettingsIcon },
    { path: "/sync", label: "同步", icon: RefreshCw },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 border-r bg-muted/30 flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold tracking-tight">omp-switch</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{version ? `v${version}` : ""}</p>
        </div>
        <nav className="px-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-muted-foreground border-t">
          AI Provider 配置管理
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <PageWrapper key={location}>{children}</PageWrapper>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Route path="/" component={Dashboard} />
        <Route path="/provider/new" component={ProviderEditor} />
        <Route path="/provider/edit/:id" component={ProviderEditor} />
        <Route path="/settings" component={Settings} />
        <Route path="/sync" component={Sync} />
      </Layout>
      <Toast />
    </Router>
  );
}

export default App;
