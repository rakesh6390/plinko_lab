import { describe, expect, it } from "vitest";
import { runPlinkoEngine } from "../lib/engine";

describe("Plinko Engine", () => {
  it("should produce deterministic results", () => {
    const seed =
      "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0";

    const result1 = runPlinkoEngine(seed, 12, 6);
    const result2 = runPlinkoEngine(seed, 12, 6);

    expect(result1.binIndex).toEqual(result2.binIndex);
    expect(result1.path).toEqual(result2.path);
  });

  it("should produce valid bin index", () => {
    const seed =
      "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0";

    const result = runPlinkoEngine(seed, 12, 6);

    expect(result.binIndex).toBeGreaterThanOrEqual(0);
    expect(result.binIndex).toBeLessThanOrEqual(12);
  });
});
