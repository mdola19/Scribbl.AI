"use client";

import type { Difficulty } from "@/types/game";
import { difficultyLabel } from "@/lib/difficulty-label";

type Props = {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
};

export default function DifficultySlider({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spotlight/90">
          Difficulty dial
        </p>
        <p className="text-sm text-white/70">
          {difficultyLabel(value)} prompts — tune the heat for your round.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-white/50">Easy</span>
        <input
          type="range"
          min={1}
          max={3}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) as Difficulty)}
          className="h-2 w-40 max-w-[50vw] cursor-pointer accent-accent disabled:opacity-40 md:w-52"
          aria-label="Difficulty"
        />
        <span className="text-xs text-white/50">Hard</span>
      </div>
    </div>
  );
}
