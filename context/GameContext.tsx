"use client";

import type { Difficulty } from "@/types/game";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

interface GameContextValue {
  totalScore: number;
  roundsPlayed: number;
  usedWords: string[];
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  resetScores: () => void;
  recordRound: (targetWord: string, points: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "skribbl_ai_score_v1";

type PersistedGameState = {
  totalScore: number;
  roundsPlayed: number;
  usedWords: string[];
  difficulty: Difficulty;
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [totalScore, setTotalScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
      if (typeof parsed.totalScore !== "number") return 0;
      return parsed.totalScore;
    } catch {
      return 0;
    }
  });
  const [roundsPlayed, setRoundsPlayed] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
      if (typeof parsed.roundsPlayed !== "number") return 0;
      return parsed.roundsPlayed;
    } catch {
      return 0;
    }
  });
  const [usedWords, setUsedWords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
      if (!Array.isArray(parsed.usedWords)) return [];
      return parsed.usedWords.filter((w): w is string => typeof w === "string");
    } catch {
      return [];
    }
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 1;
      const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
      const d = Number(parsed.difficulty);
      if (d === 1 || d === 2 || d === 3) return d as Difficulty;
      return 1;
    } catch {
      return 1;
    }
  });

  const resetScores = useCallback(() => {
    setTotalScore(0);
    setRoundsPlayed(0);
    setUsedWords([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore quota/storage errors.
      }
    }
  }, []);

  const recordRound = useCallback((targetWord: string, points: number) => {
    const w = targetWord.trim().toLowerCase();
    setUsedWords((prev) => {
      if (!w || prev.includes(w)) return prev;
      return [...prev, w];
    });
    setRoundsPlayed((n) => n + 1);
    setTotalScore((s) => s + points);
  }, []);

  useEffect(() => {
    // Persist score across reloads (no server storage needed for MVP).
    if (typeof window === "undefined") return;
    const payload: PersistedGameState = {
      totalScore,
      roundsPlayed,
      usedWords,
      difficulty,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore write failures (e.g. storage quota / private mode).
    }
  }, [totalScore, roundsPlayed, usedWords, difficulty]);

  const value = useMemo(
    () => ({
      totalScore,
      roundsPlayed,
      usedWords,
      difficulty,
      setDifficulty,
      resetScores,
      recordRound,
    }),
    [
      totalScore,
      roundsPlayed,
      usedWords,
      difficulty,
      resetScores,
      recordRound,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameSession() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGameSession must be used within GameProvider");
  }
  return ctx;
}
