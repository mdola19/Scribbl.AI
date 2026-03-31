import { describe, expect, it } from "vitest";
import { getAllWords, pickRandomWord } from "@/lib/words";

describe("pickRandomWord", () => {
  it("returns a word for difficulty when pool exists", () => {
    const w = pickRandomWord(1, new Set());
    expect(w).not.toBeNull();
    expect(w?.difficulty).toBe(1);
  });

  it("returns null when all words of difficulty are used", () => {
    const all = getAllWords();
    const used = new Set(
      all.filter((x) => x.difficulty === 1).map((x) => x.word.toLowerCase()),
    );
    expect(pickRandomWord(1, used)).toBeNull();
  });
});
