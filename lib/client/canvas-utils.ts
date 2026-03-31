"use client";

import {
  SNAPSHOT_JPEG_QUALITY,
  SNAPSHOT_MAX_EDGE,
} from "@/lib/constants";

export function canvasToJpegDataUrl(
  source: HTMLCanvasElement,
  maxEdge: number = SNAPSHOT_MAX_EDGE,
  quality: number = SNAPSHOT_JPEG_QUALITY,
): string {
  const w = source.width;
  const h = source.height;
  if (w < 1 || h < 1) return "";
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(source, 0, 0, tw, th);
  return c.toDataURL("image/jpeg", quality);
}

/** Heuristic: nearly no ink vs white background */
export function isCanvasMostlyBlank(
  canvas: HTMLCanvasElement,
  threshold = 245,
): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const { width, height } = canvas;
  if (width < 4 || height < 4) return true;
  const stepX = Math.max(1, Math.floor(width / 28));
  const stepY = Math.max(1, Math.floor(height / 28));
  let dark = 0;
  let samples = 0;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      const v = (d[0] + d[1] + d[2]) / 3;
      samples++;
      if (v < threshold) dark++;
    }
  }
  return samples === 0 || dark / samples < 0.003;
}
