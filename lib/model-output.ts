export function parseLiveModelOutput(raw: string): {
  guess: string;
  thinking?: string;
} {
  const t = raw.trim();
  if (!t) return { guess: "no guess" };

  const lines = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Preferred format: first line = guess, second line+ = brief explanation.
  if (lines.length >= 2) {
    const first = lines[0] ?? "no guess";
    const rest = lines.slice(1).join(" ").slice(0, 200);
    return {
      guess: first.slice(0, 120) || "no guess",
      thinking: rest || undefined,
    };
  }

  // Fallback: single-line output like "bicycle - 5-6 word explanation".
  const single = lines[0] ?? "no guess";
  const sepMatch = single.match(/^(.+?)\s[-–—:]\s(.+)$/);
  if (sepMatch) {
    const guess = sepMatch[1].trim().slice(0, 120) || "no guess";
    const thinking = sepMatch[2].trim().slice(0, 200) || undefined;
    return { guess, thinking };
  }

  return { guess: single.slice(0, 120) || "no guess" };
}

export function parseFinalModelOutput(raw: string): string {
  const t = raw.trim();
  if (!t) return "no guess";
  const line = t.split(/\r?\n/)[0]?.trim() ?? "";
  const cleaned = line.replace(/^["'\s]+|["'\s]+$/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
  const phrase = words.join(" ").trim();
  return phrase || "no guess";
}
