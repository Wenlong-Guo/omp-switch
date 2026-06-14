import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModelRoles from "./ModelRoles";

const mocks = vi.hoisted(() => ({
  saveSettings: vi.fn(),
  providerStore: {
    providers: [
      { id: "step-plan", name: "step-plan", enabled: true, models: [{ id: "Step-3.7-flash", name: "Step-3.7-flash" }] },
      { id: "disabled", name: "disabled", enabled: false, models: [{ id: "hidden", name: "Hidden" }] },
    ],
    fetchProviders: vi.fn(),
  },
  settingsStore: {
    settings: { modelRoles: { default: "step-plan/Step-3.7-flash" } },
    fetchSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}));

mocks.settingsStore.saveSettings = mocks.saveSettings;

vi.mock("@/stores/providerStore", () => ({
  useProviderStore: () => mocks.providerStore,
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => mocks.settingsStore,
}));

describe("ModelRoles", () => {
  it("renders all stable roles", () => {
    render(<ModelRoles />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Smol")).toBeInTheDocument();
    expect(screen.getByText("Slow")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Vision")).toBeInTheDocument();
    expect(screen.getByText("Commit")).toBeInTheDocument();
  });

  it("only lists enabled provider models", () => {
    render(<ModelRoles />);
    expect(screen.getAllByText("step-plan / Step-3.7-flash").length).toBeGreaterThan(0);
    expect(screen.queryByText("disabled / Hidden")).not.toBeInTheDocument();
  });

  it("saves selected role models", () => {
    render(<ModelRoles />);
    fireEvent.change(screen.getByTestId("role-select-plan"), { target: { value: "step-plan/Step-3.7-flash" } });
    fireEvent.click(screen.getByText("保存模型角色"));
    expect(mocks.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
      modelRoles: { default: "step-plan/Step-3.7-flash", plan: "step-plan/Step-3.7-flash" },
    }));
  });

  it("clears role model", () => {
    render(<ModelRoles />);
    fireEvent.click(screen.getByTestId("clear-role-default"));
    fireEvent.click(screen.getByText("保存模型角色"));
    expect(mocks.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ modelRoles: {} }));
  });
});
