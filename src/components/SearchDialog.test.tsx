import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchDialog from "./SearchDialog";

const mockProviders = [
  {
    id: "openai",
    name: "OpenAI",
    api: "openai-completions",
    enabled: true,
    isBuiltIn: true,
    models: [{ id: "gpt-4", name: "GPT-4" }],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    api: "anthropic-messages",
    enabled: true,
    isBuiltIn: true,
    models: [],
  },
];

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: vi.fn(() => ({
    providers: mockProviders,
  })),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["", vi.fn()],
}));

describe("SearchDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<SearchDialog open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when open", () => {
    render(<SearchDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText("搜索 Provider 或模型...")).toBeInTheDocument();
  });

  it("shows provider items", () => {
    render(<SearchDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("filters items by query", () => {
    render(<SearchDialog open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("搜索 Provider 或模型...");
    fireEvent.change(input, { target: { value: "openai" } });
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("Anthropic")).not.toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(<SearchDialog open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText("搜索 Provider 或模型...");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows empty state for no matches", () => {
    render(<SearchDialog open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText("搜索 Provider 或模型...");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("未找到匹配项")).toBeInTheDocument();
  });

  it("navigates on item click", () => {
    const setLocation = vi.fn();
    vi.doMock("wouter", () => ({
      useLocation: () => ["", setLocation],
    }));
    const onClose = vi.fn();
    render(<SearchDialog open={true} onClose={onClose} />);
    const item = screen.getAllByText("OpenAI")[0];
    fireEvent.click(item.closest("button")!);
    expect(onClose).toHaveBeenCalled();
  });
});
