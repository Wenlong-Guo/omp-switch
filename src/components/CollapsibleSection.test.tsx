import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CollapsibleSection from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders title", () => {
    render(<CollapsibleSection title="Test Section">content</CollapsibleSection>);
    expect(screen.getByText("Test Section")).toBeInTheDocument();
  });

  it("is collapsed by default", () => {
    render(<CollapsibleSection title="Test">hidden content</CollapsibleSection>);
    expect(screen.queryByTestId("collapsible-content")).not.toBeInTheDocument();
  });

  it("expands on click", () => {
    render(<CollapsibleSection title="Test">visible content</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
    expect(screen.getByText("visible content")).toBeInTheDocument();
  });

  it("collapses on second click", () => {
    render(<CollapsibleSection title="Test">content</CollapsibleSection>);
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    fireEvent.click(screen.getByTestId("collapsible-toggle"));
    expect(screen.queryByTestId("collapsible-content")).not.toBeInTheDocument();
  });

  it("can be default open", () => {
    render(<CollapsibleSection title="Test" defaultOpen>open content</CollapsibleSection>);
    expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
  });
});
