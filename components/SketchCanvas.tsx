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
  isCanvasMostlyBlank,
} from "@/lib/client/canvas-utils";

export type SketchCanvasHandle = {
  getSnapshotDataUrl: () => string;
  isBlank: () => boolean;
  clear: () => void;
};

type Tool = "pen" | "eraser";

const BG = "#fafafa";

function getPos(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent | React.TouchEvent,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
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
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [sizeCss, setSizeCss] = useState({ w: 520, h: 390 });

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const { w, h } = sizeCss;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
  }, [sizeCss]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width));
      const h = Math.max(240, Math.floor(w * 0.72));
      setSizeCss({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    getSnapshotDataUrl: () => {
      const c = canvasRef.current;
      if (!c) return "";
      return canvasToJpegDataUrl(c);
    },
    isBlank: () => {
      const c = canvasRef.current;
      if (!c) return true;
      return isCanvasMostlyBlank(c);
    },
    clear: () => {
      initCanvas();
    },
  }));

  const strokeStyle = tool === "eraser" ? BG : "#111827";

  const lineWidth = tool === "eraser" ? brushSize * 2 : brushSize;

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const c = canvasRef.current;
    if (!c) return;
    drawing.current = true;
    last.current = getPos(c, e);
  };

  const drawLine = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || disabled) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !last.current) return;
    const p = getPos(c, e);
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
    <canvas
      ref={canvasRef}
      className={
        className ??
        "touch-none w-full max-w-full rounded-2xl border border-stage-700/80 bg-[#fafafa] shadow-inner shadow-black/20"
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
  );
});

export default SketchCanvas;
