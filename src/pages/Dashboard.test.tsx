import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "./Dashboard";

const mockProviders = [
  { id: "openai", name: "OpenAI", enabled: true, isBuiltIn: true, api: "openai-completions", baseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic", enabled: true, isBuiltIn: true, api: "anthropic-messages", baseUrl: "https://api.anthropic.com" },
];

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: vi.fn(() => ({
    providers: mockProviders,
    fetchProviders: vi.fn(),
    deleteProvider: vi.fn(),
    setActiveProvider: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => ({
    settings: { defaultProvider: "anthropic" },
    fetchSettings: vi.fn(),
  }),
}));

describe("Dashboard", () => {
  it("renders provider list", () => {
    render(<Dashboard />);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("shows default provider badge", () => {
    render(<Dashboard />);
    const badges = screen.getAllByText("默认");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows provider API type", () => {
    render(<Dashboard />);
    expect(screen.getByText("openai-completions")).toBeInTheDocument();
  });

  it("has set active buttons", () => {
    render(<Dashboard />);
    const buttons = screen.getAllByText("设为默认");
    expect(buttons.length).toBe(2);
  });

  it("has delete buttons", () => {
    render(<Dashboard />);
    const buttons = screen.getAllByText("删除");
    expect(buttons.length).toBe(2);
  });

  it("shows empty state when no providers", () => {
    (useProviderStore as any).mockReturnValueOnce({
      providers: [],
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      isLoading: false,
    });
    render(<Dashboard />);
    expect(screen.getByText(/暂无 Provider/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    (useProviderStore as any).mockReturnValueOnce({
      providers: [],
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      isLoading: true,
    });
    render(<Dashboard />);
    expect(screen.getByText(/加载 Provider 列表/)).toBeInTheDocument();
  });

  it("renders page title", () => {
    render(<Dashboard />);
    expect(screen.getByText("Provider 管理")).toBeInTheDocument();
  });

  it("shows default provider info", () => {
    render(<Dashboard />);
    expect(screen.getByText(/默认: anthropic/)).toBeInTheDocument();
  });

  it("renders provider cards in grid", () => {
    const { container } = render(<Dashboard />);
    const cards = container.querySelectorAll(".border");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("clicking set active triggers action", () => {
    const setActive = vi.fn();
    (useProviderStore as any).mockReturnValueOnce({
      providers: mockProviders,
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: setActive,
      isLoading: false,
    });
    render(<Dashboard />);
    const button = screen.getAllByText("设为默认")[0];
    fireEvent.click(button);
    expect(setActive).toHaveBeenCalled();
  });
});

// Re-import for the mock override tests
import { useProviderStore } from "@/stores/providerStore";
