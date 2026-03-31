import type { Difficulty, WordEntry } from "@/types/game";
import wordsData from "@/data/words.json";

const corpus = wordsData as WordEntry[];

export function getAllWords(): WordEntry[] {
  return corpus;
}

export function pickRandomWord(
  difficulty: Difficulty,
  usedLowercase: Set<string>,
): WordEntry | null {
  const pool = corpus.filter(
    (w) =>
      w.difficulty === difficulty &&
      !usedLowercase.has(w.word.toLowerCase()),
  );
  if (pool.length === 0) return null;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice ?? null;
}
