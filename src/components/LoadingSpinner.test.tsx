import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<LoadingSpinner text="保存中..." />);
    expect(screen.getByText("保存中...")).toBeInTheDocument();
  });

  it("has animate-spin class on icon", () => {
    const { container } = render(<LoadingSpinner />);
    const icon = container.querySelector(".animate-spin");
    expect(icon).toBeInTheDocument();
  });
});
