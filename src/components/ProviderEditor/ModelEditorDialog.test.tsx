import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModelEditorDialog from "./ModelEditorDialog";

describe("ModelEditorDialog", () => {
  it("uses model id as name when name is empty", () => {
    const onSave = vi.fn();
    render(<ModelEditorDialog onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "step-3.7-flash" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "step-3.7-flash", name: "step-3.7-flash" }));
  });

  it("defaults to OpenAI compatible format and enables reasoning/image", () => {
    render(<ModelEditorDialog onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("openai-completions");
    expect(screen.getByTestId("model-reasoning")).toBeChecked();
    expect(screen.getByLabelText("图片")).toBeChecked();
  });

  it("fills metadata when model id is recognized", () => {
    render(<ModelEditorDialog onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "gpt-5.5" } });
    fireEvent.click(screen.getByRole("button", { name: /成本与限制/ }));
    expect(screen.getByTestId("model-context-window")).toHaveValue(400000);
    expect(screen.getByTestId("model-max-tokens")).toHaveValue(128000);
  });

  it("saves omp-supported model defaults", () => {
    const onSave = vi.fn();
    render(<ModelEditorDialog onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByTestId("model-id-input"), { target: { value: "model-a" } });
    fireEvent.click(screen.getByRole("button", { name: /高级选项/ }));
    fireEvent.change(screen.getByLabelText("默认 Temperature (omp)"), { target: { value: "0.2" } });
    fireEvent.change(screen.getByLabelText("默认 Top P (omp)"), { target: { value: "0.9" } });
    fireEvent.change(screen.getByLabelText("默认 Seed (omp)"), { target: { value: "1" } });
    fireEvent.click(screen.getByTestId("save-model-btn"));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      defaultTemperature: 0.2,
      defaultTopP: 0.9,
      defaultSeed: 1,
    }));
  });
});
