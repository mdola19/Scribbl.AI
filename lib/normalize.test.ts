import { describe, expect, it } from "vitest";
import { normalizeGuess } from "@/lib/normalize";

describe("normalizeGuess", () => {
  it("lowercases and trims", () => {
    expect(normalizeGuess("  Bicycle ")).toBe("bicycle");
  });

  it("removes surrounding punctuation", () => {
    expect(normalizeGuess('"Bike!"')).toBe("bike");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeGuess("ice  cream")).toBe("ice cream");
  });

  it("handles empty", () => {
    expect(normalizeGuess("")).toBe("");
  });
});
