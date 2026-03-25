import Tesseract from "tesseract.js";
import type { PIIType } from "@/types/pii";
import type { RedactionArea } from "@/types/pdf";
import { detectPII } from "@/lib/pii/detector";

interface OCRWord {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lineIndex: number;
}

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
  const primary = langMap[locale] || "eng";
  return primary === "eng" ? "eng" : `${primary}+eng`;
}

let idCounter = 0;
function nextId() {
  return `img-redaction-${++idCounter}`;
}

/**
 * Run OCR on a directly uploaded image file and detect PII.
 * Returns redaction areas in image pixel coordinates.
 */
export async function detectOCRPIIFromImage(
  file: File,
  piiTypes: PIIType[],
  locale: string,
  onProgress?: (progress: number) => void
): Promise<{ redactions: RedactionArea[]; width: number; height: number }> {
  const lang = getOCRLanguages(locale);

  // Load the image onto a canvas to get pixel dimensions
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const canvas = globalThis.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  onProgress?.(10);

  console.log("[OCR DEBUG] Canvas size:", canvas.width, "x", canvas.height);
  console.log("[OCR DEBUG] OCR language:", lang);

  const scheduler = Tesseract.createScheduler();
  const worker = await Tesseract.createWorker(lang);
  scheduler.addWorker(worker);

  onProgress?.(30);

  const { data } = await scheduler.addJob("recognize", canvas);

  onProgress?.(80);

  console.log("[OCR DEBUG] Tesseract data.text:", JSON.stringify(data.text?.substring(0, 200)));
  console.log("[OCR DEBUG] Tesseract data.blocks count:", data.blocks?.length ?? "null/undefined");
  console.log("[OCR DEBUG] Tesseract confidence:", data.confidence);

  // Extract word-level bounding boxes
  const words: OCRWord[] = [];
  let lineCounter = 0;

  if (data.blocks) {
    for (const block of data.blocks) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            const bbox = word.bbox;
            words.push({
              text: word.text,
              x: bbox.x0,
              y: bbox.y0,
              width: bbox.x1 - bbox.x0,
              height: bbox.y1 - bbox.y0,
              lineIndex: lineCounter,
            });
          }
          lineCounter++;
        }
      }
    }
  }

  await scheduler.terminate();

  // DEBUG: Log raw OCR words to help diagnose detection issues
  console.log("[OCR DEBUG] Raw words from Tesseract:", words.map(w => ({ text: w.text, line: w.lineIndex })));

  // Merge adjacent OCR words on the same line when they form numeric sequences
  // Tesseract splits numbers like "13643908756" into "1364" + "390" + "8756"
  const stripOCRNoise = (text: string) => text.replace(/^[.,;:|]+|[.,;:|]+$/g, "");
  const mergedWords: OCRWord[] = [];
  for (const word of words) {
    const last = mergedWords[mergedWords.length - 1];
    const lastClean = last ? stripOCRNoise(last.text) : "";
    const wordClean = stripOCRNoise(word.text);
    const bothDigits =
      lastClean.length > 0 && /^\d+$/.test(lastClean) &&
      wordClean.length > 0 && /^\d+$/.test(wordClean);
    const letterThenDigits =
      /^[A-Z]$/i.test(lastClean) &&
      wordClean.length > 0 && /^\d+$/.test(wordClean);
    if (last && last.lineIndex === word.lineIndex && (bothDigits || letterThenDigits)) {
      const minX = Math.min(last.x, word.x);
      const minY = Math.min(last.y, word.y);
      const maxX = Math.max(last.x + last.width, word.x + word.width);
      const maxY = Math.max(last.y + last.height, word.y + word.height);
      last.text = lastClean + wordClean;
      last.x = minX;
      last.y = minY;
      last.width = maxX - minX;
      last.height = maxY - minY;
    } else {
      mergedWords.push({ ...word });
    }
  }

  // Build fullText from merged words
  let fullText = "";
  for (const w of mergedWords) {
    fullText += w.text + " ";
  }

  // DEBUG: Log merged result and full text
  console.log("[OCR DEBUG] Merged words:", mergedWords.map(w => w.text));
  console.log("[OCR DEBUG] Full text for PII detection:", fullText.trim());

  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;

  const redactions: RedactionArea[] = [];

  if (fullText.trim().length === 0) {
    onProgress?.(100);
    return { redactions, width, height };
  }

  // Detect PII in OCR text (pageIndex 0 for single images)
  console.log("[OCR DEBUG] PII types enabled:", piiTypes);
  const result = detectPII(fullText.trim(), 0, piiTypes);
  console.log("[OCR DEBUG] PII matches found:", result.matches.map(m => ({ type: m.type, value: m.value })));

  for (const match of result.matches) {
    let charPos = 0;
    const matchingWords: OCRWord[] = [];

    for (const word of mergedWords) {
      const wordStart = charPos;
      const wordEnd = charPos + word.text.length;

      if (
        (match.startIndex >= wordStart && match.startIndex < wordEnd) ||
        (match.endIndex > wordStart && match.endIndex <= wordEnd) ||
        (match.startIndex <= wordStart && match.endIndex >= wordEnd)
      ) {
        matchingWords.push(word);
      }

      charPos = wordEnd + 1; // +1 for space separator
    }

    if (matchingWords.length === 0) continue;

    const minX = Math.min(...matchingWords.map((w) => w.x));
    const minY = Math.min(...matchingWords.map((w) => w.y));
    const maxX = Math.max(...matchingWords.map((w) => w.x + w.width));
    const maxY = Math.max(...matchingWords.map((w) => w.y + w.height));

    redactions.push({
      id: nextId(),
      pageIndex: 0,
      x: minX - 2,
      y: minY - 2,
      width: maxX - minX + 4,
      height: maxY - minY + 4,
      text: match.value,
      piiType: match.type,
      confirmed: false,
    });
  }

  onProgress?.(100);
  return { redactions, width, height };
}
