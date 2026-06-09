import { describe, it, expect } from "vitest";
import { validateProviderImport } from "./importValidation";

describe("validateProviderImport", () => {
  it("rejects non-array input", () => {
    const result = validateProviderImport({});
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toBe("导入数据必须是 Provider 数组");
  });

  it("rejects null input", () => {
    const result = validateProviderImport(null);
    expect(result.valid).toBe(false);
  });

  it("rejects non-object items", () => {
    const result = validateProviderImport(["string"]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("不是有效的对象");
  });

  it("rejects item without id", () => {
    const result = validateProviderImport([{ name: "Test" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("缺少有效的 id");
  });

  it("rejects item with empty id", () => {
    const result = validateProviderImport([{ id: "   ", name: "Test" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("缺少有效的 id");
  });

  it("rejects item without name", () => {
    const result = validateProviderImport([{ id: "test" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("缺少有效的 name");
  });

  it("rejects item with empty name", () => {
    const result = validateProviderImport([{ id: "test", name: "   " }]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("缺少有效的 name");
  });

  it("rejects invalid api type", () => {
    const result = validateProviderImport([{ id: "test", name: "Test", api: "invalid" }]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("api 类型无效");
  });

  it("accepts valid api types", () => {
    const apis = [
      "openai-completions",
      "openai-responses",
      "openai-codex-responses",
      "azure-openai-responses",
      "anthropic-messages",
      "google-generative-ai",
      "google-vertex",
    ];
    for (const api of apis) {
      const result = validateProviderImport([{ id: "test", name: "Test", api }]);
      expect(result.valid).toBe(true);
    }
  });

  it("accepts valid provider without api field", () => {
    const result = validateProviderImport([{ id: "test", name: "Test" }]);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.providers).toHaveLength(1);
  });

  it("accepts multiple valid providers", () => {
    const result = validateProviderImport([
      { id: "a", name: "A", api: "openai-completions" },
      { id: "b", name: "B", api: "anthropic-messages" },
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.providers).toHaveLength(2);
  });

  it("returns correct error index for second item", () => {
    const result = validateProviderImport([
      { id: "a", name: "A" },
      { id: "", name: "B" },
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("第 2 项");
  });

  it("accepts empty array", () => {
    const result = validateProviderImport([]);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.providers).toHaveLength(0);
  });
});
