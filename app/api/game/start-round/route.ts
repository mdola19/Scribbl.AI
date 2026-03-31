import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { Difficulty } from "@/types/game";
import { pickRandomWord } from "@/lib/words";
import { createServerRound } from "@/lib/round-store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const d = (body as { difficulty?: unknown; usedWords?: unknown })?.difficulty;
  const used = (body as { usedWords?: unknown })?.usedWords;

  const difficulty = Number(d) as Difficulty;
  if (![1, 2, 3].includes(difficulty)) {
    return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 });
  }

  if (!Array.isArray(used) || !used.every((w) => typeof w === "string")) {
    return NextResponse.json({ error: "invalid_used_words" }, { status: 400 });
  }

  const usedSet = new Set(used.map((w) => w.toLowerCase()));
  const entry = pickRandomWord(difficulty, usedSet);

  if (!entry) {
    return NextResponse.json(
      {
        error: "no_words_left",
        message: "No unused words for this difficulty.",
      },
      { status: 409 },
    );
  }

  const roundId = randomUUID();
  createServerRound(roundId, entry);

  return NextResponse.json({
    roundId,
    targetWord: entry.word,
    difficulty,
  });
}
