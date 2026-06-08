import { create } from "zustand";
import type { SyncConfig, SyncResult } from "@/types/sync";
import { invokeCommand } from "@/lib/tauri-api";

interface SyncStore {
  config: SyncConfig | null;
  isSyncing: boolean;
  error: string | null;

  fetchConfig: () => Promise<void>;
  saveConfig: (config: SyncConfig) => Promise<void>;
  testConnection: () => Promise<boolean>;
  triggerSync: (direction: "upload" | "download") => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set) => ({
  config: null,
  isSyncing: false,
  error: null,

  fetchConfig: async () => {
    set({ error: null });
    try {
      const config = await invokeCommand<SyncConfig | null>("get_sync_config");
      set({ config });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  saveConfig: async (config) => {
    set({ error: null });
    try {
      await invokeCommand<void>("save_sync_config", { config });
      set({ config });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  testConnection: async () => {
    set({ error: null });
    try {
      const ok = await invokeCommand<boolean>("test_sync_connection");
      return ok;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  triggerSync: async (direction) => {
    set({ isSyncing: true, error: null });
    try {
      const result = await invokeCommand<SyncResult>("trigger_sync", { direction });
      if (!result.success) {
        set({ error: result.message });
      }
      set({ isSyncing: false });
    } catch (err) {
      set({ error: String(err), isSyncing: false });
    }
  },
}));
