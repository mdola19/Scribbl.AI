"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  canvasToJpegDataUrl,
  encodeSnapshot,
  isCanvasMostlyBlank,
} from "@/lib/client/canvas-utils";

export type SketchCanvasHandle = {
  /** Final guess / scoring — JPEG only */
  getSnapshotDataUrl: () => string;
  /** Live polling — one resize + encode + blank check */
  getSnapshotForGuess: () => { dataUrl: string; isBlank: boolean };
  isBlank: () => boolean;
  canUndo: () => boolean;
  undoLastStroke: () => void;
  clear: () => void;
};

type Tool = "pen" | "eraser";

const BG = "#fafafa";

/** Pointer → logical drawing coords (matches ctx after setTransform(dpr)). */
function getPos(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent | React.TouchEvent,
  logicalW: number,
  logicalH: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = logicalW / rect.width;
  const scaleY = logicalH / rect.height;
  if ("touches" in e) {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (!t) return { x: 0, y: 0 };
    return {
      x: (t.clientX - rect.left) * scaleX,
      y: (t.clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

type Props = {
  disabled?: boolean;
  brushSize: number;
  tool: Tool;
  className?: string;
};

const SketchCanvas = forwardRef<SketchCanvasHandle, Props>(function SketchCanvas(
  { disabled, brushSize, tool, className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const logicalSizeRef = useRef({ w: 520, h: 390 });
  const lastAppliedSizeRef = useRef<{ w: number; h: number } | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const MAX_UNDO = 25;
  const [sizeCss, setSizeCss] = useState({ w: 520, h: 390 });

  const fillBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
    },
    [],
  );

  const applySize = useCallback(
    (w: number, h: number, preserveDrawing: boolean) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;

      logicalSizeRef.current = { w, h };

      const shouldPreserve =
        preserveDrawing && c.width >= 2 && c.height >= 2;

      if (!shouldPreserve) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fillBackground(ctx, w, h);
        return;
      }

      const snap = document.createElement("canvas");
      snap.width = c.width;
      snap.height = c.height;
      snap.getContext("2d")!.drawImage(c, 0, 0);

      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fillBackground(ctx, w, h);
      ctx.drawImage(snap, 0, 0, snap.width, snap.height, 0, 0, w, h);
    },
    [fillBackground],
  );

  useEffect(() => {
    const { w, h } = sizeCss;
    const prev = lastAppliedSizeRef.current;
    if (prev !== null && prev.w === w && prev.h === h) {
      return;
    }
    const resized = prev !== null && (prev.w !== w || prev.h !== h);
    const preserve = prev !== null && resized;
    lastAppliedSizeRef.current = { w, h };
    if (resized) {
      // Undo snapshots are tied to the previous bitmap size.
      undoStackRef.current = [];
      drawing.current = false;
      last.current = null;
    }
    applySize(w, h, preserve);
  }, [sizeCss.w, sizeCss.h, applySize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const ro = new ResizeObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const r = el.getBoundingClientRect();
        const w = Math.max(280, Math.floor(r.width));
        const h = Math.max(240, Math.floor(w * 0.72));
        setSizeCss((prev) => {
          if (Math.abs(prev.w - w) < 2 && Math.abs(prev.h - h) < 2) return prev;
          return { w, h };
        });
      }, 100);
    });

    ro.observe(el);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getSnapshotDataUrl: () => {
      const c = canvasRef.current;
      if (!c) return "";
      return canvasToJpegDataUrl(c);
    },
    getSnapshotForGuess: () => {
      const c = canvasRef.current;
      if (!c) return { dataUrl: "", isBlank: true };
      return encodeSnapshot(c);
    },
    isBlank: () => {
      const c = canvasRef.current;
      if (!c) return true;
      return isCanvasMostlyBlank(c);
    },
    canUndo: () => undoStackRef.current.length > 0,
    undoLastStroke: () => {
      if (drawing.current) return;
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const snap = undoStackRef.current.pop();
      if (!snap) return;

      // putImageData ignores the current transform, so temporarily switch to identity.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(snap, 0, 0);
      ctx.restore();

      last.current = null;
    },
    clear: () => {
      const { w, h } = logicalSizeRef.current;
      undoStackRef.current = [];
      drawing.current = false;
      last.current = null;
      applySize(w, h, false);
    },
  }));

  const strokeStyle = tool === "eraser" ? BG : "#111827";
  const lineWidth = tool === "eraser" ? brushSize * 2 : brushSize;

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    if (drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;

    // Snapshot bitmap at stroke start so we can undo back to this exact state.
    const ctx = c.getContext("2d");
    if (ctx) {
      try {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const snap = ctx.getImageData(0, 0, c.width, c.height);
        ctx.restore();
        undoStackRef.current.push(snap);
        if (undoStackRef.current.length > MAX_UNDO) {
          undoStackRef.current.shift();
        }
      } catch {
        // ignore undo snapshot failures (should be rare)
      }
    }

    drawing.current = true;
    const { w, h } = logicalSizeRef.current;
    last.current = getPos(c, e, w, h);
  };

  const drawLine = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || disabled) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !last.current) return;
    const { w, h } = logicalSizeRef.current;
    const p = getPos(c, e, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className={
          className ??
          "block max-w-full rounded-2xl border border-stage-700/80 bg-[#fafafa] shadow-inner shadow-black/20"
        }
        style={{ cursor: disabled ? "not-allowed" : "crosshair" }}
        onMouseDown={start}
        onMouseMove={drawLine}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => {
          e.preventDefault();
          start(e);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          drawLine(e);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          end();
        }}
      />
    </div>
  );
});

export default SketchCanvas;
