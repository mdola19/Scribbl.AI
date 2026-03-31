"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SketchCanvas, { type SketchCanvasHandle } from "@/components/SketchCanvas";
import DifficultySlider from "@/components/DifficultySlider";
import LiveGuessesPanel from "@/components/LiveGuessesPanel";
import AiStatusIndicator from "@/components/AiStatusIndicator";
import RoundResultModal from "@/components/RoundResultModal";
import { useGameSession } from "@/context/GameContext";
import { DEFAULT_POLL_INTERVAL_MS, ROUND_SECONDS } from "@/lib/constants";
import type { AiStatus, Difficulty, LiveGuessItem, ScoreKind } from "@/types/game";

type Phase = "idle" | "playing" | "ending" | "result";

export default function GamePage() {
  const router = useRouter();
  const {
    totalScore,
    roundsPlayed,
    usedWords,
    difficulty,
    setDifficulty,
    resetScores,
    recordRound,
  } = useGameSession();

  const canvasRef = useRef<SketchCanvasHandle>(null);
  const roundIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const liveGenRef = useRef(0);
  const finalizingRef = useRef(false);
  const liveBusyRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [targetWord, setTargetWord] = useState("");
  const [liveGuesses, setLiveGuesses] = useState<LiveGuessItem[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [brush, setBrush] = useState(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [startError, setStartError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState("");
  const [modalGuess, setModalGuess] = useState("");
  const [modalKind, setModalKind] = useState<ScoreKind>("incorrect");
  const [modalPoints, setModalPoints] = useState(0);
  const targetWordRef = useRef("");

  useEffect(() => {
    targetWordRef.current = targetWord;
  }, [targetWord]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const beginRound = useCallback(async () => {
    setStartError(null);
    setAiStatus("idle");
    finalizingRef.current = false;
    liveGenRef.current += 1;

    const res = await fetch("/api/game/start-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, usedWords }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        typeof data.message === "string"
          ? data.message
          : data.error === "no_words_left"
            ? "All words in this difficulty were used. Reset scores or pick another level."
            : "Could not start round.";
      setStartError(msg);
      return;
    }

    const rid = data.roundId as string;
    const tw = data.targetWord as string;
    if (!rid || !tw) {
      setStartError("Invalid start response.");
      return;
    }

    roundIdRef.current = rid;
    setTargetWord(tw);
    setLiveGuesses([]);
    canvasRef.current?.clear();
    setSecondsLeft(ROUND_SECONDS);
    setPhase("playing");
    setModalOpen(false);
  }, [difficulty, usedWords]);

  const runLiveTick = useCallback(async () => {
    if (phaseRef.current !== "playing") return;
    if (liveBusyRef.current) return;
    const rid = roundIdRef.current;
    if (!rid) return;

    liveBusyRef.current = true;
    const myGen = liveGenRef.current;
    setAiStatus("analyzing");

    try {
      const snap = canvasRef.current?.getSnapshotDataUrl() ?? "";
      const blank = canvasRef.current?.isBlank() ?? true;

      if (blank || !snap) {
        setAiStatus("idle");
        return;
      }

      const res = await fetch("/api/game/live-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: rid, imageBase64: snap }),
      });

      const j = (res.ok ? await res.json().catch(() => ({})) : {}) as Record<
        string,
        unknown
      >;

      if (phaseRef.current !== "playing" || myGen !== liveGenRef.current) {
        return;
      }

      if (j.stale || j.error === "round_closed") {
        return;
      }

      if (!res.ok) {
        setAiStatus("error");
        setLiveGuesses((prev) => [
          {
            id: crypto.randomUUID(),
            text: "no guess",
            thinking: "Server hiccup — check your connection.",
            at: Date.now(),
          },
          ...prev,
        ]);
        return;
      }

      if (j.error && !j.guess) {
        setAiStatus("error");
        setLiveGuesses((prev) => [
          {
            id: crypto.randomUUID(),
            text: "no guess",
            thinking: "Ollama unreachable — keep sketching.",
            at: Date.now(),
          },
          ...prev,
        ]);
        return;
      }

      const guess = typeof j.guess === "string" && j.guess.trim() ? j.guess : "no guess";
      const thinking =
        typeof j.thinking === "string" && j.thinking.trim()
          ? j.thinking
          : undefined;

      setLiveGuesses((prev) => [
        { id: crypto.randomUUID(), text: guess, thinking, at: Date.now() },
        ...prev,
      ]);
      setAiStatus("idle");
    } catch {
      if (phaseRef.current === "playing" && myGen === liveGenRef.current) {
        setAiStatus("error");
      }
    } finally {
      liveBusyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (secondsLeft > 0) return;
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    void (async () => {
      liveGenRef.current += 1;
      setPhase("ending");
      setAiStatus("final_pending");

      const rid = roundIdRef.current;
      let finalGuess = "no guess";

      if (rid) {
        const snap = canvasRef.current?.getSnapshotDataUrl() ?? "";
        try {
          const fr = await fetch("/api/game/final-guess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roundId: rid, imageBase64: snap }),
          });
          const fj = await fr.json().catch(() => ({}));
          if (fj.stale) {
            finalGuess = "no guess";
          } else {
            finalGuess =
              typeof fj.guess === "string" && fj.guess.trim() ? fj.guess : "no guess";
            if (fj.error) setAiStatus("error");
          }
        } catch {
          setAiStatus("error");
        }

        try {
          const sr = await fetch("/api/game/score-round", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roundId: rid, finalGuess }),
          });
          const sj = await sr.json().catch(() => ({}));

          const tw = (sj.targetWord as string) || targetWord;
          const pts = Number(sj.points) as 0 | 1 | 2;
          const k = sj.kind as string;
          const kind: ScoreKind =
            k === "exact" || k === "synonym" || k === "incorrect" ? k : "incorrect";
          const displayGuess =
            (sj.finalGuessDisplay as string) || finalGuess;

          if (!sj.alreadyScored) {
            recordRound(tw, Number.isFinite(pts) ? pts : 0);
          }

          setModalTarget(tw);
          setModalGuess(displayGuess);
          setModalKind(kind);
          setModalPoints(Number.isFinite(pts) ? pts : 0);
        } catch {
          setModalTarget(targetWordRef.current);
          setModalGuess(finalGuess);
          setModalKind("incorrect");
          setModalPoints(0);
        }
      }

      setModalOpen(true);
      setPhase("result");
      setAiStatus("idle");
    })();
  }, [phase, secondsLeft, recordRound, targetWord]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      void runLiveTick();
    }, DEFAULT_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, runLiveTick]);

  const controlsDisabled = phase === "playing" || phase === "ending";
  const canvasDisabled = phase !== "playing";

  const closeModalNext = () => {
    setModalOpen(false);
    setPhase("idle");
    setSecondsLeft(ROUND_SECONDS);
    setTargetWord("");
    roundIdRef.current = null;
    finalizingRef.current = false;
  };

  const maxPossible = Math.max(0, roundsPlayed) * 2;

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45 hover:text-white/70"
            >
              ← Lobby
            </Link>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              The <span className="text-spotlight">Skribbl.AI</span> stage
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/55">
              Sketch the secret prompt. Every ~4s the vision model peeks — timer
              stop locks one final guess for points.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-stage-800/80 px-5 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Running score
              </p>
              <p className="font-display text-2xl font-bold text-accent-glow">
                {totalScore}{" "}
                <span className="text-sm font-normal text-white/40">
                  / {maxPossible || "—"}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetScores();
                setPhase("idle");
                setTargetWord("");
                roundIdRef.current = null;
                setLiveGuesses([]);
                canvasRef.current?.clear();
                setModalOpen(false);
              }}
              disabled={phase === "playing"}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:opacity-40"
            >
              Reset scoreboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/game/end")}
              disabled={phase === "playing"}
              className="rounded-xl bg-spotlight/90 px-4 py-3 text-sm font-semibold text-stage-950 hover:bg-spotlight disabled:opacity-40"
            >
              Finish run
            </button>
          </div>
        </header>

        <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-stage-900/40 p-5 backdrop-blur-sm sm:p-8">
          <DifficultySlider
            value={difficulty}
            onChange={setDifficulty}
            disabled={controlsDisabled}
          />

          {startError ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {startError}
            </p>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-spotlight/40 bg-black/30 px-6 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-spotlight/80">
                  Countdown
                </p>
                <p className="font-display text-4xl font-bold tabular-nums text-white">
                  {formatTime(secondsLeft)}
                </p>
              </div>
              <AiStatusIndicator status={aiStatus} />
            </div>

            <button
              type="button"
              onClick={() => void beginRound()}
              disabled={controlsDisabled}
              className="rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-45"
            >
              {phase === "idle" ? "Start round" : "Round in motion…"}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
                  Classified prompt — only for the contestant
                </p>
                <div className="mt-3 min-h-[3.5rem] rounded-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-4 py-4 ring-1 ring-inset ring-white/10">
                  {targetWord ? (
                    <p className="font-display text-3xl font-semibold capitalize tracking-tight text-white">
                      {targetWord}
                    </p>
                  ) : (
                    <p className="text-sm text-white/45">
                      Start a round to reveal tonight&apos;s cue.
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/35">
                  The model never sees this text — only your strokes.
                </p>
              </div>

              <SketchCanvas
                ref={canvasRef}
                disabled={canvasDisabled}
                brushSize={brush}
                tool={tool}
              />

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTool("pen")}
                    disabled={canvasDisabled}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      tool === "pen"
                        ? "bg-white text-stage-950"
                        : "bg-white/10 text-white/75 hover:bg-white/15"
                    } disabled:opacity-40`}
                  >
                    Black pen
                  </button>
                  <button
                    type="button"
                    onClick={() => setTool("eraser")}
                    disabled={canvasDisabled}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      tool === "eraser"
                        ? "bg-white text-stage-950"
                        : "bg-white/10 text-white/75 hover:bg-white/15"
                    } disabled:opacity-40`}
                  >
                    Eraser
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => canvasRef.current?.clear()}
                  disabled={canvasDisabled}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-40"
                >
                  Clear canvas
                </button>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  Brush
                  <input
                    type="range"
                    min={2}
                    max={28}
                    value={brush}
                    disabled={canvasDisabled}
                    onChange={(e) => setBrush(Number(e.target.value))}
                    className="w-28 accent-white disabled:opacity-40"
                  />
                </label>
              </div>
            </div>

            <LiveGuessesPanel items={liveGuesses} />
          </div>
        </section>
      </div>

      <RoundResultModal
        open={modalOpen}
        targetWord={modalTarget}
        finalGuess={modalGuess}
        kind={modalKind}
        points={modalPoints}
        onNextRound={() => {
          closeModalNext();
          void beginRound();
        }}
        onEndGame={() => {
          setModalOpen(false);
          router.push("/game/end");
        }}
      />
    </main>
  );
}
