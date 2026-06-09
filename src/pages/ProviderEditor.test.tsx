import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProviderEditor from "./ProviderEditor";
import { useProviderStore } from "@/stores/providerStore";

const mockSave = vi.fn();

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: vi.fn(() => ({
    saveProvider: mockSave,
    providers: [],
    fetchProviders: vi.fn(),
    builtinPresets: [],
    fetchBuiltinPresets: vi.fn(),
  })),
}));

describe("ProviderEditor", () => {
  it("renders form title", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("添加 Provider")).toBeInTheDocument();
  });

  it("has id input field", () => {
    render(<ProviderEditor />);
    expect(screen.getByPlaceholderText("openai")).toBeInTheDocument();
  });

  it("has name input field", () => {
    render(<ProviderEditor />);
    expect(screen.getByPlaceholderText("OpenAI")).toBeInTheDocument();
  });

  it("has api type select", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("请选择")).toBeInTheDocument();
  });

  it("has base url input", () => {
    render(<ProviderEditor />);
    expect(screen.getByPlaceholderText("https://api.openai.com/v1")).toBeInTheDocument();
  });

  it("has api key input", () => {
    render(<ProviderEditor />);
    const inputs = screen.getAllByDisplayValue("");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("has enabled checkbox", () => {
    render(<ProviderEditor />);
    expect(screen.getByLabelText("启用 Provider")).toBeInTheDocument();
  });

  it("has submit button", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("保存 Provider")).toBeInTheDocument();
  });

  it("submits form with data", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "test" } });
    fireEvent.change(screen.getByPlaceholderText("OpenAI"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("provider-api-select"), { target: { value: "openai-completions" } });
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    fireEvent.submit(screen.getByText("保存 Provider").closest("form")!);
    expect(mockSave).toHaveBeenCalled();
  });

  it("shows validation error for empty id", async () => {
    mockSave.mockRejectedValueOnce(new Error("Provider ID 不能为空"));
    render(<ProviderEditor />);
    fireEvent.submit(screen.getByText("保存 Provider").closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/Provider ID 不能为空/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("shows add model button", () => {
    render(<ProviderEditor />);
    expect(screen.getByTestId("add-model-btn")).toBeInTheDocument();
  });

  it("opens model editor on add model click", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    expect(screen.getByTestId("model-editor-dialog")).toBeInTheDocument();
    expect(screen.getAllByText("添加模型").length).toBeGreaterThanOrEqual(1);
  });

  it("adds a model to the form", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    expect(screen.getByTestId("model-item-gpt-4")).toBeInTheDocument();
    expect(screen.getByText("GPT-4")).toBeInTheDocument();
  });

  it("deletes a model from the form", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "temp" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "Temp" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    expect(screen.getByTestId("model-item-temp")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-model-temp"));
    expect(screen.queryByTestId("model-item-temp")).not.toBeInTheDocument();
  });

  it("edits a model in the form", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4o" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4o" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));

    fireEvent.click(screen.getByTestId("edit-model-gpt-4o"));
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4o Updated" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));

    expect(screen.getByText("GPT-4o Updated")).toBeInTheDocument();
  });

  it("cancels model editor", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    expect(screen.getByTestId("model-editor-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("取消"));
    expect(screen.queryByTestId("model-editor-dialog")).not.toBeInTheDocument();
  });

  it("shows preset select when builtinPresets available", () => {
    vi.doMock("@/stores/providerStore", () => ({
      useProviderStore: () => ({
        saveProvider: mockSave,
        providers: [],
        fetchProviders: vi.fn(),
        builtinPresets: [{ id: "openai", name: "OpenAI" }],
        fetchBuiltinPresets: vi.fn(),
      }),
    }));
    render(<ProviderEditor />);
    expect(screen.getByTestId("preset-select")).toBeInTheDocument();
  });

  it("saves provider with form data", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "test" } });
    fireEvent.change(screen.getByPlaceholderText("OpenAI"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("provider-api-select"), { target: { value: "openai-completions" } });
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    fireEvent.submit(screen.getByText("保存 Provider").closest("form")!);
    expect(mockSave).toHaveBeenCalled();
    const saved = mockSave.mock.calls[mockSave.mock.calls.length - 1][0];
    expect(saved.id).toBe("test");
    expect(saved.name).toBe("Test");
  });

  it("renders model card with reasoning badge", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    expect(screen.getByTestId("model-item-gpt-4")).toBeInTheDocument();
  });

  it("opens model editor with populated fields", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("add-model-btn"));
    expect(screen.getByTestId("model-id-input")).toBeInTheDocument();
    expect(screen.getByTestId("model-name-input")).toBeInTheDocument();
  });

  it("changes preset selection", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      saveProvider: mockSave,
      providers: [],
      fetchProviders: vi.fn(),
      builtinPresets: [
        { id: "openai", name: "OpenAI", models: [{ id: "gpt-4", name: "GPT-4" }] },
      ],
      fetchBuiltinPresets: vi.fn(),
    } as any);
    render(<ProviderEditor />);
    const select = screen.getByTestId("preset-select");
    fireEvent.change(select, { target: { value: "openai" } });
    expect(screen.getByTestId("model-select")).toBeInTheDocument();
  });

  it("changes model alias", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      saveProvider: mockSave,
      providers: [],
      fetchProviders: vi.fn(),
      builtinPresets: [
        { id: "openai", name: "OpenAI", models: [{ id: "gpt-4", name: "GPT-4" }] },
      ],
      fetchBuiltinPresets: vi.fn(),
    } as any);
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("preset-select"), { target: { value: "openai" } });
    fireEvent.change(screen.getByTestId("model-select"), { target: { value: "gpt-4" } });
    const aliasInput = screen.getByPlaceholderText("自定义显示名称");
    fireEvent.change(aliasInput, { target: { value: "My GPT" } });
    expect(aliasInput).toHaveValue("My GPT");
  });
});
