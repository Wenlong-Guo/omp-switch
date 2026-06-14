import { describe, expect, it } from "vitest";
import { shortcutLabel } from "./shortcutLabels";

describe("shortcutLabel", () => {
  it("uses command symbol on macOS", () => {
    expect(shortcutLabel("n", "MacIntel")).toBe("⌘N");
  });

  it("uses Ctrl on Windows/Linux", () => {
    expect(shortcutLabel("k", "Win32")).toBe("Ctrl+K");
    expect(shortcutLabel("s", "Linux x86_64")).toBe("Ctrl+S");
  });
});
