import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "./Settings";

vi.mock("@/stores/settingsStore", () => {
  const store = {
    settings: {
      defaultProvider: "anthropic",
      defaultModel: "claude-sonnet-4-20250514",
      defaultThinkingLevel: "medium",
      hideThinkingBlock: false,
    },
    fetchSettings: vi.fn(),
    saveSettings: vi.fn(),
  };
  return {
    useSettingsStore: () => store,
  };
});

import { useSettingsStore } from "@/stores/settingsStore";

describe("Settings", () => {
  it("renders settings title", () => {
    render(<Settings />);
    expect(screen.getByText("全局设置")).toBeInTheDocument();
  });

  it("shows default provider input", () => {
    render(<Settings />);
    const input = screen.getByDisplayValue("anthropic");
    expect(input).toBeInTheDocument();
  });

  it("shows default model input", () => {
    render(<Settings />);
    const input = screen.getByDisplayValue("claude-sonnet-4-20250514");
    expect(input).toBeInTheDocument();
  });

  it("has thinking level select", () => {
    render(<Settings />);
    expect(screen.getByDisplayValue("Medium")).toBeInTheDocument();
  });

  it("has hide thinking checkbox", () => {
    render(<Settings />);
    expect(screen.getByLabelText("隐藏 Thinking 块")).toBeInTheDocument();
  });

  it("has save button", () => {
    render(<Settings />);
    expect(screen.getByText("保存设置")).toBeInTheDocument();
  });

  it("calls save on submit", () => {
    const store = useSettingsStore();
    render(<Settings />);
    fireEvent.click(screen.getByText("保存设置"));
    expect(store.saveSettings).toHaveBeenCalled();
  });

  it("shows save success message", async () => {
    const store = useSettingsStore();
    (store.saveSettings as any).mockResolvedValueOnce(undefined);
    render(<Settings />);
    fireEvent.submit(screen.getByText("保存设置").closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("保存成功")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("fetches settings on mount", () => {
    const store = useSettingsStore();
    render(<Settings />);
    expect(store.fetchSettings).toHaveBeenCalled();
  });

  it("allows changing default provider", () => {
    render(<Settings />);
    const input = screen.getByDisplayValue("anthropic");
    fireEvent.change(input, { target: { value: "openai" } });
    expect(input).toHaveValue("openai");
  });
});
