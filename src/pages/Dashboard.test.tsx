import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "./Dashboard";

const mockProviders = [
  { id: "openai", name: "OpenAI", enabled: true, isBuiltIn: true, api: "openai-completions", baseUrl: "https://api.openai.com/v1", models: [{ id: "gpt-4", name: "GPT-4" }] },
  { id: "anthropic", name: "Anthropic", enabled: true, isBuiltIn: true, api: "anthropic-messages", baseUrl: "https://api.anthropic.com", models: [{ id: "claude-3", name: "Claude 3" }] },
];

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: vi.fn(() => ({
    providers: mockProviders,
    fetchProviders: vi.fn(),
    deleteProvider: vi.fn(),
    setActiveProvider: vi.fn(),
    saveProvider: vi.fn(),
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
  afterEach(() => {
    vi.mocked(useProviderStore).mockRestore?.();
  });
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
    expect(buttons.length).toBe(1); // anthropic is already default
  });

  it("has delete buttons", () => {
    render(<Dashboard />);
    const buttons = screen.getAllByText("删除");
    expect(buttons.length).toBe(2);
  });

  it("shows empty state when no providers", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      providers: [],
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      saveProvider: vi.fn(),
      isLoading: false,
    } as any);
    render(<Dashboard />);
    expect(screen.getByText(/暂无供应商/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      providers: [],
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      saveProvider: vi.fn(),
      isLoading: true,
    } as any);
    render(<Dashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it("renders page title", () => {
    render(<Dashboard />);
    expect(screen.getByText("供应商管理")).toBeInTheDocument();
  });

  it("does not show default provider info", () => {
    render(<Dashboard />);
    expect(screen.queryByText(/默认:/)).not.toBeInTheDocument();
  });

  it("renders provider cards in grid", () => {
    const { container } = render(<Dashboard />);
    const cards = container.querySelectorAll(".border");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("clicking set active triggers action", () => {
    const setActive = vi.fn();
    vi.mocked(useProviderStore).mockReturnValue({
      providers: mockProviders,
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: setActive,
      saveProvider: vi.fn(),
      isLoading: false,
    } as any);
    render(<Dashboard />);
    const button = screen.getByText("设为默认");
    fireEvent.click(button);
    expect(setActive).toHaveBeenCalled();
  });

  it("expands model list on click", () => {
    render(<Dashboard />);
    const expandBtn = screen.getAllByText(/个模型/)[0].closest("button")!;
    fireEvent.click(expandBtn);
    expect(screen.getByText("GPT-4")).toBeInTheDocument();
  });

  it("toggles provider application from list", () => {
    const saveProvider = vi.fn();
    vi.mocked(useProviderStore).mockReturnValue({
      providers: mockProviders,
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      saveProvider,
      isLoading: false,
    } as any);
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId("provider-enabled-openai"));
    expect(saveProvider).toHaveBeenCalledWith(expect.objectContaining({ id: "openai", enabled: false }));
  });

  it("shows disabled badge for disabled provider", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      providers: [{ id: "test", name: "Test", enabled: false, isBuiltIn: false, api: "openai-completions", baseUrl: "", models: [] }],
      fetchProviders: vi.fn(),
      deleteProvider: vi.fn(),
      setActiveProvider: vi.fn(),
      saveProvider: vi.fn(),
      isLoading: false,
    } as any);
    render(<Dashboard />);
    expect(screen.getByText("未应用")).toBeInTheDocument();
  });

  it("shows confirm dialog on delete click", () => {
    render(<Dashboard />);
    const deleteButtons = screen.getAllByText("删除");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("确认删除")).toBeInTheDocument();
  });

  it("cancels delete dialog", () => {
    render(<Dashboard />);
    fireEvent.click(screen.getAllByText("删除")[0]);
    const cancelBtn = screen.getByText("取消");
    fireEvent.click(cancelBtn);
    expect(screen.queryByText("确认删除")).not.toBeInTheDocument();
  });

  it("confirms delete", async () => {
    const deleteFn = vi.fn();
    vi.mocked(useProviderStore).mockReturnValue({
      providers: mockProviders,
      fetchProviders: vi.fn(),
      deleteProvider: deleteFn,
      setActiveProvider: vi.fn(),
      saveProvider: vi.fn(),
      isLoading: false,
    } as any);
    render(<Dashboard />);
    fireEvent.click(screen.getAllByText("删除")[0]);
    fireEvent.click(screen.getByText("确认"));
    await vi.waitFor(() => expect(deleteFn).toHaveBeenCalled());
  });

  it("exports JSON", () => {
    const orig = (window as any).URL;
    (window as any).URL = { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() };
    render(<Dashboard />);
    fireEvent.click(screen.getByText("导出 JSON"));
    expect((window as any).URL.createObjectURL).toHaveBeenCalled();
    (window as any).URL = orig;
  });

  it("triggers drag events", () => {
    render(<Dashboard />);
    const card = screen.getByTestId("provider-card-openai");
    fireEvent.dragStart(card);
    fireEvent.dragOver(card);
    fireEvent.drop(card);
    fireEvent.dragEnd(card);
  });
});

// Re-import for the mock override tests
import { useProviderStore } from "@/stores/providerStore";
