import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  it("triggers onSave on Cmd+S", () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));
    fireKeyDown("s", true);
    expect(onSave).toHaveBeenCalled();
  });

  it("triggers onSave on Ctrl+S", () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));
    fireKeyDown("s", false, true);
    expect(onSave).toHaveBeenCalled();
  });

  it("triggers onSearch on Cmd+K", () => {
    const onSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearch }));
    fireKeyDown("k", true);
    expect(onSearch).toHaveBeenCalled();
  });

  it("triggers onNew on Ctrl+N", () => {
    const onNew = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNew }));
    fireKeyDown("n", false, true);
    expect(onNew).toHaveBeenCalled();
  });

  it("triggers onEscape on Escape key", () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onEscape }));
    fireKeyDown("Escape", false);
    expect(onEscape).toHaveBeenCalled();
  });

  it("does not trigger onSave for plain S", () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));
    fireKeyDown("s", false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({}));
    unmount();
    // Should not throw when firing keydown after unmount
    fireKeyDown("s", true);
  });
});

function fireKeyDown(key: string, metaKey = false, ctrlKey = false) {
  const event = new KeyboardEvent("keydown", { key, metaKey, ctrlKey, bubbles: true });
  document.dispatchEvent(event);
}
