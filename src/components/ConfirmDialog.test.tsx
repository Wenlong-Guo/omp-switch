import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders title and message", () => {
    render(
      <ConfirmDialog
        title="确认删除"
        message="确定删除此项目？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "确认删除" })).toBeInTheDocument();
    expect(screen.getByText("确定删除此项目？")).toBeInTheDocument();
  });

  it("calls onCancel when clicking cancel button", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="确认"
        message="msg"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText("取消"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm when clicking confirm button", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="确认"
        message="msg"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "确认" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it("calls onCancel when clicking overlay", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="确认"
        message="msg"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    const overlay = document.body.querySelector(".fixed.inset-0");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not call onCancel when clicking dialog content", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="确认"
        message="msg"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "确认" }).closest("div")?.parentElement!);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("shows loading state during async confirm", async () => {
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    render(
      <ConfirmDialog
        title="确认"
        message="msg"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "确认" }));
    expect(screen.getByText("处理中...")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("处理中...")).not.toBeInTheDocument());
  });
});
