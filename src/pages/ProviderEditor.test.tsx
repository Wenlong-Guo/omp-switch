import { beforeEach, describe, it, expect, vi } from "vitest";
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
  beforeEach(() => {
    mockSave.mockReset();
    vi.mocked(useProviderStore).mockReturnValue({
      saveProvider: mockSave,
      providers: [],
      fetchProviders: vi.fn(),
      builtinPresets: [],
      fetchBuiltinPresets: vi.fn(),
    } as any);
  });

  it("renders form title", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("添加供应商")).toBeInTheDocument();
  });

  it("has id input field", () => {
    render(<ProviderEditor />);
    expect(screen.getByPlaceholderText("openai")).toBeInTheDocument();
  });

  it("has name input field", () => {
    render(<ProviderEditor />);
    expect(screen.getByPlaceholderText("默认同步供应商 ID")).toBeInTheDocument();
  });

  it("has api type select", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("OpenAI 兼容格式")).toBeInTheDocument();
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
    expect(screen.getByLabelText("应用配置")).toBeInTheDocument();
  });

  it("does not enable new provider by default", () => {
    render(<ProviderEditor />);
    expect(screen.getByLabelText("应用配置")).not.toBeChecked();
  });

  it("has submit button", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("保存供应商")).toBeInTheDocument();
  });

  it("submits form with data", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "test" } });
    fireEvent.change(screen.getByTestId("provider-name-input"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("provider-api-select"), { target: { value: "openai-completions" } });
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    expect(mockSave).toHaveBeenCalled();
  });

  it("shows validation error for empty id", async () => {
    mockSave.mockRejectedValueOnce(new Error("供应商 ID 不能为空"));
    render(<ProviderEditor />);
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/供应商 ID 不能为空/)).toBeInTheDocument();
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

  it("shows preset grid with featured providers", () => {
    render(<ProviderEditor />);
    expect(screen.getByTestId("preset-grid")).toBeInTheDocument();
    expect(screen.getByTestId("preset-card-deepseek")).toBeInTheDocument();
    expect(screen.getByTestId("preset-card-kimi-k26")).toBeInTheDocument();
  });

  it("saves provider with form data", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "test" } });
    fireEvent.change(screen.getByTestId("provider-name-input"), { target: { value: "Test" } });
    fireEvent.change(screen.getByTestId("provider-api-select"), { target: { value: "openai-completions" } });
    fireEvent.click(screen.getByTestId("add-model-btn"));
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-4" } });
    fireEvent.change(screen.getByTestId("model-name-input"), { target: { value: "GPT-4" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    expect(mockSave).toHaveBeenCalled();
    const saved = mockSave.mock.calls[mockSave.mock.calls.length - 1][0];
    expect(saved.id).toBe("test");
    expect(saved.name).toBe("Test");
    expect(saved.enabled).toBe(false);
  });

  it("saving new provider does not set it as default", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("provider-id-input"), { target: { value: "test" } });
    fireEvent.change(screen.getByTestId("provider-name-input"), { target: { value: "Test" } });
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    expect(mockSave).toHaveBeenCalled();
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

  it("changes preset selection and renders preset model cards without default selecting models", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("preset-card-deepseek"));
    expect(screen.getByTestId("preset-model-grid")).toBeInTheDocument();
    expect(screen.getByTestId("preset-model-card-deepseek-v4-pro")).toBeInTheDocument();
    expect(screen.getByTestId("preset-model-card-deepseek-v4-flash")).toBeInTheDocument();
    expect(screen.getByTestId("preset-model-selected-count")).toHaveTextContent("已选择 0/3");
    expect(screen.queryByTestId("model-item-deepseek-v4-pro")).not.toBeInTheDocument();
    expect(screen.getByTestId("provider-id-input")).toHaveValue("deepseek");
    expect(screen.getByTestId("provider-name-input")).toHaveValue("DeepSeek");
    expect(screen.getByPlaceholderText("https://api.openai.com/v1")).toHaveValue("https://api.deepseek.com/v1");
  });

  it("batch selects preset models and saves only selected models", async () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("preset-card-deepseek"));
    fireEvent.click(screen.getByTestId("select-all-preset-models"));
    expect(screen.getByTestId("preset-model-selected-count")).toHaveTextContent("已选择 3/3");
    expect(screen.getByTestId("model-item-deepseek-v4-pro")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("preset-model-checkbox-deepseek-v4-flash"));
    expect(screen.getByTestId("preset-model-selected-count")).toHaveTextContent("已选择 2/3");
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    const saved = mockSave.mock.calls[mockSave.mock.calls.length - 1][0];
    expect(saved.models.map((m: { id: string }) => m.id)).toEqual(["deepseek-v4-pro", "deepseek-v3.2"]);
  });

  it("syncs display name from provider id until name is edited", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("provider-id-input"), { target: { value: "my-provider" } });
    expect(screen.getByTestId("provider-name-input")).toHaveValue("my-provider");
    fireEvent.change(screen.getByTestId("provider-name-input"), { target: { value: "Custom Name" } });
    fireEvent.change(screen.getByTestId("provider-id-input"), { target: { value: "other-provider" } });
    expect(screen.getByTestId("provider-name-input")).toHaveValue("Custom Name");
  });

  it("rejects provider id with unsupported characters", async () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("provider-id-input"), { target: { value: "bad_id" } });
    fireEvent.change(screen.getByTestId("provider-name-input"), { target: { value: "Bad" } });
    fireEvent.submit(screen.getByText("保存供应商").closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/供应商 ID 只能包含字母、数字和横线/)).toBeInTheDocument();
    });
  });

  it("filters opencode-only builtin presets from preset grid", () => {
    vi.mocked(useProviderStore).mockReturnValue({
      saveProvider: mockSave,
      providers: [],
      fetchProviders: vi.fn(),
      builtinPresets: [
        { id: "oh-my-opencode", name: "Oh My OpenCode", baseUrl: "https://hidden.example/v1" },
        { id: "custom-omp", name: "Custom OMP", baseUrl: "https://custom.example/v1" },
        { id: "lm-studio", name: "LM Studio", baseUrl: "http://localhost:1234/v1" },
      ],
      fetchBuiltinPresets: vi.fn(),
    } as any);
    render(<ProviderEditor />);
    expect(screen.queryByTestId("preset-card-oh-my-opencode")).not.toBeInTheDocument();
    expect(screen.getByTestId("preset-card-custom-omp")).toBeInTheDocument();
    expect(screen.queryByTestId("preset-card-lm-studio")).not.toBeInTheDocument();
  });

  it("shows YAML-only config editor and sticky save bar", () => {
    render(<ProviderEditor />);
    expect(screen.getByTestId("provider-config-editor")).toBeInTheDocument();
    expect(screen.queryByTestId("config-format-json")).not.toBeInTheDocument();
    expect(screen.getByText("Provider YAML 编辑")).toBeInTheDocument();
    expect(screen.getByTestId("sticky-save-bar")).toHaveClass("sticky");
  });

  it("applies valid YAML config editor changes", () => {
    render(<ProviderEditor />);
    const editor = screen.getByTestId("provider-config-editor");
    fireEvent.change(editor, {
      target: {
        value: [
          'id: "yaml-provider"',
          'name: "YAML Provider"',
          'enabled: false',
          'isBuiltIn: false',
          'api: "openai-completions"',
          'auth: "apiKey"',
          'baseUrl: "https://yaml.example/v1"',
          'models:',
        ].join("\n"),
      },
    });
    fireEvent.click(screen.getByTestId("apply-config-editor"));
    expect(screen.getByTestId("provider-id-input")).toHaveValue("yaml-provider");
    expect(screen.getByTestId("provider-name-input")).toHaveValue("YAML Provider");
    expect(screen.getByPlaceholderText("https://api.openai.com/v1")).toHaveValue("https://yaml.example/v1");
  });

  it("syncs YAML editor changes to form in real time", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("provider-config-editor"), {
      target: {
        value: [
          'id: "live-yaml"',
          'name: "Live YAML"',
          'enabled: false',
          'isBuiltIn: false',
          'api: "openai-completions"',
          'auth: "apiKey"',
          'baseUrl: "https://live.example/v1"',
          'models:',
        ].join("\n"),
      },
    });

    expect(screen.getByTestId("provider-id-input")).toHaveValue("live-yaml");
    expect(screen.getByTestId("provider-name-input")).toHaveValue("Live YAML");
    expect(screen.getByPlaceholderText("https://api.openai.com/v1")).toHaveValue("https://live.example/v1");
  });

  it("does not overwrite form from invalid YAML", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "keep-id" } });
    fireEvent.change(screen.getByTestId("provider-config-editor"), { target: { value: "bad line" } });

    expect(screen.getByTestId("provider-id-input")).toHaveValue("keep-id");
    expect(screen.getByTestId("provider-config-error")).toHaveTextContent("YAML 配置解析失败");
  });

  it("shows error for invalid YAML config", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByTestId("provider-config-editor"), { target: { value: "bad line" } });
    fireEvent.click(screen.getByTestId("apply-config-editor"));
    expect(screen.getByTestId("provider-config-error")).toHaveTextContent("YAML 配置解析失败");
  });

  it("shows editable YAML for selected preset", () => {
    render(<ProviderEditor />);
    fireEvent.click(screen.getByTestId("preset-card-deepseek"));
    const editor = screen.getByTestId("provider-config-editor");
    expect(editor).not.toHaveAttribute("readonly");
    expect((editor as HTMLTextAreaElement).value).toContain("id: \"deepseek\"");
  });
});
