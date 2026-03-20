import type { PDFDocumentData, PDFPageData, PDFTextItem } from "@/types/pdf";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Set up the worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

/**
 * Extract text items from a single PDF page.
 */
async function extractPageData(
  pdf: PDFDocumentProxy,
  pageNumber: number
): Promise<PDFPageData> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.0 });
  const textContent = await page.getTextContent();

  const textItems: PDFTextItem[] = [];
  let fullText = "";

  for (const item of textContent.items) {
    if ("str" in item && item.str) {
      const tx = item.transform;
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      const charOffset = fullText.length;

      textItems.push({
        text: item.str,
        x: tx[4],
        y: viewport.height - tx[5] - fontSize, // Convert to top-left origin (baseline → top of text)
        width: item.width,
        height: fontSize,
        pageIndex: pageNumber - 1,
        fontName: item.fontName,
        transform: tx,
        charOffset,
      });

      fullText += item.str + (item.hasEOL ? "\n" : " ");
    }
  }

  return {
    pageIndex: pageNumber - 1,
    width: viewport.width,
    height: viewport.height,
    textItems,
    fullText: fullText.trim(),
  };
}

/**
 * Parse a PDF file and extract text items with positions from each page.
 * Stores the File reference for lazy ArrayBuffer loading instead of keeping
 * the full ArrayBuffer in memory permanently.
 */
export async function parsePDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PDFDocumentData> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: PDFPageData[] = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(await extractPageData(pdf, i));
    onProgress?.(Math.round((i / totalPages) * 100));
  }

  // Destroy the PDFDocumentProxy to free wasm/worker memory
  await pdf.destroy();

  return {
    fileName: file.name,
    totalPages,
    pages,
    fileSize: file.size,
    file,
    arrayBuffer: null, // Don't keep in memory — load on demand via getDocumentArrayBuffer()
  };
}

/**
 * Get ArrayBuffer from a PDFDocumentData, loading from File if not cached.
 */
export async function getDocumentArrayBuffer(
  doc: PDFDocumentData
): Promise<ArrayBuffer> {
  if (doc.arrayBuffer && doc.arrayBuffer.byteLength > 0) {
    return doc.arrayBuffer;
  }
  const buffer = await doc.file.arrayBuffer();
  doc.arrayBuffer = buffer;
  return buffer;
}

/**
 * Release heavy text data from pages to free memory after scanning.
 * Keeps page dimensions (needed for redaction) but drops textItems and fullText.
 */
export function releasePageTextData(doc: PDFDocumentData): void {
  for (const page of doc.pages) {
    page.textItems = [];
    page.fullText = "";
  }
}

/**
 * Re-parse pages to restore textItems and fullText (needed for re-scanning).
 */
export async function reparsePages(
  doc: PDFDocumentData,
  onProgress?: (progress: number) => void
): Promise<void> {
  const arrayBuffer = await getDocumentArrayBuffer(doc);
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  }).promise;

  for (let i = 0; i < doc.totalPages; i++) {
    const pageData = await extractPageData(pdf, i + 1);
    doc.pages[i].textItems = pageData.textItems;
    doc.pages[i].fullText = pageData.fullText;
    onProgress?.(Math.round(((i + 1) / doc.totalPages) * 100));
  }

  await pdf.destroy();
}

/**
 * Open a cached PDFDocumentProxy from a File for rendering.
 * Caller is responsible for calling destroy() when done.
 */
export async function openPDFProxy(
  file: File
): Promise<PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  }).promise;
}

/**
 * Render a PDF page to a canvas at the given scale.
 */
export async function renderPageToCanvas(
  source: ArrayBuffer | PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  signal?: AbortSignal
): Promise<{ width: number; height: number }> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const pdf = source instanceof ArrayBuffer
    ? await pdfjsLib.getDocument({ data: new Uint8Array(source) }).promise
    : source;

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
