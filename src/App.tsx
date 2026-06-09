import React, { useEffect, useState } from "react";
import { Route, Router, useLocation } from "wouter";
import { useTheme } from "@/hooks/useTheme";
import Dashboard from "@/pages/Dashboard";
import ProviderEditor from "@/pages/ProviderEditor";
import Settings from "@/pages/Settings";
import Sync from "@/pages/Sync";
import Toast from "@/components/Toast";
import SearchDialog from "@/components/SearchDialog";
import { getVersion } from "@tauri-apps/api/app";

function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [version, setVersion] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/provider/new", label: "添加 Provider" },
    { path: "/settings", label: "设置" },
    { path: "/sync", label: "同步" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-muted/30">
        <div className="p-4">
          <h1 className="text-lg font-bold">omp-switch</h1>
          <p className="text-xs text-muted-foreground">{version ? `v${version}` : ""}</p>
        </div>
        <nav className="px-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full text-left px-3 py-2 rounded text-sm mb-1 ${
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 mt-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              搜索
            </span>
            <kbd className="text-[10px] px-1 border rounded bg-background">⌘K</kbd>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function App() {
  useTheme();
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
