import type { ScoreResult, WordEntry } from "@/types/game";
import { scoreGuess } from "@/lib/scoring";

interface StoredRound {
  word: WordEntry;
  scored: boolean;
  createdAt: number;
}

/** Survives Next.js dev HMR so live-guess still finds rounds after start-round */
const globalForRounds = globalThis as unknown as {
  __skribblRoundStore?: Map<string, StoredRound>;
};
const rounds =
  globalForRounds.__skribblRoundStore ?? new Map<string, StoredRound>();
globalForRounds.__skribblRoundStore = rounds;

const MAX_ROUNDS = 500;

function pruneOld() {
  if (rounds.size <= MAX_ROUNDS) return;
  const entries = [...rounds.entries()].sort(
    (a, b) => a[1].createdAt - b[1].createdAt,
  );
  const excess = rounds.size - MAX_ROUNDS;
  for (let i = 0; i < excess; i++) {
    const k = entries[i]?.[0];
    if (k) rounds.delete(k);
  }
}

export function createServerRound(roundId: string, entry: WordEntry): void {
  pruneOld();
  rounds.set(roundId, {
    word: entry,
    scored: false,
    createdAt: Date.now(),
  });
}

export function getServerRound(roundId: string): StoredRound | undefined {
  return rounds.get(roundId);
}

/** Returns null if round missing or already scored */
export function scoreServerRound(
  roundId: string,
  finalGuess: string,
): ScoreResult | null {
  const r = rounds.get(roundId);
  if (!r || r.scored) return null;
  r.scored = true;
  return scoreGuess(r.word, finalGuess);
}

export function hasServerRound(roundId: string): boolean {
  return rounds.has(roundId);
}
