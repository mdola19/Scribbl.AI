import { NextResponse } from "next/server";
import { ollamaVisionGuess } from "@/lib/ollama";
import { parseFinalModelOutput } from "@/lib/model-output";
import { getServerRound } from "@/lib/round-store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const imageBase64 = (body as { imageBase64?: unknown })?.imageBase64;
  const roundId = (body as { roundId?: unknown })?.roundId;

  if (typeof imageBase64 !== "string" || !imageBase64.length) {
    return NextResponse.json({ error: "missing_image" }, { status: 400 });
  }

  if (typeof roundId !== "string" || !roundId.length) {
    return NextResponse.json({ error: "missing_round" }, { status: 400 });
  }

  const r = getServerRound(roundId);
  if (!r) {
    return NextResponse.json({ error: "unknown_round" }, { status: 404 });
  }
  if (r.scored) {
    return NextResponse.json({
      guess: "no guess",
      error: "round_closed",
      stale: true,
    });
  }

  const result = await ollamaVisionGuess(imageBase64, "final");

  if (!result.ok) {
    return NextResponse.json({
      guess: "no guess",
      error: result.error ?? "ollama_error",
    });
  }

  const guess = parseFinalModelOutput(result.text);
  return NextResponse.json({ guess });
}
