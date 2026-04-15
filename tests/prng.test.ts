// for prng genrate number b/w 0-1
import { describe, expect, it } from "vitest";
import { createXorShift32 } from "../lib/prng";

describe("PRNG - xorshift32", () => {
  it("should generate deterministic numbers", () => {
    const rng1 = createXorShift32(12345);
    const rng2 = createXorShift32(12345);

    const values1 = [rng1(), rng1(), rng1()];
    const values2 = [rng2(), rng2(), rng2()];

    expect(values1).toEqual(values2);
  });

  it("should produce numbers between 0 and 1", () => {
    const rng = createXorShift32(999);

    const val = rng();

    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });
});
