import type { Difficulty } from "@/types/game";

export function difficultyLabel(d: Difficulty): string {
  switch (d) {
    case 1:
      return "Easy";
    case 2:
      return "Medium";
    case 3:
      return "Hard";
    default:
      return "Mixed";
  }
}
