import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThinkingLevelMapTable from "./ThinkingLevelMapTable";

describe("ThinkingLevelMapTable", () => {
  it("renders 6 thinking levels", () => {
    render(<ThinkingLevelMapTable value={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId("tl-level-off")).toBeInTheDocument();
    expect(screen.getByTestId("tl-level-xhigh")).toBeInTheDocument();
  });

  it("sets level to inherit (omitted)", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelMapTable value={{ medium: "med" }} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("tl-inherit-medium"));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("sets level to custom value", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelMapTable value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("tl-custom-low"));
    expect(onChange).toHaveBeenCalledWith({ low: "" });
  });

  it("fills custom input when custom selected", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelMapTable value={{ low: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("tl-custom-input-low"), { target: { value: "custom_low" } });
    expect(onChange).toHaveBeenCalledWith({ low: "custom_low" });
  });

  it("sets level to unsupported (null)", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelMapTable value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("tl-unsupported-off"));
    expect(onChange).toHaveBeenCalledWith({ off: null });
  });

  it("initializes from existing thinkingLevelMap", () => {
    render(
      <ThinkingLevelMapTable
        value={{ off: null, medium: "med" }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("tl-unsupported-off")).toBeChecked();
    expect(screen.getByTestId("tl-custom-medium")).toBeChecked();
    expect(screen.getByTestId("tl-inherit-high")).toBeChecked();
  });

  it("handles all levels set to unsupported", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelMapTable value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("tl-unsupported-off"));
    expect(onChange).toHaveBeenCalledWith({ off: null });
  });
});
