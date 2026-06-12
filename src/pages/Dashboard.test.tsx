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

describe("Dashboard", () => {
  afterEach(() => {
    vi.mocked(useProviderStore).mockRestore?.();
  });
  it("renders provider list", () => {
    render(<Dashboard />);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("does not show default provider badge", () => {
    render(<Dashboard />);
    expect(screen.queryByText("默认")).not.toBeInTheDocument();
  });

  it("shows provider id tag", () => {
    render(<Dashboard />);
    expect(screen.getByText("openai")).toBeInTheDocument();
  });

  it("does not show set default buttons in provider list", () => {
    render(<Dashboard />);
    expect(screen.queryByText("设为默认模型")).not.toBeInTheDocument();
    expect(screen.queryByText("取消默认")).not.toBeInTheDocument();
  });

  it("has delete buttons", () => {
    render(<Dashboard />);
    const buttons = screen.getAllByLabelText(/删除/);
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

  it("renders provider cards in one column", () => {
    const { container } = render(<Dashboard />);
    const list = container.querySelector(".grid.grid-cols-1.gap-3");
    expect(list).toBeInTheDocument();
    expect(list?.className).not.toContain("lg:grid-cols-3");
  });

  it("renders compact provider action bar", () => {
    render(<Dashboard />);
    expect(screen.getAllByText("移除").length).toBe(2);
    expect(screen.getByLabelText("编辑 OpenAI")).toBeInTheDocument();
    expect(screen.getByLabelText("复制 OpenAI")).toBeInTheDocument();
    expect(screen.getByLabelText("测试模型 OpenAI")).toBeInTheDocument();
    expect(screen.getByLabelText("查看模型 OpenAI")).toBeInTheDocument();
    expect(screen.getByLabelText("删除 OpenAI")).toBeInTheDocument();
  });

  it("shows concrete model names", () => {
    render(<Dashboard />);
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
    expect(screen.getByText("应用")).toBeInTheDocument();
  });

  it("shows confirm dialog on delete click", () => {
    render(<Dashboard />);
    const deleteButtons = screen.getAllByLabelText(/删除/);
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("确认删除")).toBeInTheDocument();
  });

  it("cancels delete dialog", () => {
    render(<Dashboard />);
    fireEvent.click(screen.getAllByLabelText(/删除/)[0]);
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
    fireEvent.click(screen.getAllByLabelText(/删除/)[0]);
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

import { useProviderStore } from "@/stores/providerStore";
