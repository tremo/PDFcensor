import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PDFDocumentData } from "@/types/pdf";
import type { PIIType } from "@/types/pii";
import type { RedactionArea } from "@/types/pdf";
import { detectPII } from "@/lib/pii/detector";
import { renderPageToCanvas } from "./parser";

/** OCR word with bounding box in PDF coordinate space */
interface OCRWord {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Scale used for rendering pages for OCR (higher = better accuracy but slower) */
const OCR_SCALE = 2.0;

/**
 * Map locale to Tesseract language codes.
 * Tesseract uses ISO 639-3 codes for language data.
 */
function getOCRLanguages(locale: string): string {
  const langMap: Record<string, string> = {
    en: "eng",
    tr: "tur",
    de: "deu",
    fr: "fra",
    es: "spa",
    pt: "por",
    ja: "jpn",
    ko: "kor",
    zh: "chi_sim",
  };
  // Always include English as fallback since PII patterns (emails, numbers) are latin-based
  const primary = langMap[locale] || "eng";
  return primary === "eng" ? "eng" : `${primary}+eng`;
}

/**
 * Run OCR on a single PDF page rendered to canvas.
 * Returns word-level bounding boxes in PDF coordinate space (scale=1.0, top-left origin).
 */
async function ocrPage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  lang: string,
  scheduler: Tesseract.Scheduler
): Promise<{ words: OCRWord[]; fullText: string }> {
  // Create an offscreen canvas for OCR rendering
  const canvas = globalThis.document.createElement("canvas");

  await renderPageToCanvas(pdf, pageNumber, canvas, OCR_SCALE);

  // Run OCR on the rendered canvas
  const { data } = await scheduler.addJob("recognize", canvas);

  const words: OCRWord[] = [];
  let fullText = "";

  // Traverse blocks -> paragraphs -> lines -> words to extract all word-level data
  if (data.blocks) {
    for (const block of data.blocks) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            const bbox = word.bbox;
            // Convert from pixel coordinates (at OCR_SCALE) back to PDF coordinates (scale=1.0)
            words.push({
              text: word.text,
              x: bbox.x0 / OCR_SCALE,
              y: bbox.y0 / OCR_SCALE,
              width: (bbox.x1 - bbox.x0) / OCR_SCALE,
              height: (bbox.y1 - bbox.y0) / OCR_SCALE,
            });

            fullText += word.text + " ";
          }
        }
      }
    }
  }

  // Clean up offscreen canvas
  canvas.width = 0;
  canvas.height = 0;

  return { words, fullText: fullText.trim() };
}

/**
 * Check if an OCR-detected area overlaps significantly with existing text-based detections.
 * Used to avoid duplicating redactions for text that was already found by the text extractor.
 */
function overlapsWithExisting(
  ocrArea: { x: number; y: number; width: number; height: number },
  existingRedactions: RedactionArea[],
  threshold: number = 0.5
): boolean {
  for (const existing of existingRedactions) {
    const overlapX = Math.max(
      0,
      Math.min(ocrArea.x + ocrArea.width, existing.x + existing.width) -
        Math.max(ocrArea.x, existing.x)
    );
    const overlapY = Math.max(
      0,
      Math.min(ocrArea.y + ocrArea.height, existing.y + existing.height) -
        Math.max(ocrArea.y, existing.y)
    );
    const overlapArea = overlapX * overlapY;
    const ocrAreaSize = ocrArea.width * ocrArea.height;

    if (ocrAreaSize > 0 && overlapArea / ocrAreaSize > threshold) {
      return true;
    }
  }
  return false;
}

let idCounter = 0;
function nextOCRId() {
  return `ocr-redaction-${++idCounter}`;
}

/**
 * Run OCR-based PII detection on all pages of a PDF document.
 * This detects text embedded in images that the normal text extractor cannot see.
 *
 * @param doc - The parsed PDF document
 * @param piiTypes - PII types to detect
 * @param existingRedactions - Already detected text-based redactions (to avoid duplicates)
 * @param locale - UI locale for OCR language selection
 * @param onProgress - Progress callback (0-100)
 * @returns Array of new redaction areas found via OCR
 */
export async function detectOCRPII(
  doc: PDFDocumentData,
  piiTypes: PIIType[],
  existingRedactions: RedactionArea[],
  locale: string,
  onProgress?: (progress: number) => void
): Promise<RedactionArea[]> {
  const lang = getOCRLanguages(locale);
  const ocrRedactions: RedactionArea[] = [];

  // Parse PDF once for all pages instead of re-parsing per page
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(doc.arrayBuffer),
  }).promise;

  // Create a Tesseract scheduler with 1 worker for sequential processing
  const scheduler = Tesseract.createScheduler();
  const worker = await Tesseract.createWorker(lang, undefined, {
    // Use default CDN for language data
  });
  scheduler.addWorker(worker);

  try {
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      const pageIndex = page.pageIndex;

      // Run OCR on this page using pre-loaded PDF document
      const { words, fullText } = await ocrPage(
        pdf,
        i + 1,
        lang,
        scheduler
      );

      if (fullText.length === 0) {
        onProgress?.(Math.round(((i + 1) / doc.pages.length) * 100));
        continue;
      }

      // Run PII detection on OCR text
      const result = detectPII(fullText, pageIndex, piiTypes);

      // Map PII matches back to OCR word bounding boxes
      for (const match of result.matches) {
        // Find which OCR words overlap with this match
        // Build a character offset map for the fullText
        let charPos = 0;
        const matchingWords: OCRWord[] = [];

        for (const word of words) {
          const wordStart = charPos;
          const wordEnd = charPos + word.text.length;

          // Check if this word overlaps with the match range
          if (
            (match.startIndex >= wordStart && match.startIndex < wordEnd) ||
            (match.endIndex > wordStart && match.endIndex <= wordEnd) ||
            (match.startIndex <= wordStart && match.endIndex >= wordEnd)
          ) {
            matchingWords.push(word);
          }

          charPos = wordEnd + 1; // +1 for the space separator
        }

        if (matchingWords.length === 0) continue;

        // Calculate bounding box covering all matching words
        const minX = Math.min(...matchingWords.map((w) => w.x));
        const minY = Math.min(...matchingWords.map((w) => w.y));
        const maxX = Math.max(...matchingWords.map((w) => w.x + w.width));
        const maxY = Math.max(...matchingWords.map((w) => w.y + w.height));

        const area = {
          x: minX - 2,
          y: minY - 2,
          width: maxX - minX + 4,
          height: maxY - minY + 4,
        };

        // Check if this overlaps with existing text-based redactions
        const pageExisting = existingRedactions.filter(
          (r) => r.pageIndex === pageIndex
        );
        if (overlapsWithExisting(area, pageExisting)) {
          continue;
        }

        ocrRedactions.push({
          id: nextOCRId(),
          pageIndex,
          ...area,
          text: match.value,
          piiType: match.type,
          confirmed: false,
        });
      }

      onProgress?.(Math.round(((i + 1) / doc.pages.length) * 100));
    }
  } finally {
    await scheduler.terminate();
    pdf.destroy();
  }

  return ocrRedactions;
}
