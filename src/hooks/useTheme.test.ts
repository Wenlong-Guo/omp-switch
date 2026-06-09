import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("adds dark class to html element", () => {
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
