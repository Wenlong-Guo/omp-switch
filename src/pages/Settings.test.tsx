import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Settings from "./Settings";

const mockFetch = vi.fn();
const mockSave = vi.fn();

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: {
      defaultProvider: "anthropic",
      defaultModel: "claude-sonnet-4-20250514",
      defaultThinkingLevel: "medium",
      hideThinkingBlock: false,
    },
    fetchSettings: mockFetch,
    saveSettings: mockSave,
  }),
}));

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
    render(<Settings />);
    fireEvent.click(screen.getByText("保存设置"));
    expect(mockSave).toHaveBeenCalled();
  });

  it("shows save success message", async () => {
    mockSave.mockResolvedValueOnce(undefined);
    render(<Settings />);
    fireEvent.click(screen.getByText("保存设置"));
    await screen.findByText("保存成功");
  });

  it("fetches settings on mount", () => {
    render(<Settings />);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("allows changing default provider", () => {
    render(<Settings />);
    const input = screen.getByDisplayValue("anthropic");
    fireEvent.change(input, { target: { value: "openai" } });
    expect(input).toHaveValue("openai");
  });
});
