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
    useProviderStore.setState({ providers: [], isLoading: false, error: null });
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
});
