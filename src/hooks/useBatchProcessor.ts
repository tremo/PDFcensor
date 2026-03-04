"use client";

import { useState, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import type { PDFDocumentData, RedactionArea } from "@/types/pdf";
import type { RegulationType, PIIType } from "@/types/pii";
import { parsePDF } from "@/lib/pdf/parser";
import { detectPII } from "@/lib/pii/detector";
import { detectOCRPII } from "@/lib/pdf/ocr";
import { loadNameDictionaries } from "@/lib/pii/patterns/names";
import { redactPDF } from "@/lib/pdf/redactor";
import { addWatermark } from "@/lib/pdf/watermark";
import { parseDocx } from "@/lib/docx/parser";
import type { DocxDocumentData } from "@/lib/docx/parser";
import { redactDocx } from "@/lib/docx/redactor";
import type { PIIMatch } from "@/types/pii";
import {
  getDefaultRegulation,
  getRegulationPatterns,
  getRegulationLocales,
} from "@/lib/pii/regulations";
import type { Locale } from "@/lib/i18n/config";
import JSZip from "jszip";

let batchIdCounter = 0;
function nextBatchId() {
  return `batch-redaction-${++batchIdCounter}`;
}

export interface BatchFileResult {
  file: File;
  type: "pdf" | "docx";
  pdfDocument?: PDFDocumentData;
  docxDocument?: DocxDocumentData;
  pdfRedactions: RedactionArea[];
  docxRedactions: { id: string; match: PIIMatch; confirmed: boolean }[];
  redactedBytes: Uint8Array | null;
  error?: string;
}

export type BatchStatus =
  | "idle"
  | "processing"
  | "summary"
  | "reviewing"
  | "redacting-all"
  | "done"
  | "error";

export interface BatchSummaryData {
  totalFiles: number;
  totalFindings: number;
  findingsByType: Record<string, number>;
  fileResults: BatchFileResult[];
}

function isDocxFile(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  );
}

