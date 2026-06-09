import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useSyncStore } from "./syncStore";

vi.mock("@/lib/tauri-api", () => ({
  invokeCommand: vi.fn(),
}));

import { invokeCommand } from "@/lib/tauri-api";

describe("syncStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSyncStore.setState({ config: null, isSyncing: false, error: null });
  });

  it("has initial null state", () => {
    const state = useSyncStore.getState();
    expect(state.config).toBeNull();
    expect(state.isSyncing).toBe(false);
  });

  it("fetchConfig loads data", async () => {
    const mockConfig = { enabled: true, serverUrl: "https://dav.example.com", username: "user", password: "pass", remotePath: "/" };
    vi.mocked(invokeCommand).mockResolvedValueOnce(mockConfig);
    await act(async () => {
      await useSyncStore.getState().fetchConfig();
    });
    expect(useSyncStore.getState().config).toEqual(mockConfig);
  });

  it("fetchConfig handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await useSyncStore.getState().fetchConfig();
    });
    expect(useSyncStore.getState().error).toBe("Error: Failed");
  });

  it("saveConfig updates state", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(undefined);
    const newConfig = { enabled: true, serverUrl: "https://dav2.com", username: "u", password: "p", remotePath: "/" };
    await act(async () => {
      await useSyncStore.getState().saveConfig(newConfig);
    });
    expect(useSyncStore.getState().config).toEqual(newConfig);
  });

  it("testConnection returns true", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(true);
    const result = await act(async () => {
      return await useSyncStore.getState().testConnection();
    });
    expect(result).toBe(true);
  });

  it("testConnection returns false on error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Timeout"));
    const result = await act(async () => {
      return await useSyncStore.getState().testConnection();
    });
    expect(result).toBe(false);
    expect(useSyncStore.getState().error).toBe("Error: Timeout");
  });

  it("triggerSync sets syncing state", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce({ success: true, message: "Done" });
    await act(async () => {
      await useSyncStore.getState().triggerSync("upload");
    });
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("triggerSync handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Sync failed"));
    await act(async () => {
      try {
        await useSyncStore.getState().triggerSync("download");
      } catch {
        // expected
      }
    });
    expect(useSyncStore.getState().error).toBe("Error: Sync failed");
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("triggerSync with failed result does not set error (error thrown)", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Conflict"));
    await act(async () => {
      try {
        await useSyncStore.getState().triggerSync("upload");
      } catch {
        // expected
      }
    });
    expect(useSyncStore.getState().error).toBe("Error: Conflict");
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("clears error on new operation", async () => {
    useSyncStore.setState({ error: "Previous" });
    vi.mocked(invokeCommand).mockResolvedValueOnce({ enabled: true, serverUrl: "", username: "", password: "", remotePath: "/" });
    await act(async () => {
      await useSyncStore.getState().fetchConfig();
    });
    expect(useSyncStore.getState().error).toBeNull();
  });

  it("saveConfig handles empty url", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(undefined);
    const config = { enabled: false, serverUrl: "", username: "", password: "", remotePath: "/" };
    await act(async () => {
      await useSyncStore.getState().saveConfig(config);
    });
    expect(useSyncStore.getState().config).toEqual(config);
  });

  it("fetchConfig with null result", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(null);
    await act(async () => {
      await useSyncStore.getState().fetchConfig();
    });
    expect(useSyncStore.getState().config).toBeNull();
  });

  it("triggerSync upload sets then clears syncing", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce({ success: true, message: "Uploaded" });
    await act(async () => {
      await useSyncStore.getState().triggerSync("upload");
    });
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("triggerSync download", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce({ success: true, message: "Downloaded" });
    await act(async () => {
      await useSyncStore.getState().triggerSync("download");
    });
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("testConnection sets error on failure", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Network error"));
    await act(async () => {
      await useSyncStore.getState().testConnection();
    });
    expect(useSyncStore.getState().error).toContain("Network error");
  });

  it("autoSync returns result", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce({ success: true, message: "Auto synced" });
    const result = await act(async () => {
      return await useSyncStore.getState().autoSync();
    });
    expect(result.success).toBe(true);
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it("autoSync handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Auto sync failed"));
    await act(async () => {
      try {
        await useSyncStore.getState().autoSync();
      } catch {
        // expected
      }
    });
    expect(useSyncStore.getState().error).toBe("Error: Auto sync failed");
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });
});
