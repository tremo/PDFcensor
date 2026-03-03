import { PDFDocument, rgb, PDFPage, PDFName, PDFArray, PDFStream, PDFRawStream } from "pdf-lib";
import type { RedactionArea } from "@/types/pdf";
import { deflate, inflate } from "pako";

/**
 * Apply true redaction to a PDF:
 * 1. Remove text from content streams
 * 2. Draw black rectangles over redacted areas
 * 3. Clean metadata
 */
export async function redactPDF(
  pdfBytes: ArrayBuffer,
  redactions: RedactionArea[],
  pageHeights: number[],
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  });

  const pages = pdfDoc.getPages();
  const totalSteps = pages.length * 2; // content stream + visual redaction
  let currentStep = 0;

  // Group redactions by page
  const redactionsByPage = new Map<number, RedactionArea[]>();
  for (const r of redactions) {
    if (!r.confirmed) continue;
    const existing = redactionsByPage.get(r.pageIndex) || [];
    existing.push(r);
    redactionsByPage.set(r.pageIndex, existing);
  }

  // Step 1: Remove text from content streams
  for (let i = 0; i < pages.length; i++) {
    const pageRedactions = redactionsByPage.get(i);
    if (pageRedactions && pageRedactions.length > 0) {
      await removeTextFromContentStream(pages[i], pageRedactions);
    }
    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100));
  }

  // Step 2: Draw black rectangles over redacted areas
  for (let i = 0; i < pages.length; i++) {
    const pageRedactions = redactionsByPage.get(i);
    if (pageRedactions && pageRedactions.length > 0) {
      const page = pages[i];
      const pageHeight = page.getHeight();

      for (const redaction of pageRedactions) {
        // Convert from top-left origin (our system) to bottom-left origin (PDF)
        const pdfY = pageHeight - redaction.y - redaction.height;

        page.drawRectangle({
          x: redaction.x,
          y: pdfY,
          width: redaction.width,
          height: redaction.height,
          color: rgb(0, 0, 0),
          borderWidth: 0,
        });
      }
    }
    currentStep++;
    onProgress?.(Math.round((currentStep / totalSteps) * 100));
  }

  // Step 3: Clean metadata
  cleanMetadata(pdfDoc);

  return pdfDoc.save();
}

/**
 * Remove text content from PDF content stream for the given redaction areas.
 * This manipulates the raw PDF content stream operators to replace
 * PII text with empty strings.
 */
async function removeTextFromContentStream(
  page: PDFPage,
  redactions: RedactionArea[]
): Promise<void> {
  const textsToRemove = new Set(
    redactions.map((r) => r.text).filter((t) => t.length > 0)
  );

  if (textsToRemove.size === 0) return;

  try {
    const node = page.node;
    const contentsRef = node.get(PDFName.of("Contents"));

    if (!contentsRef) return;

    const contentsObj = node.context.lookup(contentsRef);

    let streams: PDFStream[] = [];
    if (contentsObj instanceof PDFArray) {
      for (let i = 0; i < contentsObj.size(); i++) {
        const ref = contentsObj.get(i);
        const obj = node.context.lookup(ref!);
        if (obj instanceof PDFRawStream || obj instanceof PDFStream) {
          streams.push(obj as PDFStream);
        }
      }
    } else if (contentsObj instanceof PDFRawStream || contentsObj instanceof PDFStream) {
      streams = [contentsObj as PDFStream];
    }

    for (const stream of streams) {
      let streamBytes: Uint8Array;

      if (stream instanceof PDFRawStream) {
        const encoded = stream.getContents();
        try {
          streamBytes = inflate(encoded);
        } catch {
          streamBytes = encoded;
        }
      } else {
        streamBytes = stream.getContents();
      }

      let content = new TextDecoder("latin1").decode(streamBytes);
      let modified = false;

      // Replace text in Tj operators: (text) Tj
      for (const text of textsToRemove) {
        const escaped = escapeForPDF(text);
        // Match (text) Tj
        const tjRegex = new RegExp(
          `\\(${escapeRegExp(escaped)}\\)\\s*Tj`,
          "g"
        );
        if (tjRegex.test(content)) {
          content = content.replace(tjRegex, "() Tj");
          modified = true;
        }

        // Match within TJ arrays: [(text) ...] TJ
        // We need to replace the text within TJ array entries
        const partialRegex = new RegExp(escapeRegExp(escaped), "g");
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let arrayMatch;

        while ((arrayMatch = tjArrayRegex.exec(content)) !== null) {
          const arrayContent = arrayMatch[1];
          if (partialRegex.test(arrayContent)) {
            const newArrayContent = arrayContent.replace(
              new RegExp(`\\(([^)]*${escapeRegExp(escaped)}[^)]*)\\)`, "g"),
              "()"
            );
            if (newArrayContent !== arrayContent) {
              content =
                content.slice(0, arrayMatch.index) +
                "[" + newArrayContent + "] TJ" +
                content.slice(arrayMatch.index + arrayMatch[0].length);
              modified = true;
            }
          }
        }
      }

      if (modified) {
        const newBytes = new TextEncoder().encode(content);
        const compressed = deflate(newBytes);
        const newStream = node.context.stream(compressed, {
          Length: compressed.length,
          Filter: "FlateDecode",
        });

        // Replace in context
        if (contentsObj instanceof PDFArray) {
          // Replace the stream in place
          for (let i = 0; i < contentsObj.size(); i++) {
            const ref = contentsObj.get(i);
            const obj = node.context.lookup(ref!);
            if (obj === stream) {
              node.context.assign(
                ref as unknown as import("pdf-lib").PDFRef,
                newStream
              );
              break;
            }
          }
        } else {
          node.set(PDFName.of("Contents"), node.context.register(newStream));
        }
      }
    }
  } catch (e) {
    // If content stream manipulation fails, visual redaction still works
    console.warn("Content stream manipulation failed for a page:", e);
  }
}

/**
 * Clean PDF metadata.
 */
function cleanMetadata(pdfDoc: PDFDocument): void {
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("PDFcensor");
  pdfDoc.setCreator("PDFcensor");
}

function escapeForPDF(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
