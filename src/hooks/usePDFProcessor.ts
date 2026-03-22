"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type {
  PDFDocumentData,
  RedactionArea,
  ProcessingStatus,
} from "@/types/pdf";
import type { RegulationType, PIIType } from "@/types/pii";
import { parsePDF, releasePageTextData, reparsePages, getDocumentArrayBuffer } from "@/lib/pdf/parser";
import { detectPII } from "@/lib/pii/detector";
import { loadNameDictionaries } from "@/lib/pii/patterns/names";
import { redactPDF } from "@/lib/pdf/redactor";
import { addWatermark } from "@/lib/pdf/watermark";
import { getDefaultRegulation, getRegulationPatterns, getRegulationLocales } from "@/lib/pii/regulations";
import type { Locale } from "@/lib/i18n/config";

let idCounter = 0;
function nextId() {
  return `redaction-${++idCounter}`;
}

export function usePDFProcessor() {
  const locale = useLocale() as Locale;

  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [document, setDocument] = useState<PDFDocumentData | null>(null);
  const [redactions, setRedactions] = useState<RedactionArea[]>([]);
  const [redactedPdfBytes, setRedactedPdfBytes] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [regulation, setRegulation] = useState<RegulationType>(
    getDefaultRegulation(locale)
  );
  const [enabledTypes, setEnabledTypes] = useState<PIIType[]>(
    getRegulationPatterns(getDefaultRegulation(locale))
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanDocument = useCallback(async (doc: PDFDocumentData, types: PIIType[], reg: RegulationType) => {
    setStatus("scanning");
    setProgress(0);

    try {
      const locales = getRegulationLocales(reg, locale);
      await loadNameDictionaries(locales);

      // If text data was previously released, re-parse pages
      const needsReparse = doc.pages.length > 0 && doc.pages[0].textItems.length === 0 && doc.pages[0].fullText === "";
      if (needsReparse) {
        await reparsePages(doc, (p) => setProgress(Math.round(p * 0.3))); // 0-30% for re-parse
      }

      const allRedactions: RedactionArea[] = [];
      const progressBase = needsReparse ? 30 : 0;
      const progressRange = 100 - progressBase;

      for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages[i];
        const result = detectPII(page.fullText, page.pageIndex, types);

        for (const match of result.matches) {
          const matchingItems = page.textItems.filter((item) => {
            const itemStart = item.charOffset;
            const itemEnd = itemStart + item.text.length;
            return (
              (match.startIndex >= itemStart && match.startIndex < itemEnd) ||
              (match.endIndex > itemStart && match.endIndex <= itemEnd) ||
              (match.startIndex <= itemStart && match.endIndex >= itemEnd)
            );
          });

          if (matchingItems.length > 0) {
            // Calculate clipped bounding boxes for each text item,
            // only covering the portion that overlaps with the PII match
            const clippedBoxes = matchingItems.map((item) => {
              const itemStart = item.charOffset;
              const itemEnd = itemStart + item.text.length;
              const charCount = item.text.length;

              // Determine the overlapping character range within this item
              const overlapStart = Math.max(match.startIndex, itemStart) - itemStart;
              const overlapEnd = Math.min(match.endIndex, itemEnd) - itemStart;

              // Calculate proportional x offset and width based on character positions
              const charWidth = charCount > 0 ? item.width / charCount : item.width;
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
              id: nextId(),
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

        setProgress(progressBase + Math.round(((i + 1) / doc.pages.length) * progressRange));
      }

      // Release textItems and fullText to free memory — they're no longer needed
      // since bounding boxes are already computed in RedactionArea objects.
      // If the user re-scans, reparsePages() will reload them.
      releasePageTextData(doc);

      setRedactions(allRedactions);
      setStatus("previewing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PII detection failed");
      setStatus("error");
    }
  }, [locale]);

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);

      if (!document && newFiles.length > 0) {
        try {
          setStatus("parsing");
          setProgress(0);
          setError(null);

          const doc = await parsePDF(newFiles[0], setProgress);
          setDocument(doc);
          setCurrentPage(1);
          // Auto-scan immediately after parsing
          await scanDocument(doc, enabledTypes, regulation);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to parse PDF");
          setStatus("error");
        }
      }
    },
    [document, enabledTypes, regulation, scanDocument]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (index === 0 && document) {
        setDocument(null);
        setRedactions([]);
        setRedactedPdfBytes(null);
        setStatus("idle");
      }
    },
    [document]
  );

  const scan = useCallback(async () => {
    if (!document) return;
    await scanDocument(document, enabledTypes, regulation);
  }, [document, enabledTypes, regulation, scanDocument]);

  const applyRedaction = useCallback(
    async (isPro: boolean = false) => {
      if (!document) return;

      // Auto-confirm all pending redactions before applying
      const allConfirmed = redactions.map((r) => ({ ...r, confirmed: true }));
      setRedactions(allConfirmed);

      setStatus("redacting");
      setProgress(0);

      try {
        // Load ArrayBuffer on demand from File
        const arrayBuffer = await getDocumentArrayBuffer(document);
        const pageHeights = document.pages.map((p) => p.height);
        let resultBytes = await redactPDF(
          arrayBuffer,
          allConfirmed,
          pageHeights,
          setProgress
        );

        // Add watermark for free tier
        if (!isPro) {
          resultBytes = await addWatermark(resultBytes);
        }

        setRedactedPdfBytes(resultBytes);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Redaction failed");
        setStatus("error");
      }
    },
    [document, redactions]
  );

  const downloadRedactedPdf = useCallback(() => {
    if (!redactedPdfBytes || !document) return;

    const blob = new Blob([new Uint8Array(redactedPdfBytes) as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.fileName.replace(/\.pdf$/i, "")}_redacted.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [redactedPdfBytes, document]);

  const toggleRedaction = useCallback((id: string) => {
    setRedactions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmed: !r.confirmed } : r))
    );
  }, []);

  const removeRedaction = useCallback((id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRedaction = useCallback(
    (id: string, updates: Partial<Pick<RedactionArea, "x" | "y" | "width" | "height">>) => {
      setRedactions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const confirmAll = useCallback(() => {
    setRedactions((prev) => prev.map((r) => ({ ...r, confirmed: true })));
  }, []);

  const rejectAll = useCallback(() => {
    setRedactions((prev) => prev.map((r) => ({ ...r, confirmed: false })));
  }, []);

  const addManualRedaction = useCallback(
    (area: Omit<RedactionArea, "id" | "piiType" | "text" | "confirmed">) => {
      setRedactions((prev) => [
        ...prev,
        {
          ...area,
          id: nextId(),
          piiType: "manual",
          text: "",
          confirmed: true,
        },
      ]);
    },
    []
  );

  const changeRegulation = useCallback((reg: RegulationType) => {
    setRegulation(reg);
    setEnabledTypes(getRegulationPatterns(reg));
  }, []);

  const toggleType = useCallback((type: PIIType) => {
    setEnabledTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }, []);

  const reset = useCallback(() => {
    setDocument(null);
    setRedactions([]);
    setRedactedPdfBytes(null);
    setCurrentPage(1);
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setError(null);
    idCounter = 0;
  }, []);

  return {
    // State
    status,
    progress,
    document,
    redactions,
    redactedPdfBytes,
    currentPage,
    regulation,
    enabledTypes,
    files,
    error,
    // Actions
    handleFilesSelected,
    removeFile,
    scan,
    applyRedaction,
    downloadRedactedPdf,
    toggleRedaction,
    removeRedaction,
    updateRedaction,
    confirmAll,
    rejectAll,
    addManualRedaction,
    changeRegulation,
    toggleType,
    setCurrentPage,
    reset,
  };
}
