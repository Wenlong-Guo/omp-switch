import { create } from "zustand";
import type { AppSettings } from "@/types/settings";
import { invokeCommand } from "@/lib/tauri-api";

interface SettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invokeCommand<AppSettings | null>("get_settings");
      set({ settings, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  saveSettings: async (settings) => {
    set({ isLoading: true, error: null });
    try {
      await invokeCommand<void>("save_settings", { settings });
      set({ settings, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
