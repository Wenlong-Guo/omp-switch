import React, { useEffect, useState } from "react";
import { Route, Router, useLocation } from "wouter";
import Dashboard from "@/pages/Dashboard";
import ProviderEditor from "@/pages/ProviderEditor";
import Settings from "@/pages/Settings";
import Sync from "@/pages/Sync";
import Toast from "@/components/Toast";
import { getVersion } from "@tauri-apps/api/app";

function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
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
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
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
