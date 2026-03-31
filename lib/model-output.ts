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
  const first = lines[0] ?? "no guess";
  const rest = lines.slice(1).join(" ").slice(0, 200);
  return {
    guess: first.slice(0, 120) || "no guess",
    thinking: rest || undefined,
  };
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
