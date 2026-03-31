import type { ScoreKind, ScoreResult, WordEntry } from "@/types/game";
import { normalizeGuess } from "@/lib/normalize";

export function guessWordsOverlap(normalizedGuess: string, normalizedPhrase: string): boolean {
  if (!normalizedGuess || !normalizedPhrase) return false;
  if (normalizedGuess === normalizedPhrase) return true;
  const guessTokens = normalizedGuess.split(/\s+/).filter(Boolean);
  const phraseTokens = new Set(normalizedPhrase.split(/\s+/).filter(Boolean));
  if (guessTokens.length === 0) return false;
  return guessTokens.some((t) => phraseTokens.has(t) && t.length > 0);
}

export function scoreGuess(
  target: WordEntry,
  rawFinalGuess: string,
): ScoreResult {
  const finalGuess = rawFinalGuess?.trim() ? rawFinalGuess : "no guess";
  const normalizedTarget = normalizeGuess(target.word);
  const normalizedGuess = normalizeGuess(finalGuess);
  const normalizedSynonyms = target.synonyms.map((s) => normalizeGuess(s));

  if (!normalizedGuess || normalizedGuess === "no guess") {
    return {
      points: 0,
      kind: "incorrect",
      targetWord: target.word,
      finalGuess,
      normalizedTarget,
      normalizedGuess: normalizedGuess || "no guess",
    };
  }

  if (normalizedGuess === normalizedTarget) {
    return {
      points: 2,
      kind: "exact",
      targetWord: target.word,
      finalGuess,
      normalizedTarget,
      normalizedGuess,
    };
  }

  const synonymHit = normalizedSynonyms.some(
    (syn) =>
      syn &&
      (normalizedGuess === syn ||
        guessWordsOverlap(normalizedGuess, syn) ||
        guessWordsOverlap(syn, normalizedGuess)),
  );

  if (synonymHit) {
    return {
      points: 1,
      kind: "synonym",
      targetWord: target.word,
      finalGuess,
      normalizedTarget,
      normalizedGuess,
    };
  }

  return {
    points: 0,
    kind: "incorrect",
    targetWord: target.word,
    finalGuess,
    normalizedTarget,
    normalizedGuess,
  };
}

export function scoreKindLabel(kind: ScoreKind): string {
  switch (kind) {
    case "exact":
      return "Exact match";
    case "synonym":
      return "Synonym match";
    default:
      return "No match";
  }
}
