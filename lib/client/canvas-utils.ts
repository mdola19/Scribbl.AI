"use client";

import {
  SNAPSHOT_JPEG_QUALITY,
  SNAPSHOT_MAX_EDGE,
} from "@/lib/constants";

let scratch: HTMLCanvasElement | null = null;

function getScratch(): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("canvas-utils must run in the browser");
  }
  if (!scratch) {
    scratch = document.createElement("canvas");
  }
  return scratch;
}

const BLANK_THRESHOLD = 245;
const BLANK_DARK_RATIO = 0.003;

function darkRatioFromRgba(data: Uint8ClampedArray): number {
  let dark = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (v < BLANK_THRESHOLD) dark++;
  }
  return n === 0 ? 0 : dark / n;
}

/**
 * Downscale once, one getImageData — fast vs thousands of 1×1 reads on a Retina canvas.
 */
export function isCanvasMostlyBlank(
  source: HTMLCanvasElement,
  maxEdge = 96,
  threshold = BLANK_THRESHOLD,
): boolean {
  const w = source.width;
  const h = source.height;
  if (w < 4 || h < 4) return true;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(8, Math.round(w * scale));
  const th = Math.max(8, Math.round(h * scale));
  const c = getScratch();
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d", { alpha: false });
  if (!ctx) return true;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(source, 0, 0, tw, th);
  const { data } = ctx.getImageData(0, 0, tw, th);
  let dark = 0;
  const px = tw * th;
  for (let i = 0; i < data.length; i += 4) {
    const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (v < threshold) dark++;
  }
  return px === 0 || dark / px < BLANK_DARK_RATIO;
}

/**
 * Single resize + pixel read + JPEG encode for live guessing (avoids double work).
 */
export function encodeSnapshot(
  source: HTMLCanvasElement,
  maxEdge: number = SNAPSHOT_MAX_EDGE,
  quality: number = SNAPSHOT_JPEG_QUALITY,
): { dataUrl: string; isBlank: boolean } {
  const w = source.width;
  const h = source.height;
  if (w < 1 || h < 1) return { dataUrl: "", isBlank: true };
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const c = getScratch();
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d", { alpha: false });
  if (!ctx) return { dataUrl: "", isBlank: true };
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(source, 0, 0, tw, th);
  const { data } = ctx.getImageData(0, 0, tw, th);
  const isBlank = darkRatioFromRgba(data) < BLANK_DARK_RATIO;
  const dataUrl = c.toDataURL("image/jpeg", quality);
  return { dataUrl, isBlank };
}

export function canvasToJpegDataUrl(
  source: HTMLCanvasElement,
  maxEdge: number = SNAPSHOT_MAX_EDGE,
  quality: number = SNAPSHOT_JPEG_QUALITY,
): string {
  return encodeSnapshot(source, maxEdge, quality).dataUrl;
}
