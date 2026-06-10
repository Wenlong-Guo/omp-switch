import { describe, expect, it } from "vitest";
import { applyModelMetadata, getModelMetadata } from "./modelMetadata";

describe("modelMetadata", () => {
  it("returns step model defaults", () => {
    const meta = getModelMetadata("step-3.7-flash");
    expect(meta?.reasoning).toBe(true);
    expect(meta?.input).toEqual(["text", "image"]);
    expect(meta?.contextWindow).toBe(128000);
    expect(meta?.thinkingLevelMap?.xhigh).toBe("high");
  });

  it("returns generic reasoning defaults for known model families", () => {
    const meta = getModelMetadata("gpt-5.99");
    expect(meta?.reasoning).toBe(true);
    expect(meta?.maxTokens).toBe(64000);
  });

  it("applies metadata without overwriting explicit fields", () => {
    const model = applyModelMetadata({ id: "gpt-5.5", maxTokens: 123, contextWindow: 256000 });
    expect(model.contextWindow).toBe(256000);
    expect(model.maxTokens).toBe(123);
  });
});
