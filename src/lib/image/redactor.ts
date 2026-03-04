import type { RedactionArea } from "@/types/pdf";

/**
 * Apply redactions to an image by drawing black rectangles over confirmed areas.
 * Returns a PNG Blob.
 */
export async function redactImage(
  file: File,
  redactions: RedactionArea[]
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // Draw black rectangles over confirmed redactions
  ctx.fillStyle = "#000000";
  for (const r of redactions) {
    if (r.confirmed) {
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export redacted image"));
    }, "image/png");
  });
}
