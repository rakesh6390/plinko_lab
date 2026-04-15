// testing fairness function
import { describe, expect, it } from "vitest";
import {
  createCombinedSeed,
  createCommit,
  seedToNumber,
} from "../lib/fairness";

describe("Fairness Functions", () => {
  it("should generate correct commit hash", () => {
    const serverSeed = "abc123";
    const nonce = "42";

    const commit = createCommit(serverSeed, nonce);

    expect(commit).toBeTypeOf("string");
    expect(commit.length).toBe(64);
  });

  it("should generate combined seed", () => {
    const serverSeed = "abc";
    const clientSeed = "hello";
    const nonce = "1";

    const combined = createCombinedSeed(serverSeed, clientSeed, nonce);

    expect(combined).toBeTypeOf("string");
    expect(combined.length).toBe(64);
  });

  it("should convert seed to number", () => {
    const seed =
      "e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0";

    const num = seedToNumber(seed);

    expect(num).toBeTypeOf("number");
    expect(num).toBeGreaterThan(0);
  });
});
