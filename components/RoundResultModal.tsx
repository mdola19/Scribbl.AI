"use client";

import type { ScoreKind } from "@/types/game";
import { scoreKindLabel } from "@/lib/scoring";

type Props = {
  open: boolean;
  targetWord: string;
  finalGuess: string;
  kind: ScoreKind;
  points: number;
  onNextRound: () => void;
  onEndGame: () => void;
};

function badge(kind: ScoreKind) {
  switch (kind) {
    case "exact":
      return "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40";
    case "synonym":
      return "bg-amber-400/15 text-amber-100 ring-amber-300/35";
    default:
      return "bg-white/10 text-white/70 ring-white/20";
  }
}

export default function RoundResultModal({
  open,
  targetWord,
  finalGuess,
  kind,
  points,
  onNextRound,
  onEndGame,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-stage-800 to-stage-950 p-8 shadow-2xl shadow-accent/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-result-title"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-spotlight/15 blur-3xl" />

        <p
          id="round-result-title"
          className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-spotlight"
        >
          Round verdict
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-white">
          {points === 2 ? "Spot on!" : points === 1 ? "Close enough!" : "Nice try!"}
        </h2>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              Secret prompt
            </span>
            <span className="text-xl font-semibold capitalize text-white">
              {targetWord}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              AI final guess
            </span>
            <span className="text-lg font-medium text-accent-glow">
              {finalGuess}
            </span>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge(kind)}`}
          >
            {scoreKindLabel(kind)}
            <span className="text-white/80">·</span>
            <span>+{points} pts</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onNextRound}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent-dim"
          >
            Next round
          </button>
          <button
            type="button"
            onClick={onEndGame}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            Finish & see totals
          </button>
        </div>
      </div>
    </div>
  );
}
