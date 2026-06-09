import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import KeyValueEditor from "./KeyValueEditor";

describe("KeyValueEditor", () => {
  it("renders empty with add button", () => {
    render(<KeyValueEditor value={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId("kv-new-key")).toBeInTheDocument();
    expect(screen.getByTestId("kv-add")).toBeInTheDocument();
  });

  it("adds new key-value pair", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{}} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("kv-new-key"), { target: { value: "foo" } });
    fireEvent.change(screen.getByTestId("kv-new-value"), { target: { value: "bar" } });
    fireEvent.click(screen.getByTestId("kv-add"));
    expect(onChange).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("updates value on input change", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{ foo: "bar" }} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("kv-value-foo"), { target: { value: "baz" } });
    expect(onChange).toHaveBeenCalledWith({ foo: "baz" });
  });

  it("removes key-value pair", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{ foo: "bar", baz: "qux" }} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("kv-remove-foo"));
    expect(onChange).toHaveBeenCalledWith({ baz: "qux" });
  });

  it("prevents duplicate keys", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{ foo: "bar" }} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("kv-new-key"), { target: { value: "foo" } });
    fireEvent.click(screen.getByTestId("kv-add"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("kv-error")).toHaveTextContent("Key 已存在");
  });

  it("shows error for empty key", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("kv-add"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("kv-error")).toHaveTextContent("Key 不能为空");
  });

  it("calls onChange with correct object", () => {
    const onChange = vi.fn();
    render(<KeyValueEditor value={{ a: "1" }} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("kv-new-key"), { target: { value: "b" } });
    fireEvent.change(screen.getByTestId("kv-new-value"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("kv-add"));
    expect(onChange).toHaveBeenCalledWith({ a: "1", b: "2" });
  });
});
