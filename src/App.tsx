import React, { useEffect, useState } from "react";
import { Route, Router, useLocation } from "wouter";
import { Bot, LayoutDashboard, Plus, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTheme } from "@/hooks/useTheme";
import Dashboard from "@/pages/Dashboard";
import ProviderEditor from "@/pages/ProviderEditor";
import Sync from "@/pages/Sync";
import ModelRoles from "@/pages/ModelRoles";
import Settings from "@/pages/Settings";
import Toast from "@/components/Toast";
import { getVersion } from "@tauri-apps/api/app";
import { useI18n } from "@/lib/i18n";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { shortcutLabel } from "@/lib/shortcutLabels";

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
  const { t } = useI18n();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
  }, []);

  useKeyboardShortcuts(
    {
      onNew: () => setLocation("/provider/new"),
    },
    [setLocation]
  );

  const navItems = [
    { path: "/", label: t("providers"), icon: LayoutDashboard },
    { path: "/roles", label: t("modelRoles"), icon: Bot },
    { path: "/sync", label: t("sync"), icon: RefreshCw },
    { path: "/settings", label: t("settings"), icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(path + "/");
  };

  const requestNavigate = (path: string) => {
    const event = new CustomEvent("omp:navigate", { cancelable: true, detail: { path } });
    if (window.dispatchEvent(event)) setLocation(path);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute right-[-220px] top-[-240px] z-0 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(29,183,247,0.16),rgba(182,0,248,0.08)_42%,transparent_70%)] blur-3xl" />
      <header className="relative z-40 flex h-16 items-center justify-between border-b border-[#222] bg-black/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="OMP Switch" className="h-8 w-8 rounded-lg" />
          <span className="h-5 w-px bg-[#222]" />
          <h1 className="translate-y-[2px] text-sm font-semibold tracking-[0.08em] text-white">OMP Switch</h1>
        </div>
      </header>

      {!isOnline && (
        <div className="relative z-50 w-full bg-amber-300 px-6 py-2 text-center text-sm font-medium text-amber-950">
          {t("networkOffline")}
        </div>
      )}

      <div className={`relative z-10 flex min-h-0 ${isOnline ? "h-[calc(100vh-64px-48px)]" : "h-[calc(100vh-64px-48px-36px)]"}`}>
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-[#222] bg-black/55 backdrop-blur-sm">
          <nav className="flex-1 space-y-1 p-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => requestNavigate(item.path)}
                aria-label={item.label}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#111] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    : "text-[#888] hover:bg-[#111]/70 hover:text-white"
                }`}
              >
                {active && <span className="pi-gradient-bg absolute bottom-0 left-0 top-0 w-1" />}
                <Icon className={`h-5 w-5 ${active ? "text-[#1db7f7]" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
          <div className="p-6 pt-0">
            <button
              onClick={() => requestNavigate("/provider/new")}
              aria-label={t("addProvider")}
              className="pi-gradient-bg flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(29,183,247,0.22)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              {t("addProvider")}
            </button>
            <div className="mt-6 border-t border-[#222] pt-4 font-mono text-[10px] uppercase tracking-wider text-[#888]/60">
              {version ? `v.${version}-BETA` : "v.BETA"}
            </div>
            <div className="mt-4 space-y-1 border-t border-[#222] pt-4 font-mono text-[10px] uppercase tracking-wider text-[#888]/60">
              <div>{shortcutLabel("n")} {t("ctrlN")}</div>
              <div>{shortcutLabel("k")} {t("ctrlK")}</div>
              <div>{shortcutLabel("s")} {t("ctrlS")}</div>
            </div>
          </div>
      </aside>
        <main className="flex-1 overflow-y-auto bg-transparent">
        <PageWrapper key={location}>{children}</PageWrapper>
      </main>
      </div>
      <footer className="relative z-50 flex h-12 items-center border-t border-[#222] bg-[#050505] px-6 font-mono text-[10px] uppercase tracking-wider text-[#888]/50">
        <span className="ml-auto">{version ? `v.${version}-BETA` : "v.BETA"}</span>
      </footer>
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
        <Route path="/roles" component={ModelRoles} />
        <Route path="/sync" component={Sync} />
        <Route path="/settings" component={Settings} />
      </Layout>
      <Toast />
    </Router>
  );
}

export default App;
