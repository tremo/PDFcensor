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

  // Step 1: Remove text from content streams (skip face-only redactions)
  for (let i = 0; i < pages.length; i++) {
    const pageRedactions = redactionsByPage.get(i);
    if (pageRedactions && pageRedactions.length > 0) {
      const textRedactions = pageRedactions.filter((r) => r.piiType !== "face");
      if (textRedactions.length > 0) {
        const success = await removeTextFromContentStream(pages[i], textRedactions);
        if (!success) {
          // Targeted removal failed — strip ALL text from this page so no PII leaks
          stripAllTextFromPage(pages[i]);
        }
      }
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
): Promise<boolean> {
  const textsToRemove = new Set(
    redactions.map((r) => r.text).filter((t) => t.length > 0)
  );

  if (textsToRemove.size === 0) return true;

  try {
    const node = page.node;
    const contentsRef = node.get(PDFName.of("Contents"));

    if (!contentsRef) return true;

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
        const replaced = content.replace(tjRegex, "() Tj");
        if (replaced !== content) {
          content = replaced;
          modified = true;
        }

        // Match within TJ arrays: [(text) ...] TJ
        // Collect all matches first, then replace in reverse order
        // to avoid corrupting regex lastIndex during iteration
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        const replacements: { index: number; length: number; replacement: string }[] = [];
        let arrayMatch;

        while ((arrayMatch = tjArrayRegex.exec(content)) !== null) {
          const arrayContent = arrayMatch[1];
          // Use regex without g flag for existence check
          if (new RegExp(escapeRegExp(escaped)).test(arrayContent)) {
            const newArrayContent = arrayContent.replace(
              new RegExp(`\\(([^)]*${escapeRegExp(escaped)}[^)]*)\\)`, "g"),
              "()"
            );
            if (newArrayContent !== arrayContent) {
              replacements.push({
                index: arrayMatch.index,
                length: arrayMatch[0].length,
                replacement: "[" + newArrayContent + "] TJ",
              });
            }
          }
        }

        // Apply replacements in reverse order to preserve indices
        for (let j = replacements.length - 1; j >= 0; j--) {
          const r = replacements[j];
          content =
            content.slice(0, r.index) +
            r.replacement +
            content.slice(r.index + r.length);
          modified = true;
        }
      }

      if (modified) {
        // Re-encode as Latin-1 to match the original decode (line 125)
        const newBytes = new Uint8Array(content.length);
        for (let j = 0; j < content.length; j++) {
          newBytes[j] = content.charCodeAt(j) & 0xFF;
        }
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
    return true;
  } catch (e) {
    console.warn("Content stream text removal failed for a page:", e);
    return false;
  }
}

/**
 * Fallback: strip ALL text-rendering operators from every content stream on the page.
 * This is a nuclear option — the page will have no selectable/copyable text at all,
 * but the visual redaction rectangles still render, so the page remains viewable.
 *
 * Text operators removed: Tj, TJ, ', "
 * We also remove BT...ET blocks entirely to prevent stale text state.
 */
function stripAllTextFromPage(page: PDFPage): void {
  const node = page.node;
  const contentsRef = node.get(PDFName.of("Contents"));
  if (!contentsRef) return;

  const contentsObj = node.context.lookup(contentsRef);

  const streams: { stream: PDFStream; ref?: unknown }[] = [];
  if (contentsObj instanceof PDFArray) {
    for (let i = 0; i < contentsObj.size(); i++) {
      const ref = contentsObj.get(i);
      const obj = node.context.lookup(ref!);
      if (obj instanceof PDFRawStream || obj instanceof PDFStream) {
        streams.push({ stream: obj as PDFStream, ref });
      }
    }
  } else if (contentsObj instanceof PDFRawStream || contentsObj instanceof PDFStream) {
    streams.push({ stream: contentsObj as PDFStream });
  }

  for (const { stream, ref } of streams) {
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

    const content = new TextDecoder("latin1").decode(streamBytes);

    // Remove all BT...ET text blocks (the entire text object)
    // Use newline/space boundaries instead of \b which is unreliable in Latin-1 streams
    const stripped = content.replace(/(?:^|[\n\r\s])BT\s[\s\S]*?\sET(?=[\n\r\s]|$)/g, "");

    // Re-encode as Latin-1
    const newBytes = new Uint8Array(stripped.length);
    for (let j = 0; j < stripped.length; j++) {
      newBytes[j] = stripped.charCodeAt(j) & 0xFF;
    }
    const compressed = deflate(newBytes);
    const newStream = node.context.stream(compressed, {
      Length: compressed.length,
      Filter: "FlateDecode",
    });

    if (ref) {
      node.context.assign(
        ref as unknown as import("pdf-lib").PDFRef,
        newStream
      );
    } else {
      node.set(PDFName.of("Contents"), node.context.register(newStream));
    }
  }
}

/**
 * Clean PDF metadata: Info dictionary fields, dates, and XMP stream.
 */
function cleanMetadata(pdfDoc: PDFDocument): void {
  // Clear Info dictionary fields
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("OfflineRedact");
  pdfDoc.setCreator("OfflineRedact");

  // Clear creation and modification dates
  const epoch = new Date(0);
  pdfDoc.setCreationDate(epoch);
  pdfDoc.setModificationDate(epoch);

  // Remove XMP metadata stream from the document catalog
  // XMP can contain author, dates and other metadata independently of the Info dict
  try {
    const catalog = pdfDoc.catalog;
    if (catalog.has(PDFName.of("Metadata"))) {
      catalog.delete(PDFName.of("Metadata"));
    }
  } catch {
    // If XMP removal fails, the Info dictionary is still cleaned
  }
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
