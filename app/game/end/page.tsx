"use client";

import Link from "next/link";
import { useGameSession } from "@/context/GameContext";

export default function EndGamePage() {
  const { totalScore, roundsPlayed, resetScores } = useGameSession();
  const maxPossible = roundsPlayed * 2;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="relative z-10 max-w-lg rounded-3xl border border-white/10 bg-stage-900/80 p-10 text-center shadow-2xl shadow-accent/10 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-spotlight">
          Curtain call
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white">
          Run complete
        </h1>
        {roundsPlayed === 0 ? (
          <p className="mt-4 text-white/65">
            No scored rounds yet — head back to the stage and lock in a finale
            to fill this marquee.
          </p>
        ) : (
          <p className="mt-4 text-white/65">
            You finished{" "}
            <strong className="text-white">{roundsPlayed}</strong> scored round
            {roundsPlayed === 1 ? "" : "s"} with a tally of{" "}
            <strong className="text-accent-glow">{totalScore}</strong> out of{" "}
            <strong className="text-white">{maxPossible}</strong> possible points.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/game"
            className="inline-flex justify-center rounded-2xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent-dim"
            onClick={() => {
              /* keep scores — user can reset on game page */
            }}
          >
            Back to stage
          </Link>
          <button
            type="button"
            className="inline-flex justify-center rounded-2xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
            onClick={() => {
              resetScores();
            }}
          >
            Reset scoreboard
          </button>
          <Link
            href="/"
            className="inline-flex justify-center rounded-2xl border border-white/15 px-8 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Lobby
          </Link>
        </div>
        <p className="mt-6 text-xs text-white/40">
          Max score assumes two points every round — a crisp 2.0 average is elite.
        </p>
      </div>
    </main>
  );
}
