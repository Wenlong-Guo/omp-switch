import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CheckboxMatrix from "./CheckboxMatrix";

const OPTIONS = ["text", "audio", "image", "video", "pdf"];

describe("CheckboxMatrix", () => {
  it("renders 5 modality options", () => {
    render(<CheckboxMatrix value={{}} options={OPTIONS} onChange={vi.fn()} />);
    for (const opt of OPTIONS) {
      expect(screen.getByText(opt)).toBeInTheDocument();
    }
  });

  it("checks input text on click", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{}} options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("input-text"));
    expect(onChange).toHaveBeenCalledWith({ input: ["text"] });
  });

  it("checks output image on click", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{}} options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("output-image"));
    expect(onChange).toHaveBeenCalledWith({ output: ["image"] });
  });

  it("unchecks previously checked item", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{ input: ["text"] }} options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("input-text"));
    expect(onChange).toHaveBeenCalledWith({ input: [] });
  });

  it("selects all input options", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{}} options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("select-all-input"));
    expect(onChange).toHaveBeenCalledWith({ input: OPTIONS });
  });

  it("clears all output options", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{ output: ["text", "image"] }} options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("clear-all-output"));
    expect(onChange).toHaveBeenCalledWith({ output: [] });
  });

  it("handles disabled state", () => {
    const onChange = vi.fn();
    render(<CheckboxMatrix value={{}} options={OPTIONS} onChange={onChange} disabled />);
    fireEvent.click(screen.getByTestId("input-text"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
