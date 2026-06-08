import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useSettingsStore } from "./settingsStore";

vi.mock("@/lib/tauri-api", () => ({
  invokeCommand: vi.fn(),
}));

import { invokeCommand } from "@/lib/tauri-api";

describe("settingsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: null, isLoading: false, error: null });
  });

  it("has initial null state", () => {
    const state = useSettingsStore.getState();
    expect(state.settings).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("fetchSettings loads data", async () => {
    const mockSettings = { defaultProvider: "anthropic" };
    vi.mocked(invokeCommand).mockResolvedValueOnce(mockSettings);
    await act(async () => {
      await useSettingsStore.getState().fetchSettings();
    });
    expect(useSettingsStore.getState().settings).toEqual(mockSettings);
  });

  it("fetchSettings handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Failed"));
    await act(async () => {
      await useSettingsStore.getState().fetchSettings();
    });
    expect(useSettingsStore.getState().error).toBe("Error: Failed");
  });

  it("saveSettings updates state", async () => {
    vi.mocked(invokeCommand).mockResolvedValueOnce(undefined);
    const newSettings = { defaultProvider: "openai" };
    await act(async () => {
      await useSettingsStore.getState().saveSettings(newSettings);
    });
    expect(useSettingsStore.getState().settings).toEqual(newSettings);
  });

  it("saveSettings handles error", async () => {
    vi.mocked(invokeCommand).mockRejectedValueOnce(new Error("Save failed"));
    await act(async () => {
      await useSettingsStore.getState().saveSettings({});
    });
    expect(useSettingsStore.getState().error).toBe("Error: Save failed");
  });

  it("sets loading during fetch", async () => {
    vi.mocked(invokeCommand).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(null), 10)));
    act(() => {
      useSettingsStore.getState().fetchSettings();
    });
    expect(useSettingsStore.getState().isLoading).toBe(true);
  });

  it("clears error on new fetch", async () => {
    useSettingsStore.setState({ error: "Previous" });
    vi.mocked(invokeCommand).mockResolvedValueOnce(null);
    await act(async () => {
      await useSettingsStore.getState().fetchSettings();
    });
    expect(useSettingsStore.getState().error).toBeNull();
  });
});
