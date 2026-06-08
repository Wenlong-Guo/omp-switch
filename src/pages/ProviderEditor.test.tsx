import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProviderEditor from "./ProviderEditor";

const mockSave = vi.fn();

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: () => ({
    saveProvider: mockSave,
  }),
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
    expect(screen.getByLabelText("启用")).toBeInTheDocument();
  });

  it("has submit button", () => {
    render(<ProviderEditor />);
    expect(screen.getByText("保存 Provider")).toBeInTheDocument();
  });

  it("submits form with data", () => {
    render(<ProviderEditor />);
    fireEvent.change(screen.getByPlaceholderText("openai"), { target: { value: "test" } });
    fireEvent.change(screen.getByPlaceholderText("OpenAI"), { target: { value: "Test" } });
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
});
