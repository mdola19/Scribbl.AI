import { describe, expect, it } from "vitest";
import { scoreGuess } from "@/lib/scoring";
import type { WordEntry } from "@/types/game";

const bicycle: WordEntry = {
  word: "bicycle",
  difficulty: 2,
  synonyms: ["bike", "cycle"],
};

describe("scoreGuess", () => {
  it("exact match is 2 points", () => {
    const r = scoreGuess(bicycle, "Bicycle!");
    expect(r.points).toBe(2);
    expect(r.kind).toBe("exact");
  });

  it("synonym match is 1 point", () => {
    const r = scoreGuess(bicycle, "a bike");
    expect(r.points).toBe(1);
    expect(r.kind).toBe("synonym");
  });

  it("incorrect is 0 points", () => {
    const r = scoreGuess(bicycle, "zeppelin");
    expect(r.points).toBe(0);
    expect(r.kind).toBe("incorrect");
  });

  it("empty guess is incorrect", () => {
    const r = scoreGuess(bicycle, "   ");
    expect(r.points).toBe(0);
    expect(r.kind).toBe("incorrect");
  });
});
