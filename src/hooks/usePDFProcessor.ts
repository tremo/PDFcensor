"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type {
  PDFDocumentData,
  RedactionArea,
  ProcessingStatus,
} from "@/types/pdf";
import type { RegulationType, PIIType } from "@/types/pii";
import { parsePDF } from "@/lib/pdf/parser";
import { detectPII } from "@/lib/pii/detector";
import { loadNameDictionary } from "@/lib/pii/patterns/names";
import { redactPDF } from "@/lib/pdf/redactor";
import { addWatermark } from "@/lib/pdf/watermark";
import { getDefaultRegulation, getRegulationPatterns } from "@/lib/pii/regulations";
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
          setStatus("previewing");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to parse PDF");
          setStatus("error");
        }
      }
    },
    [document]
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

    setStatus("scanning");
    setProgress(0);

    try {
      // Load name dictionary
      await loadNameDictionary(locale);

      const allRedactions: RedactionArea[] = [];

      for (let i = 0; i < document.pages.length; i++) {
        const page = document.pages[i];
        const result = detectPII(page.fullText, page.pageIndex, enabledTypes);

        // Map PII matches to redaction areas using text item positions
        for (const match of result.matches) {
          // Find the text items that contain this match
          const matchingItems = page.textItems.filter((item) => {
            const itemStart = page.fullText.indexOf(item.text);
            const itemEnd = itemStart + item.text.length;
            return (
              (match.startIndex >= itemStart && match.startIndex < itemEnd) ||
              (match.endIndex > itemStart && match.endIndex <= itemEnd) ||
              (match.startIndex <= itemStart && match.endIndex >= itemEnd)
            );
          });

          if (matchingItems.length > 0) {
            const minX = Math.min(...matchingItems.map((it) => it.x));
            const minY = Math.min(...matchingItems.map((it) => it.y));
            const maxX = Math.max(
              ...matchingItems.map((it) => it.x + it.width)
            );
            const maxY = Math.max(
              ...matchingItems.map((it) => it.y + it.height)
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
              confirmed: true,
            });
          }
        }

        setProgress(Math.round(((i + 1) / document.pages.length) * 100));
      }

      setRedactions(allRedactions);
      setStatus("previewing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PII detection failed");
      setStatus("error");
    }
  }, [document, enabledTypes, locale]);

  const applyRedaction = useCallback(
    async (isPro: boolean = false) => {
      if (!document) return;

      setStatus("redacting");
      setProgress(0);

      try {
        const pageHeights = document.pages.map((p) => p.height);
        let resultBytes = await redactPDF(
          document.arrayBuffer,
          redactions,
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
    addManualRedaction,
    changeRegulation,
    toggleType,
    setCurrentPage,
    reset,
  };
}
