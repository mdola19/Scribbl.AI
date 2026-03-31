export type Difficulty = 1 | 2 | 3;

export interface WordEntry {
  word: string;
  difficulty: Difficulty;
  synonyms: string[];
}

export type AiStatus = "idle" | "analyzing" | "final_pending" | "error";

export type RoundPhase = "idle" | "playing" | "ended";

export interface LiveGuessItem {
  id: string;
  text: string;
  thinking?: string;
  at: number;
}

export type ScoreKind = "exact" | "synonym" | "incorrect";

export interface ScoreResult {
  points: 0 | 1 | 2;
  kind: ScoreKind;
  targetWord: string;
  finalGuess: string;
  normalizedTarget: string;
  normalizedGuess: string;
}

export interface StartRoundResponse {
  roundId: string;
  targetWord: string;
  difficulty: Difficulty;
}

export interface LiveGuessResponse {
  guess: string;
  thinking?: string;
  error?: string;
}

export interface FinalGuessResponse {
  guess: string;
  error?: string;
}

export interface ScoreRoundResponse {
  points: 0 | 1 | 2;
  kind: ScoreKind;
  targetWord: string;
  finalGuessDisplay: string;
  alreadyScored?: boolean;
}
