import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Toast from "./Toast";
import { useToastStore } from "@/stores/toastStore";

describe("Toast", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when no toasts", () => {
    const { container } = render(<Toast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders success toast", () => {
    act(() => {
      useToastStore.getState().show("保存成功", "success");
    });
    render(<Toast />);
    expect(screen.getByText("保存成功")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders error toast", () => {
    act(() => {
      useToastStore.getState().show("保存失败", "error");
    });
    render(<Toast />);
    expect(screen.getByText("保存失败")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("auto removes after 1.5 seconds for success", async () => {
    vi.useFakeTimers();
    act(() => {
      useToastStore.getState().show("临时消息", "success");
    });
    render(<Toast />);
    expect(screen.getByText("临时消息")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText("临时消息")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("error toast does not auto remove", async () => {
    vi.useFakeTimers();
    act(() => {
      useToastStore.getState().show("错误消息", "error");
    });
    render(<Toast />);
    expect(screen.getByText("错误消息")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("错误消息")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("removes on click", () => {
    act(() => {
      useToastStore.getState().show("点击移除", "success");
    });
    render(<Toast />);
    const toast = screen.getByText("点击移除").closest("[role='alert']")!;
    fireEvent.click(toast);
    expect(screen.queryByText("点击移除")).not.toBeInTheDocument();
  });
});
