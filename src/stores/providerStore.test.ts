import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useProviderStore } from "./providerStore";

vi.mock("@/lib/tauri-api", () => ({
  invokeCommand: vi.fn(),
}));

import { invokeCommand } from "@/lib/tauri-api";

describe("providerStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProviderStore.setState({ providers: [], builtinPresets: [], isLoading: false, error: null });
  });

  it("has initial empty state", () => {
    const state = useProviderStore.getState();
    expect(state.providers).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchProviders loads data", async () => {
    const mockProviders = [{ id: "test", name: "Test", enabled: true, isBuiltIn: false }];
    vi.mocked(invokeCommand).mockResolvedValueOnce(mockProviders);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().providers).toEqual(mockProviders);
    expect(useProviderStore.getState().isLoading).toBe(false);
  });

  it("fetchProviders handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().error).toBe("Error: Failed");
    expect(useProviderStore.getState().isLoading).toBe(false);
  });

  it("saveProvider refreshes list", async () => {
    vi.mocked(invokeCommand)
      .mockResolvedValueOnce({ id: "test", name: "Test" })
      .mockResolvedValueOnce([{ id: "test", name: "Test", enabled: true, isBuiltIn: false }]);
    await act(async () => {
      await useProviderStore.getState().saveProvider({ id: "test", name: "Test", enabled: true, isBuiltIn: false });
    });
    expect(invokeCommand).toHaveBeenCalledWith("save_provider", expect.any(Object));
  });

  it("deleteProvider refreshes list", async () => {
    vi.mocked(invokeCommand)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([]);
    await act(async () => {
      await useProviderStore.getState().deleteProvider("test");
    });
    expect(invokeCommand).toHaveBeenCalledWith("delete_provider", { id: "test" });
  });

  it("setActiveProvider calls IPC", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(undefined);
    await act(async () => {
      await useProviderStore.getState().setActiveProvider("test");
    });
    expect(invokeCommand).toHaveBeenCalledWith("set_active_provider", { providerId: "test", modelId: undefined });
  });

  it("setActiveProvider with modelId", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(undefined);
    await act(async () => {
      await useProviderStore.getState().setActiveProvider("test", "model-1");
    });
    expect(invokeCommand).toHaveBeenCalledWith("set_active_provider", { providerId: "test", modelId: "model-1" });
  });

  it("sets loading during fetch", async () => {
    vi.mocked(invokeCommand).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 10)));
    act(() => {
      useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().isLoading).toBe(true);
  });

  it("clears error on new operation", async () => {
    useProviderStore.setState({ error: "Previous error" });
    vi.mocked(invokeCommand).mockResolvedValueOnce([]);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().error).toBeNull();
  });

  it("handles empty provider list", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce([]);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().providers).toEqual([]);
  });

  it("handles provider with null fields", async () => {
    const mockProvider = { id: "test", name: "Test", enabled: true, isBuiltIn: false, apiKey: null, baseUrl: null };
    vi.mocked(invokeCommand).mockResolvedValueOnce([mockProvider]);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().providers[0].apiKey).toBeNull();
  });

  it("saveProvider with model id", async () => {
    vi.mocked(invokeCommand)
      .mockResolvedValueOnce({ id: "test", name: "Test" })
      .mockResolvedValueOnce([{ id: "test", name: "Test", enabled: true, isBuiltIn: false }]);
    await act(async () => {
      await useProviderStore.getState().saveProvider({ id: "test", name: "Test", enabled: true, isBuiltIn: false });
    });
    expect(useProviderStore.getState().error).toBeNull();
  });

  it("multiple fetchProviders calls", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "test", name: "Test" }]);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().providers.length).toBe(1);
  });

  it("fetchBuiltinPresets loads presets", async () => {
    const mockPresets = [{ id: "openai", name: "OpenAI", enabled: true, isBuiltIn: true }];
    vi.mocked(invokeCommand).mockResolvedValueOnce(mockPresets);
    await act(async () => {
      await useProviderStore.getState().fetchBuiltinPresets();
    });
    expect(useProviderStore.getState().builtinPresets).toEqual(mockPresets);
    expect(useProviderStore.getState().isLoading).toBe(false);
  });

  it("fetchBuiltinPresets handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await useProviderStore.getState().fetchBuiltinPresets();
    });
    expect(useProviderStore.getState().error).toBe("Error: Failed");
    expect(useProviderStore.getState().isLoading).toBe(false);
  });

  it("saveProvider with model containing advanced fields", async () => {
    const provider = {
      id: "test",
      name: "Test",
      enabled: true,
      isBuiltIn: false,
      authHeader: true,
      models: [{
        id: "gpt-4o",
        name: "GPT-4o",
        reasoning: true,
        input: ["text", "image"] as ("text" | "image")[],
        cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 5 },
        contextWindow: 128000,
        maxTokens: 4096,
        family: "gpt-4",
        status: "beta" as const,
        temperature: true,
        toolCall: true,
      }],
    };
    vi.mocked(invokeCommand)
      .mockResolvedValueOnce(provider)
      .mockResolvedValueOnce([provider]);
    await act(async () => {
      await useProviderStore.getState().saveProvider(provider);
    });
    expect(invokeCommand).toHaveBeenCalledWith("save_provider", expect.any(Object));
    expect(useProviderStore.getState().error).toBeNull();
  });

  it("fetchProviders returns models with new fields", async () => {
    const mockProvider = {
      id: "test",
      name: "Test",
      enabled: true,
      isBuiltIn: false,
      models: [{
        id: "gpt-4o",
        name: "GPT-4o",
        reasoning: true,
        input: ["text"] as ("text" | "image")[],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 16384,
        family: "gpt-4",
        status: "beta" as const,
      }],
    };
    vi.mocked(invokeCommand).mockResolvedValueOnce([mockProvider]);
    await act(async () => {
      await useProviderStore.getState().fetchProviders();
    });
    expect(useProviderStore.getState().providers[0].models?.[0].family).toBe("gpt-4");
  });

  it("provider state includes authHeader field", async () => {
    const provider = { id: "test", name: "Test", enabled: true, isBuiltIn: false, authHeader: true };
    vi.mocked(invokeCommand)
      .mockResolvedValueOnce(provider)
      .mockResolvedValueOnce([provider]);
    await act(async () => {
      await useProviderStore.getState().saveProvider(provider);
    });
    expect(useProviderStore.getState().providers[0].authHeader).toBe(true);
  });
});
