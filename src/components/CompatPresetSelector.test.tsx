import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CompatPresetSelector from "./CompatPresetSelector";

describe("CompatPresetSelector", () => {
  it("renders preset dropdown with 3 options + clear", () => {
    render(<CompatPresetSelector onApply={vi.fn()} onClear={vi.fn()} />);
    const select = screen.getByTestId("compat-preset-select");
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll("option").length).toBe(5); // default + 3 presets + clear
  });

  it("applies ollama preset on select", () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CompatPresetSelector onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "ollama" },
    });
    expect(onApply).toHaveBeenCalled();
    const applied = onApply.mock.calls[0][0] as Record<string, unknown>;
    expect(applied.compat).toBeDefined();
    expect((applied.compat as Record<string, unknown>).supportsDeveloperRole).toBe(false);
  });

  it("applies anthropic preset on select", () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CompatPresetSelector onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "anthropic" },
    });
    expect(onApply).toHaveBeenCalled();
    const applied = onApply.mock.calls[0][0] as Record<string, unknown>;
    expect((applied.compat as Record<string, unknown>).forceAdaptiveThinking).toBe(true);
  });

  it("applies openrouter preset on select", () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CompatPresetSelector onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "openrouter" },
    });
    expect(onApply).toHaveBeenCalled();
    const applied = onApply.mock.calls[0][0] as Record<string, unknown>;
    expect((applied.compat as Record<string, unknown>).thinkingFormat).toBe("openrouter");
  });

  it("calls onClear when clear option selected", () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CompatPresetSelector onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "__clear__" },
    });
    expect(onClear).toHaveBeenCalled();
  });

  it("does not call onApply for default option", () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CompatPresetSelector onApply={onApply} onClear={onClear} />);
    fireEvent.change(screen.getByTestId("compat-preset-select"), {
      target: { value: "" },
    });
    expect(onApply).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });
});
