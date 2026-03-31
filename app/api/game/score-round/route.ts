import { NextResponse } from "next/server";
import { scoreKindLabel } from "@/lib/scoring";
import { scoreServerRound } from "@/lib/round-store";
import type { ScoreRoundResponse } from "@/types/game";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const roundId = (body as { roundId?: unknown })?.roundId;
  const finalGuess = (body as { finalGuess?: unknown })?.finalGuess;

  if (typeof roundId !== "string" || !roundId.length) {
    return NextResponse.json({ error: "missing_round" }, { status: 400 });
  }
  if (typeof finalGuess !== "string") {
    return NextResponse.json({ error: "missing_guess" }, { status: 400 });
  }

  const scored = scoreServerRound(roundId, finalGuess);

  if (!scored) {
    const payload: ScoreRoundResponse = {
      points: 0,
      kind: "incorrect",
      targetWord: "",
      finalGuessDisplay: finalGuess,
      alreadyScored: true,
    };
    return NextResponse.json(payload);
  }

  return NextResponse.json({
    points: scored.points,
    kind: scored.kind,
    targetWord: scored.targetWord,
    finalGuessDisplay: scored.finalGuess,
    label: scoreKindLabel(scored.kind),
  });
}
