"use client";

import type { LiveGuessItem } from "@/types/game";
import { useEffect, useRef } from "react";

export default function LiveGuessesPanel({ items }: { items: LiveGuessItem[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [items.length]);

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-2xl border border-accent/25 bg-gradient-to-b from-stage-800/90 to-stage-900/95 p-4 shadow-lg shadow-accent/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-glow/90">
            Live guess ticker
          </p>
          <p className="text-xs text-white/55">Fresh takes from the vision model</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/45">
          {items.length} blips
        </span>
      </div>
      <ul
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/45">
            Sketches start silent — doodle to wake the AI chatter.
          </li>
        ) : (
          items.map((g, i) => (
            <li
              key={g.id}
              className={`rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-md shadow-black/20 ${i === 0 ? "animate-guess-pop" : ""}`}
            >
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                {g.text}
              </p>
              {g.thinking ? (
                <p className="mt-1 text-xs leading-relaxed text-spotlight/85">
                  {g.thinking}
                </p>
              ) : null}
              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/35">
                {new Date(g.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
