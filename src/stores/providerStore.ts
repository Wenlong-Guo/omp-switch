import { create } from "zustand";
import type { ProviderConfig } from "@/types/provider";
import { invokeCommand } from "@/lib/tauri-api";

interface ProviderStore {
  providers: ProviderConfig[];
  activeProviderId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchProviders: () => Promise<void>;
  saveProvider: (config: ProviderConfig) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string, modelId?: string) => Promise<void>;
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  providers: [],
  activeProviderId: null,
  isLoading: false,
  error: null,

  fetchProviders: async () => {
    set({ isLoading: true, error: null });
    try {
      const providers = await invokeCommand<ProviderConfig[]>("get_providers");
      set({ providers, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  saveProvider: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await invokeCommand<ProviderConfig>("save_provider", { config });
      await get().fetchProviders();
      set({ isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  deleteProvider: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invokeCommand<void>("delete_provider", { id });
      await get().fetchProviders();
      set({ isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  setActiveProvider: async (id, modelId) => {
    set({ isLoading: true, error: null });
    try {
      await invokeCommand<void>("set_active_provider", { providerId: id, modelId });
      set({ activeProviderId: id, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },
}));
