"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type { RedactionArea, ProcessingStatus } from "@/types/pdf";
import type { ImageDocumentData } from "@/types/image";
import type { PIIType, RegulationType } from "@/types/pii";
import { detectOCRPIIFromImage } from "@/lib/image/ocr";
import { redactImage } from "@/lib/image/redactor";
import { loadNameDictionaries } from "@/lib/pii/patterns/names";
import { getDefaultRegulation, getRegulationPatterns, getRegulationLocales } from "@/lib/pii/regulations";
import { detectFacesInCanvas } from "@/lib/face/detector";
import type { Locale } from "@/lib/i18n/config";

let idCounter = 0;
function nextId() {
  return `img-manual-${++idCounter}`;
}

export function useImageProcessor() {
  const locale = useLocale() as Locale;

  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [document, setDocument] = useState<ImageDocumentData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [redactions, setRedactions] = useState<RedactionArea[]>([]);
  const [redactedBlobUrl, setRedactedBlobUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [regulation, setRegulation] = useState<RegulationType>(
    getDefaultRegulation(locale)
  );
  const [enabledTypes, setEnabledTypes] = useState<PIIType[]>(
    getRegulationPatterns(getDefaultRegulation(locale))
  );
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(false);

  const scanImage = useCallback(
    async (file: File, types: PIIType[], reg: RegulationType, detectFaces: boolean = false) => {
      setStatus("ocr-scanning");
      setProgress(0);
      setError(null);

      try {
        const locales = getRegulationLocales(reg, locale);
        await loadNameDictionaries(locales);

        const { redactions: found, width, height } = await detectOCRPIIFromImage(
          file,
          types,
          locale,
          setProgress
        );

        let allRedactions = found;

        // Run face detection if enabled
        if (detectFaces) {
          setStatus("face-scanning");
          setProgress(0);

          const bitmap = await createImageBitmap(file);
          const canvas = globalThis.document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();

          const faceRedactions = await detectFacesInCanvas(canvas, 0);
          canvas.width = 0;
          canvas.height = 0;

          allRedactions = [...found, ...faceRedactions];
          setProgress(100);
        }

        const objectUrl = URL.createObjectURL(file);
        setDocument({ fileName: file.name, width, height, fileSize: file.size, objectUrl });
        setRedactions(allRedactions);
        setStatus("previewing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "OCR scanning failed");
        setStatus("error");
      }
    },
    [locale]
  );

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);

      if (!document && newFiles.length > 0) {
        const file = newFiles[0];
        setImageFile(file);
        await scanImage(file, enabledTypes, regulation, faceDetectionEnabled);
      }
    },
    [document, enabledTypes, regulation, faceDetectionEnabled, scanImage]
  );

  const scan = useCallback(async () => {
    if (!imageFile) return;
    await scanImage(imageFile, enabledTypes, regulation, faceDetectionEnabled);
  }, [imageFile, enabledTypes, regulation, faceDetectionEnabled, scanImage]);

  const applyRedaction = useCallback(async () => {
    if (!imageFile || !document) return;

    const allConfirmed = redactions.map((r) => ({ ...r, confirmed: true }));
    setRedactions(allConfirmed);
    setStatus("redacting");
    setProgress(0);

    try {
      const blob = await redactImage(imageFile, allConfirmed);
      if (redactedBlobUrl) URL.revokeObjectURL(redactedBlobUrl);
      const url = URL.createObjectURL(blob);
      setRedactedBlobUrl(url);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redaction failed");
      setStatus("error");
    }
  }, [imageFile, document, redactions, redactedBlobUrl]);

  const downloadRedacted = useCallback(() => {
    if (!redactedBlobUrl || !document) return;
    const a = globalThis.document.createElement("a");
    a.href = redactedBlobUrl;
    const baseName = document.fileName.replace(/\.[^.]+$/, "");
    a.download = `${baseName}_redacted.png`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
  }, [redactedBlobUrl, document]);

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (index === 0 && document) {
        if (document.objectUrl) URL.revokeObjectURL(document.objectUrl);
        if (redactedBlobUrl) URL.revokeObjectURL(redactedBlobUrl);
        setDocument(null);
        setImageFile(null);
        setRedactions([]);
        setRedactedBlobUrl(null);
        setStatus("idle");
      }
    },
    [document, redactedBlobUrl]
  );

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
    if (document?.objectUrl) URL.revokeObjectURL(document.objectUrl);
    if (redactedBlobUrl) URL.revokeObjectURL(redactedBlobUrl);
    setDocument(null);
    setImageFile(null);
    setRedactions([]);
    setRedactedBlobUrl(null);
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setError(null);
    idCounter = 0;
  }, [document, redactedBlobUrl]);

  return {
    status,
    progress,
    document,
    redactions,
    redactedBlobUrl,
    files,
    error,
    regulation,
    enabledTypes,
    faceDetectionEnabled,
    handleFilesSelected,
    removeFile,
    scan,
    applyRedaction,
    downloadRedacted,
    toggleRedaction,
    removeRedaction,
    updateRedaction,
    confirmAll,
    rejectAll,
    addManualRedaction,
    changeRegulation,
    toggleType,
    setFaceDetectionEnabled,
    reset,
  };
}
