import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToastStore } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("has initial empty toasts", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("shows a toast", () => {
    useToastStore.getState().show("Test message", "success");
    expect(useToastStore.getState().toasts.length).toBe(1);
    expect(useToastStore.getState().toasts[0].message).toBe("Test message");
    expect(useToastStore.getState().toasts[0].type).toBe("success");
  });

  it("shows a toast with default type", () => {
    useToastStore.getState().show("Default message");
    expect(useToastStore.getState().toasts[0].type).toBe("success");
  });

  it("removes a toast by id", () => {
    useToastStore.getState().show("Test", "success");
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("auto-removes toast after 3 seconds", () => {
    vi.useFakeTimers();
    useToastStore.getState().show("Auto remove");
    expect(useToastStore.getState().toasts.length).toBe(1);
    vi.advanceTimersByTime(3001);
    expect(useToastStore.getState().toasts.length).toBe(0);
    vi.useRealTimers();
  });

  it("shows error toast", () => {
    useToastStore.getState().show("Error message", "error");
    expect(useToastStore.getState().toasts[0].type).toBe("error");
  });
});
