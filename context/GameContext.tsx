"use client";

import type { Difficulty } from "@/types/game";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [totalScore, setTotalScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);

  const resetScores = useCallback(() => {
    setTotalScore(0);
    setRoundsPlayed(0);
    setUsedWords([]);
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
