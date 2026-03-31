"use client";

import type { AiStatus } from "@/types/game";

const LABEL: Record<AiStatus, string> = {
  idle: "Idle — awaiting sketch intel",
  analyzing: "Live guess incoming…",
  final_pending: "Final verdict pending",
  error: "Vision link shaky — still playing",
};

export default function AiStatusIndicator({ status }: { status: AiStatus }) {
  const dot =
    status === "analyzing"
      ? "animate-pulse-soft bg-accent shadow-[0_0_12px_rgba(124,92,255,0.8)]"
      : status === "final_pending"
        ? "animate-pulse-soft bg-spotlight shadow-[0_0_12px_rgba(255,215,106,0.55)]"
        : status === "error"
          ? "bg-red-400/90"
          : "bg-white/30";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-stage-800/60 px-4 py-3 backdrop-blur-sm">
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
        aria-hidden
      />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
          AI booth
        </p>
        <p className="text-sm font-medium text-white/90">{LABEL[status]}</p>
      </div>
    </div>
  );
}
