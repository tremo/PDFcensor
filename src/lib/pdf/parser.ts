import type { PDFDocumentData, PDFPageData, PDFTextItem } from "@/types/pdf";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

/**
 * Parse a PDF file and extract text items with positions from each page.
 */
export async function parsePDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PDFDocumentData> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: PDFPageData[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const textItems: PDFTextItem[] = [];
    let fullText = "";

    for (const item of textContent.items) {
      if ("str" in item && item.str) {
        const tx = item.transform;
        const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);

        textItems.push({
          text: item.str,
          x: tx[4],
          y: viewport.height - tx[5] - fontSize, // Convert to top-left origin (baseline → top of text)
          width: item.width,
          height: fontSize,
          pageIndex: i - 1,
          fontName: item.fontName,
          transform: tx,
        });

        fullText += item.str + (item.hasEOL ? "\n" : " ");
      }
    }

    pages.push({
      pageIndex: i - 1,
      width: viewport.width,
      height: viewport.height,
      textItems,
      fullText: fullText.trim(),
    });

    onProgress?.(Math.round((i / totalPages) * 100));
  }

  return {
    fileName: file.name,
    totalPages,
    pages,
    fileSize: file.size,
    arrayBuffer,
  };
}

/**
 * Render a PDF page to a canvas at the given scale.
 */
export async function renderPageToCanvas(
  arrayBuffer: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  signal?: AbortSignal
): Promise<{ width: number; height: number }> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
  }).promise;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d")!;
  const renderTask = page.render({ canvasContext: context, viewport });

  if (signal) {
    const onAbort = () => renderTask.cancel();
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      await renderTask.promise;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  } else {
    await renderTask.promise;
  }

  return { width: viewport.width, height: viewport.height };
}
