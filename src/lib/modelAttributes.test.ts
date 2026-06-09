import { describe, it, expect } from "vitest";
import {
  getAllAttributes,
  getAttributesByCategory,
  getAttributesBySource,
  getAttributeMeta,
  getDefaultModel,
  applyCompatPreset,
  clearCompatPreset,
  getCategories,
  COMPAT_PRESETS,
  THINKING_LEVELS,
  MODALITY_OPTIONS,
} from "./modelAttributes";

describe("modelAttributes", () => {
  describe("getAllAttributes", () => {
    it("returns all registered attributes", () => {
      const all = getAllAttributes();
      expect(all.length).toBeGreaterThanOrEqual(40);
    });

    it("all attribute keys are unique", () => {
      const all = getAllAttributes();
      const keys = all.map((a) => a.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe("getAttributesByCategory", () => {
    it("filters by category basic", () => {
      const basic = getAttributesByCategory("basic");
      expect(basic.length).toBeGreaterThan(0);
      expect(basic.every((a) => a.category === "basic")).toBe(true);
    });

    it("filters by category compat", () => {
      const compat = getAttributesByCategory("compat");
      expect(compat.length).toBeGreaterThan(10);
      expect(compat.every((a) => a.category === "compat")).toBe(true);
    });

    it("filters by category cost", () => {
      const cost = getAttributesByCategory("cost");
      expect(cost.length).toBeGreaterThan(0);
      expect(cost.every((a) => a.category === "cost")).toBe(true);
    });

    it("filters by category capability", () => {
      const cap = getAttributesByCategory("capability");
      expect(cap.length).toBeGreaterThan(0);
      expect(cap.every((a) => a.category === "capability")).toBe(true);
    });

    it("filters by category advanced", () => {
      const adv = getAttributesByCategory("advanced");
      expect(adv.length).toBeGreaterThan(0);
      expect(adv.every((a) => a.category === "advanced")).toBe(true);
    });
  });

  describe("getAttributesBySource", () => {
    it("filters by source pi", () => {
      const pi = getAttributesBySource("pi");
      expect(pi.length).toBeGreaterThan(0);
      expect(pi.every((a) => a.source === "pi")).toBe(true);
    });

    it("filters by source opencode", () => {
      const opencode = getAttributesBySource("opencode");
      expect(opencode.length).toBeGreaterThan(0);
      expect(opencode.every((a) => a.source === "opencode")).toBe(true);
    });

    it("filters by source omp-switch", () => {
      const omp = getAttributesBySource("omp-switch");
      expect(omp.length).toBeGreaterThan(0);
      expect(omp.every((a) => a.source === "omp-switch")).toBe(true);
    });
  });

  describe("getAttributeMeta", () => {
    it("returns correct meta for known key", () => {
      const meta = getAttributeMeta("id");
      expect(meta).toBeDefined();
      expect(meta?.label).toBe("模型 ID");
      expect(meta?.type).toBe("text");
      expect(meta?.required).toBe(true);
    });

    it("returns undefined for unknown key", () => {
      const meta = getAttributeMeta("nonexistent_key_xyz");
      expect(meta).toBeUndefined();
    });

    it("returns correct meta for compat field", () => {
      const meta = getAttributeMeta("compat.supportsDeveloperRole");
      expect(meta).toBeDefined();
      expect(meta?.category).toBe("compat");
    });
  });

  describe("getDefaultModel", () => {
    it("returns complete default model", () => {
      const defaults = getDefaultModel();
      expect(defaults.id).toBe("");
      expect(defaults.name).toBe("");
      expect(defaults.reasoning).toBe(false);
      expect(defaults.contextWindow).toBe(128000);
      expect(defaults.maxTokens).toBe(16384);
    });

    it("returns default cost structure", () => {
      const defaults = getDefaultModel();
      expect(defaults.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
    });

    it("undefined fields are omitted", () => {
      const defaults = getDefaultModel();
      expect(defaults.family).toBeUndefined();
      expect(defaults.status).toBeUndefined();
    });
  });

  describe("applyCompatPreset", () => {
    it("applies ollama preset", () => {
      const result = applyCompatPreset("ollama");
      expect(result).toBeDefined();
      expect(result?.compat).toBeDefined();
      expect((result?.compat as Record<string, unknown>).supportsDeveloperRole).toBe(false);
      expect((result?.compat as Record<string, unknown>).supportsReasoningEffort).toBe(false);
    });

    it("applies anthropic preset", () => {
      const result = applyCompatPreset("anthropic");
      expect(result).toBeDefined();
      expect((result?.compat as Record<string, unknown>).forceAdaptiveThinking).toBe(true);
      expect((result?.compat as Record<string, unknown>).supportsEagerToolInputStreaming).toBe(true);
    });

    it("applies openrouter preset", () => {
      const result = applyCompatPreset("openrouter");
      expect(result).toBeDefined();
      expect((result?.compat as Record<string, unknown>).thinkingFormat).toBe("openrouter");
    });

    it("returns undefined for invalid preset name", () => {
      const result = applyCompatPreset("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("clearCompatPreset", () => {
    it("unchecks all compat fields", () => {
      const result = clearCompatPreset();
      expect(result.compat).toBeDefined();
      const compat = result.compat as Record<string, unknown>;
      expect(compat.supportsDeveloperRole).toBeUndefined();
      expect(compat.supportsReasoningEffort).toBeUndefined();
    });
  });

  describe("getCategories", () => {
    it("returns 5 categories", () => {
      const cats = getCategories();
      expect(cats).toHaveLength(5);
      expect(cats).toContain("basic");
      expect(cats).toContain("compat");
      expect(cats).toContain("cost");
      expect(cats).toContain("capability");
      expect(cats).toContain("advanced");
    });
  });

  describe("constants", () => {
    it("has correct thinking levels", () => {
      expect(THINKING_LEVELS).toHaveLength(6);
      expect(THINKING_LEVELS).toContain("off");
      expect(THINKING_LEVELS).toContain("xhigh");
    });

    it("has correct modality options", () => {
      expect(MODALITY_OPTIONS).toHaveLength(5);
      expect(MODALITY_OPTIONS).toContain("pdf");
    });

    it("has 3 compat presets", () => {
      expect(COMPAT_PRESETS).toHaveLength(3);
    });
  });

  describe("compat field types", () => {
    it("all compat fields have boolean or text type", () => {
      const compat = getAttributesByCategory("compat");
      const validTypes = ["boolean", "text", "select", "json"];
      expect(compat.every((a) => validTypes.includes(a.type))).toBe(true);
    });
  });
});
