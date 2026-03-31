import { NextResponse } from "next/server";
import { ollamaVisionGuess } from "@/lib/ollama";
import { parseLiveModelOutput } from "@/lib/model-output";
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

  if (typeof roundId === "string" && roundId.length > 0) {
    const r = getServerRound(roundId);
    if (!r) {
      return NextResponse.json({ guess: "", error: "unknown_round" }, { status: 404 });
    }
    if (r.scored) {
      return NextResponse.json({
        guess: "",
        error: "round_closed",
        stale: true,
      });
    }
  }

  const result = await ollamaVisionGuess(imageBase64, "live");

  if (!result.ok) {
    return NextResponse.json({
      guess: "no guess",
      thinking: undefined,
      error: result.error ?? "ollama_error",
    });
  }

  const { guess, thinking } = parseLiveModelOutput(result.text);
  return NextResponse.json({ guess, thinking });
}
