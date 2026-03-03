"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type { ProcessingStatus } from "@/types/pdf";
import type { RegulationType, PIIType, PIIMatch } from "@/types/pii";
import { parseDocx } from "@/lib/docx/parser";
import type { DocxDocumentData } from "@/lib/docx/parser";
import { detectPII } from "@/lib/pii/detector";
import { loadNameDictionary } from "@/lib/pii/patterns/names";
import { redactDocx } from "@/lib/docx/redactor";
import { getDefaultRegulation, getRegulationPatterns } from "@/lib/pii/regulations";
import type { Locale } from "@/lib/i18n/config";

export interface DocxRedactionItem {
  id: string;
  match: PIIMatch;
  confirmed: boolean;
}

let docxIdCounter = 0;
function nextDocxId() {
  return `docx-redaction-${++docxIdCounter}`;
}

export function useDocxProcessor() {
  const locale = useLocale() as Locale;

  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [document, setDocument] = useState<DocxDocumentData | null>(null);
  const [redactions, setRedactions] = useState<DocxRedactionItem[]>([]);
  const [redactedBytes, setRedactedBytes] = useState<Uint8Array | null>(null);
  const [regulation, setRegulation] = useState<RegulationType>(
    getDefaultRegulation(locale)
  );
  const [enabledTypes, setEnabledTypes] = useState<PIIType[]>(
    getRegulationPatterns(getDefaultRegulation(locale))
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanDocument = useCallback(
    async (doc: DocxDocumentData, types: PIIType[]) => {
      setStatus("scanning");
      setProgress(0);

      try {
        await loadNameDictionary(locale);

        const result = detectPII(doc.fullText, 0, types);
        setProgress(100);

        const items: DocxRedactionItem[] = result.matches.map((m) => ({
          id: nextDocxId(),
          match: m,
          confirmed: false,
        }));

        setRedactions(items);
        setStatus("previewing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "PII detection failed");
        setStatus("error");
      }
    },
    [locale]
  );

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);

      if (!document && newFiles.length > 0) {
        try {
          setStatus("parsing");
          setProgress(0);
          setError(null);

          const doc = await parseDocx(newFiles[0], setProgress);
          setDocument(doc);
          await scanDocument(doc, enabledTypes);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Failed to parse document"
          );
          setStatus("error");
        }
      }
    },
    [document, enabledTypes, scanDocument]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (index === 0 && document) {
        setDocument(null);
        setRedactions([]);
        setRedactedBytes(null);
        setStatus("idle");
      }
    },
    [document]
  );

  const scan = useCallback(async () => {
    if (!document) return;
    await scanDocument(document, enabledTypes);
  }, [document, enabledTypes, scanDocument]);

  const applyRedaction = useCallback(async () => {
    if (!document) return;

    setStatus("redacting");
    setProgress(0);

    try {
      const confirmedMatches = redactions
        .filter((r) => r.confirmed)
        .map((r) => r.match);

      const resultBytes = await redactDocx(
        document.arrayBuffer,
        confirmedMatches,
        document.fullText,
        setProgress
      );

      setRedactedBytes(resultBytes);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redaction failed");
      setStatus("error");
    }
  }, [document, redactions]);

  const downloadRedactedDocx = useCallback(() => {
    if (!redactedBytes || !document) return;

    const blob = new Blob([new Uint8Array(redactedBytes) as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.fileName.replace(/\.docx$/i, "")}_redacted.docx`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [redactedBytes, document]);

  const toggleRedaction = useCallback((id: string) => {
    setRedactions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmed: !r.confirmed } : r))
    );
  }, []);

  const removeRedaction = useCallback((id: string) => {
    setRedactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const confirmAll = useCallback(() => {
    setRedactions((prev) => prev.map((r) => ({ ...r, confirmed: true })));
  }, []);

  const rejectAll = useCallback(() => {
    setRedactions((prev) => prev.map((r) => ({ ...r, confirmed: false })));
  }, []);

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
    setRedactedBytes(null);
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setError(null);
    docxIdCounter = 0;
  }, []);

  return {
    status,
    progress,
    document,
    redactions,
    redactedBytes,
    regulation,
    enabledTypes,
    files,
    error,
    handleFilesSelected,
    removeFile,
    scan,
    applyRedaction,
    downloadRedactedDocx,
    toggleRedaction,
    removeRedaction,
    confirmAll,
    rejectAll,
    changeRegulation,
    toggleType,
    reset,
  };
}
