import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ModelEditor from "./ModelEditor";
import type { ModelDefinition } from "@/types/provider";

const mockModel: Partial<ModelDefinition> = {
  id: "gpt-4o",
  name: "GPT-4o",
  reasoning: true,
  input: ["text", "image"],
  cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 5 },
  contextWindow: 128000,
  maxTokens: 4096,
};

describe("ModelEditor", () => {
  it("renders all 5 collapsible sections", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.getByText("能力与模态")).toBeInTheDocument();
    expect(screen.getByText("成本与限制")).toBeInTheDocument();
    expect(screen.getByText("兼容性")).toBeInTheDocument();
    expect(screen.getByText("高级选项")).toBeInTheDocument();
  });

  it("fills form with initial model data", () => {
    render(<ModelEditor initialModel={mockModel} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("field-id")).toHaveValue("gpt-4o");
    expect(screen.getByTestId("field-name")).toHaveValue("GPT-4o");
  });

  it("updates model name on input change", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("field-name"), { target: { value: "New Name" } });
    expect(screen.getByTestId("field-name")).toHaveValue("New Name");
  });

  it("toggles reasoning checkbox", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    const capToggle = screen.getByText("能力与模态").closest("button");
    fireEvent.click(capToggle!);
    fireEvent.click(screen.getByTestId("field-reasoning"));
    expect(screen.getByTestId("field-reasoning")).toBeChecked();
  });

  it("applies Ollama compat preset", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("兼容性"));
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "ollama" },
    });
    expect(screen.getByTestId("compat-supportsDeveloperRole")).not.toBeChecked();
  });

  it("clears compat preset", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("兼容性"));
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "ollama" },
    });
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "__clear__" },
    });
  });

  it("saves model with all fields", () => {
    const onSave = vi.fn();
    render(<ModelEditor initialModel={mockModel} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByTestId("model-save"));
    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0][0] as ModelDefinition;
    expect(saved.id).toBe("gpt-4o");
    expect(saved.name).toBe("GPT-4o");
  });

  it("cancels editor without saving", () => {
    const onCancel = vi.fn();
    render(<ModelEditor onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("model-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("validates required id field", () => {
    const onSave = vi.fn();
    render(<ModelEditor onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("field-id"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("model-save"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("selects status from dropdown", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("field-status"), { target: { value: "beta" } });
    expect(screen.getByTestId("field-status")).toHaveValue("beta");
  });

  it("updates cost input", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("成本与限制"));
    fireEvent.change(screen.getByTestId("cost-input"), { target: { value: "3.0" } });
    expect(screen.getByTestId("cost-input")).toHaveValue(3.0);
  });

  it("does not crash with partial model data", () => {
    render(<ModelEditor initialModel={{ id: "test", name: "Test" }} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("field-id")).toHaveValue("test");
  });

  it("does not crash with empty model", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("field-id")).toHaveValue("");
  });

  it("collapses and expands sections on click", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    const toggle = screen.getByText("能力与模态").closest("button");
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle!);
  });

  it("renders compat checkboxes", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("兼容性"));
    expect(screen.getByTestId("compat-supportsDeveloperRole")).toBeInTheDocument();
  });

  it("renders options keyvalue editor in advanced section", async () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    const advancedToggle = screen.getByText("高级选项").closest("button");
    expect(advancedToggle).toBeInTheDocument();
    fireEvent.click(advancedToggle!);
    await waitFor(() => {
      expect(screen.queryAllByTestId("keyvalue-editor").length).toBeGreaterThan(0);
    });
  });

  it("preserves unsaved changes when collapsing section", () => {
    render(<ModelEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("field-name"), { target: { value: "unsaved" } });
    const toggle = screen.getByText("基本信息").closest("button");
    fireEvent.click(toggle!);
    fireEvent.click(toggle!);
    expect(screen.getByTestId("field-name")).toHaveValue("unsaved");
  });
});