export function useBatchProcessor() {
  const locale = useLocale() as Locale;

  const [status, setStatus] = useState<BatchStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [fileResults, setFileResults] = useState<BatchFileResult[]>([]);
  const [regulation, setRegulation] = useState<RegulationType>(
    getDefaultRegulation(locale)
  );
  const [enabledTypes, setEnabledTypes] = useState<PIIType[]>(
    getRegulationPatterns(getDefaultRegulation(locale))
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewingIndex, setReviewingIndex] = useState<number | null>(null);

  const abortRef = useRef(false);

  const processFiles = useCallback(
    async (filesToProcess: File[], types: PIIType[], reg: RegulationType) => {
      setStatus("processing");
      setTotalFiles(filesToProcess.length);
      setProgress(0);
      abortRef.current = false;

      const locales = getRegulationLocales(reg, locale);
      await loadNameDictionaries(locales);

      const results: BatchFileResult[] = [];

      for (let fi = 0; fi < filesToProcess.length; fi++) {
        if (abortRef.current) break;
        setCurrentFileIndex(fi);

        const file = filesToProcess[fi];
        const isDocx = isDocxFile(file);

        const result: BatchFileResult = {
          file,
          type: isDocx ? "docx" : "pdf",
          pdfRedactions: [],
          docxRedactions: [],
          redactedBytes: null,
        };

        try {
          if (isDocx) {
            // Parse DOCX
            const doc = await parseDocx(file, () => {});
            result.docxDocument = doc;

            // Detect PII
            const piiResult = detectPII(doc.fullText, 0, types);
            result.docxRedactions = piiResult.matches.map((m) => ({
              id: nextBatchId(),
              match: m,
              confirmed: false,
            }));
          } else {
            // Parse PDF
            const doc = await parsePDF(file, () => {});
            result.pdfDocument = doc;

            // Detect PII per page
            const allRedactions: RedactionArea[] = [];
            for (let i = 0; i < doc.pages.length; i++) {
              const page = doc.pages[i];
              const piiResult = detectPII(page.fullText, page.pageIndex, types);

              for (const match of piiResult.matches) {
                const matchingItems = page.textItems.filter((item) => {
                  const itemStart = item.charOffset;
                  const itemEnd = itemStart + item.text.length;
                  return (
                    (match.startIndex >= itemStart &&
                      match.startIndex < itemEnd) ||
                    (match.endIndex > itemStart &&
                      match.endIndex <= itemEnd) ||
                    (match.startIndex <= itemStart &&
                      match.endIndex >= itemEnd)
                  );
                });

                if (matchingItems.length > 0) {
                  const clippedBoxes = matchingItems.map((item) => {
                    const itemStart = item.charOffset;
                    const itemEnd = itemStart + item.text.length;
                    const charCount = item.text.length;
                    const overlapStart =
                      Math.max(match.startIndex, itemStart) - itemStart;
                    const overlapEnd =
                      Math.min(match.endIndex, itemEnd) - itemStart;
                    const charWidth =
                      charCount > 0 ? item.width / charCount : item.width;
                    const clipX = item.x + overlapStart * charWidth;
                    const clipWidth = (overlapEnd - overlapStart) * charWidth;
                    return {
                      x: clipX,
                      y: item.y,
                      width: clipWidth,
                      height: item.height,
                    };
                  });

                  const minX = Math.min(...clippedBoxes.map((b) => b.x));
                  const minY = Math.min(...clippedBoxes.map((b) => b.y));
                  const maxX = Math.max(
                    ...clippedBoxes.map((b) => b.x + b.width)
                  );
                  const maxY = Math.max(
                    ...clippedBoxes.map((b) => b.y + b.height)
                  );

                  allRedactions.push({
                    id: nextBatchId(),
                    pageIndex: page.pageIndex,
                    x: minX - 2,
                    y: minY - 2,
                    width: maxX - minX + 4,
                    height: maxY - minY + 4,
                    text: match.value,
                    piiType: match.type,
                    confirmed: false,
                  });
                }
              }
            }

            result.pdfRedactions = allRedactions;

            // OCR scanning
            try {
              const ocrRedactions = await detectOCRPII(
                doc,
                types,
                allRedactions,
                locale,
                () => {}
              );
              result.pdfRedactions.push(...ocrRedactions);
            } catch {
              // OCR failure is non-fatal
            }
          }
        } catch (e) {
          result.error =
            e instanceof Error ? e.message : "Failed to process file";
        }

        results.push(result);
        setProgress(Math.round(((fi + 1) / filesToProcess.length) * 100));
      }

      setFileResults(results);
      setStatus("summary");
    },
    [locale]
  );

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles(newFiles);
      setError(null);
      await processFiles(newFiles, enabledTypes, regulation);
    },
    [enabledTypes, regulation, processFiles]
  );

  const getSummary = useCallback((): BatchSummaryData => {
    const findingsByType: Record<string, number> = {};
    let totalFindings = 0;

    for (const result of fileResults) {
      if (result.type === "pdf") {
        for (const r of result.pdfRedactions) {
          findingsByType[r.piiType] = (findingsByType[r.piiType] || 0) + 1;
          totalFindings++;
        }
      } else {
        for (const r of result.docxRedactions) {
          findingsByType[r.match.type] =
            (findingsByType[r.match.type] || 0) + 1;
          totalFindings++;
        }
      }
    }

    return {
      totalFiles: fileResults.length,
      totalFindings,
      findingsByType,
      fileResults,
    };
  }, [fileResults]);

  const redactAllAndDownloadZip = useCallback(async () => {
    setStatus("redacting-all");
    setProgress(0);

    try {
      const zip = new JSZip();
      const total = fileResults.length;

      for (let i = 0; i < total; i++) {
        const result = fileResults[i];
        setCurrentFileIndex(i);

        if (result.type === "pdf" && result.pdfDocument) {
          // Auto-confirm all
          const confirmed = result.pdfRedactions.map((r) => ({
            ...r,
            confirmed: true,
          }));
          const pageHeights = result.pdfDocument.pages.map((p) => p.height);
          let redactedBytes = await redactPDF(
            result.pdfDocument.arrayBuffer,
            confirmed,
            pageHeights,
            () => {}
          );
          redactedBytes = await addWatermark(redactedBytes);

          const outputName = result.file.name.replace(
            /\.pdf$/i,
            "_redacted.pdf"
          );
          zip.file(outputName, redactedBytes);

          // Release heavy data after adding to zip to reduce memory
          result.pdfDocument.arrayBuffer = new ArrayBuffer(0);
          result.pdfDocument.pages = [];
        } else if (result.type === "docx" && result.docxDocument) {
          const confirmedMatches = result.docxRedactions.map((r) => r.match);
          const redactedBytes = await redactDocx(
            result.docxDocument.arrayBuffer,
            confirmedMatches,
            result.docxDocument.fullText,
            () => {}
          );

          const outputName = result.file.name.replace(
            /\.docx$/i,
            "_redacted.docx"
          );
          zip.file(outputName, redactedBytes);

          // Release heavy data after adding to zip to reduce memory
          result.docxDocument.arrayBuffer = new ArrayBuffer(0);
        }

        setProgress(Math.round(((i + 1) / total) * 100));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = "redacted_documents.zip";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Release all remaining heavy data after download
      setFileResults((prev) =>
        prev.map((r) => ({
          ...r,
          pdfDocument: undefined,
          docxDocument: undefined,
          redactedBytes: null,
        }))
      );

      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ZIP creation failed");
      setStatus("error");
    }
  }, [fileResults]);

  const startReview = useCallback((index: number) => {
    setReviewingIndex(index);
    setStatus("reviewing");
  }, []);

  const backToSummary = useCallback(() => {
    setReviewingIndex(null);
    setStatus("summary");
  }, []);

  const toggleFileRedaction = useCallback(
    (fileIndex: number, redactionId: string) => {
      setFileResults((prev) =>
        prev.map((result, i) => {
          if (i !== fileIndex) return result;
          if (result.type === "pdf") {
            return {
              ...result,
              pdfRedactions: result.pdfRedactions.map((r) =>
                r.id === redactionId ? { ...r, confirmed: !r.confirmed } : r
              ),
            };
          } else {
            return {
              ...result,
              docxRedactions: result.docxRedactions.map((r) =>
                r.id === redactionId ? { ...r, confirmed: !r.confirmed } : r
              ),
            };
          }
        })
      );
    },
    []
  );

  const removeFileRedaction = useCallback(
    (fileIndex: number, redactionId: string) => {
      setFileResults((prev) =>
        prev.map((result, i) => {
          if (i !== fileIndex) return result;
          if (result.type === "pdf") {
            return {
              ...result,
              pdfRedactions: result.pdfRedactions.filter(
                (r) => r.id !== redactionId
              ),
            };
          } else {
            return {
              ...result,
              docxRedactions: result.docxRedactions.filter(
                (r) => r.id !== redactionId
              ),
            };
          }
        })
      );
    },
    []
  );

  const confirmAllForFile = useCallback((fileIndex: number) => {
    setFileResults((prev) =>
      prev.map((result, i) => {
        if (i !== fileIndex) return result;
        if (result.type === "pdf") {
          return {
            ...result,
            pdfRedactions: result.pdfRedactions.map((r) => ({
              ...r,
              confirmed: true,
            })),
          };
        } else {
          return {
            ...result,
            docxRedactions: result.docxRedactions.map((r) => ({
              ...r,
              confirmed: true,
            })),
          };
        }
      })
    );
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const changeRegulation = useCallback((reg: RegulationType) => {
    setRegulation(reg);
    setEnabledTypes(getRegulationPatterns(reg));
  }, []);

  const toggleType = useCallback((type: PIIType) => {
    setEnabledTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setCurrentFileIndex(0);
    setTotalFiles(0);
    setFileResults([]);
    setFiles([]);
    setError(null);
    setReviewingIndex(null);
    abortRef.current = false;
    batchIdCounter = 0;
  }, []);

  return {
    // State
    status,
    progress,
    currentFileIndex,
    totalFiles,
    fileResults,
    regulation,
    enabledTypes,
    files,
    error,
    reviewingIndex,
    // Actions
    handleFilesSelected,
    getSummary,
    redactAllAndDownloadZip,
    startReview,
    backToSummary,
    toggleFileRedaction,
    removeFileRedaction,
    confirmAllForFile,
    removeFile,
    changeRegulation,
    toggleType,
    reset,
  };
}
