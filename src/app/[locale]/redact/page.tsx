"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFPageThumbnails } from "@/components/pdf/PDFPageThumbnails";
import { RedactionControls } from "@/components/pdf/RedactionControls";
import { DocxViewer } from "@/components/docx/DocxViewer";
import { DocxRedactionControls } from "@/components/docx/DocxRedactionControls";
import { ImageViewer } from "@/components/image/ImageViewer";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";
import { useDocxProcessor } from "@/hooks/useDocxProcessor";
import { useImageProcessor } from "@/hooks/useImageProcessor";

type DocumentType = "none" | "pdf" | "docx" | "image";

function isDocxFile(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  );
}

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff"];

function isImageFile(file: File): boolean {
  return (
    IMAGE_MIME_TYPES.includes(file.type) ||
    IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}

export default function RedactPage() {
  const t = useTranslations("redact");

  const [documentType, setDocumentType] = useState<DocumentType>("none");

  const pdf = usePDFProcessor();
  const docx = useDocxProcessor();
  const img = useImageProcessor();

  const [selectedRedactionId, setSelectedRedactionId] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      if (isDocxFile(file)) {
        setDocumentType("docx");
        docx.handleFilesSelected(files);
      } else if (isImageFile(file)) {
        setDocumentType("image");
        img.handleFilesSelected(files);
      } else {
        setDocumentType("pdf");
        pdf.handleFilesSelected(files);
      }
    },
    [pdf, docx, img]
  );

  const handleReset = useCallback(() => {
    if (documentType === "docx") {
      docx.reset();
    } else if (documentType === "image") {
      img.reset();
    } else {
      pdf.reset();
    }
    setDocumentType("none");
    setSelectedRedactionId(null);
  }, [documentType, pdf, docx, img]);

  const activeStatus =
    documentType === "docx"
      ? docx.status
      : documentType === "image"
      ? img.status
      : pdf.status;
  const activeError =
    documentType === "docx"
      ? docx.error
      : documentType === "image"
      ? img.error
      : pdf.error;
  const activeFiles =
    documentType === "docx"
      ? docx.files
      : documentType === "image"
      ? img.files
      : pdf.files;
  const activeRegulation =
    documentType === "docx"
      ? docx.regulation
      : documentType === "image"
      ? img.regulation
      : pdf.regulation;
  const activeEnabledTypes =
    documentType === "docx"
      ? docx.enabledTypes
      : documentType === "image"
      ? img.enabledTypes
      : pdf.enabledTypes;
  const hasActiveDocument =
    documentType === "docx"
      ? !!docx.document
      : documentType === "image"
      ? !!img.document
      : !!pdf.document;

  const activeRemoveFile = useCallback(
    (index: number) => {
      if (documentType === "docx") {
        docx.removeFile(index);
        if (index === 0) setDocumentType("none");
      } else if (documentType === "image") {
        img.removeFile(index);
        if (index === 0) setDocumentType("none");
      } else {
        pdf.removeFile(index);
        if (index === 0) setDocumentType("none");
      }
    },
    [documentType, pdf, docx, img]
  );

  const activeChangeRegulation =
    documentType === "docx"
      ? docx.changeRegulation
      : documentType === "image"
      ? img.changeRegulation
      : pdf.changeRegulation;
  const activeToggleType =
    documentType === "docx"
      ? docx.toggleType
      : documentType === "image"
      ? img.toggleType
      : pdf.toggleType;

  const redactionCounts: Record<number, number> = {};
  if (documentType === "pdf") {
    for (const r of pdf.redactions) {
      redactionCounts[r.pageIndex] = (redactionCounts[r.pageIndex] || 0) + 1;
    }
  }

  const pageTitle =
    documentType === "docx" ? t("titleDocx") : t("title");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>

      {activeError && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {activeError}
        </div>
      )}

      {!hasActiveDocument ? (
        <div className="max-w-2xl mx-auto">
          <PDFDropzone
            onFilesSelected={handleFilesSelected}
            isProcessing={
              activeStatus === "parsing" ||
              activeStatus === "scanning" ||
              activeStatus === "ocr-scanning"
            }
            selectedFiles={activeFiles}
            onRemoveFile={activeRemoveFile}
            regulation={activeRegulation}
            onRegulationChange={activeChangeRegulation}
            enabledTypes={activeEnabledTypes}
            onToggleType={activeToggleType}
          />
        </div>
      ) : documentType === "docx" && docx.document ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="overflow-auto max-h-[80vh]">
            <DocxViewer
              document={docx.document}
              redactions={docx.redactions}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
              onToggleRedaction={docx.toggleRedaction}
              onRemoveRedaction={docx.removeRedaction}
            />
          </div>
          <div>
            <DocxRedactionControls
              status={docx.status}
              progress={docx.progress}
              redactions={docx.redactions}
              onScan={docx.scan}
              onRedact={docx.applyRedaction}
              onDownload={docx.downloadRedactedDocx}
              onReset={handleReset}
              hasDocument={!!docx.document}
              hasRedactedDoc={!!docx.redactedBytes}
              onConfirmAll={docx.confirmAll}
              onRejectAll={docx.rejectAll}
              onToggleRedaction={docx.toggleRedaction}
              onRemoveRedaction={docx.removeRedaction}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
            />
          </div>
        </div>
      ) : documentType === "image" && img.document ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="overflow-auto max-h-[80vh] flex justify-center">
            <ImageViewer
              document={img.document}
              redactions={img.redactions}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
              onToggleRedaction={img.toggleRedaction}
              onRemoveRedaction={img.removeRedaction}
              onManualRedaction={img.addManualRedaction}
            />
          </div>
          <div>
            <RedactionControls
              status={img.status}
              progress={img.progress}
              redactions={img.redactions}
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              onScan={img.scan}
              onRedact={img.applyRedaction}
              onDownload={img.downloadRedacted}
              onReset={handleReset}
              hasDocument={!!img.document}
              hasRedactedPdf={!!img.redactedBlobUrl}
              onConfirmAll={img.confirmAll}
              onRejectAll={img.rejectAll}
              onToggleRedaction={img.toggleRedaction}
              onRemoveRedaction={img.removeRedaction}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
            />
          </div>
        </div>
      ) : pdf.document ? (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_340px] gap-6">
          <div className="hidden lg:block">
            <PDFPageThumbnails
              totalPages={pdf.document.totalPages}
              currentPage={pdf.currentPage}
              onPageChange={pdf.setCurrentPage}
              redactionCounts={redactionCounts}
            />
          </div>
          <div className="overflow-auto max-h-[80vh]">
            <div className="flex justify-center min-w-fit">
              <PDFViewer
                arrayBuffer={pdf.document.arrayBuffer}
                currentPage={pdf.currentPage}
                totalPages={pdf.document.totalPages}
                redactions={pdf.redactions}
                scale={1.2}
                selectedRedactionId={selectedRedactionId}
                onSelectRedaction={setSelectedRedactionId}
                onToggleRedaction={pdf.toggleRedaction}
                onRemoveRedaction={pdf.removeRedaction}
                onUpdateRedaction={pdf.updateRedaction}
                onManualRedaction={pdf.addManualRedaction}
              />
            </div>
          </div>
          <div>
            <RedactionControls
              status={pdf.status}
              progress={pdf.progress}
              redactions={pdf.redactions}
              currentPage={pdf.currentPage}
              totalPages={pdf.document.totalPages}
              onPageChange={pdf.setCurrentPage}
              onScan={pdf.scan}
              onRedact={() => pdf.applyRedaction(false)}
              onDownload={pdf.downloadRedactedPdf}
              onReset={handleReset}
              hasDocument={!!pdf.document}
              hasRedactedPdf={!!pdf.redactedPdfBytes}
              onConfirmAll={pdf.confirmAll}
              onRejectAll={pdf.rejectAll}
              onToggleRedaction={pdf.toggleRedaction}
              onRemoveRedaction={pdf.removeRedaction}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
