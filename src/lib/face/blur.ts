/**
 * Apply a pixelation blur effect to a rectangular region on a canvas.
 * Works by downscaling and upscaling the region, producing a mosaic effect.
 */
export function blurRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelSize: number = 10
): void {
  // Clamp to canvas bounds
  const cx = Math.max(0, Math.floor(x));
  const cy = Math.max(0, Math.floor(y));
  const cw = Math.min(Math.ceil(width), ctx.canvas.width - cx);
  const ch = Math.min(Math.ceil(height), ctx.canvas.height - cy);

  if (cw <= 0 || ch <= 0) return;

  // Downscale dimensions
  const sw = Math.max(1, Math.ceil(cw / pixelSize));
  const sh = Math.max(1, Math.ceil(ch / pixelSize));

  // Use imageSmoothingEnabled to get averaged colors on downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";

  // Draw region to small size (in-place using drawImage with same canvas)
  // We need a temp canvas for this
  const tmp = globalThis.document.createElement("canvas");
  tmp.width = sw;
  tmp.height = sh;
  const tmpCtx = tmp.getContext("2d")!;
  tmpCtx.imageSmoothingEnabled = true;
  tmpCtx.imageSmoothingQuality = "low";

  // Draw the region downscaled
  tmpCtx.drawImage(ctx.canvas, cx, cy, cw, ch, 0, 0, sw, sh);

  // Draw it back upscaled (pixelated)
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, sw, sh, cx, cy, cw, ch);

  // Restore smoothing
  ctx.imageSmoothingEnabled = true;

  // Cleanup
  tmp.width = 0;
  tmp.height = 0;
}
