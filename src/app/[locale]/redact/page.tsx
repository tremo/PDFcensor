"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFPageThumbnails } from "@/components/pdf/PDFPageThumbnails";
import { RedactionControls } from "@/components/pdf/RedactionControls";
import { DocxViewer } from "@/components/docx/DocxViewer";
import { DocxRedactionControls } from "@/components/docx/DocxRedactionControls";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";
import { useDocxProcessor } from "@/hooks/useDocxProcessor";

type DocumentType = "none" | "pdf" | "docx";

function isDocxFile(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  );
}

export default function RedactPage() {
  const t = useTranslations("redact");

  const [documentType, setDocumentType] = useState<DocumentType>("none");

  // PDF processor
  const pdf = usePDFProcessor();

  // DOCX processor
  const docx = useDocxProcessor();

  const [selectedRedactionId, setSelectedRedactionId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);

  // Route file to the correct processor
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      if (isDocxFile(file)) {
        setDocumentType("docx");
        docx.handleFilesSelected(files);
      } else {
        setDocumentType("pdf");
        pdf.handleFilesSelected(files);
      }
    },
    [pdf, docx]
  );

  const handleReset = useCallback(() => {
    if (documentType === "docx") {
      docx.reset();
    } else {
      pdf.reset();
    }
    setDocumentType("none");
    setSelectedRedactionId(null);
    setDrawMode(false);
  }, [documentType, pdf, docx]);

  // Determine the active state based on document type
  const activeStatus = documentType === "docx" ? docx.status : pdf.status;
  const activeError = documentType === "docx" ? docx.error : pdf.error;
  const activeFiles = documentType === "docx" ? docx.files : pdf.files;
  const activeRegulation = documentType === "docx" ? docx.regulation : pdf.regulation;
  const activeEnabledTypes = documentType === "docx" ? docx.enabledTypes : pdf.enabledTypes;
  const hasActiveDocument = documentType === "docx" ? !!docx.document : !!pdf.document;

  const activeRemoveFile = useCallback(
    (index: number) => {
      if (documentType === "docx") {
        docx.removeFile(index);
        if (index === 0) {
          setDocumentType("none");
        }
      } else {
        pdf.removeFile(index);
        if (index === 0) {
          setDocumentType("none");
        }
      }
    },
    [documentType, pdf, docx]
  );

  const activeChangeRegulation = documentType === "docx"
    ? docx.changeRegulation
    : pdf.changeRegulation;
  const activeToggleType = documentType === "docx"
    ? docx.toggleType
    : pdf.toggleType;

  // Calculate redaction counts per page (PDF only)
  const redactionCounts: Record<number, number> = {};
  if (documentType === "pdf") {
    for (const r of pdf.redactions) {
      redactionCounts[r.pageIndex] = (redactionCounts[r.pageIndex] || 0) + 1;
    }
  }

  // Get the page title based on document type
  const pageTitle =
    documentType === "docx" ? t("titleDocx") : t("title");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>

      {/* Error display */}
      {activeError && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {activeError}
        </div>
      )}

      {!hasActiveDocument ? (
        /* Upload state - regulation selection + dropzone */
        <div className="max-w-2xl mx-auto">
          <PDFDropzone
            onFilesSelected={handleFilesSelected}
            isProcessing={activeStatus === "parsing" || activeStatus === "scanning"}
            selectedFiles={activeFiles}
            onRemoveFile={activeRemoveFile}
            regulation={activeRegulation}
            onRegulationChange={activeChangeRegulation}
            enabledTypes={activeEnabledTypes}
            onToggleType={activeToggleType}
          />
        </div>
      ) : documentType === "docx" && docx.document ? (
        /* DOCX Processing state */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* DOCX Viewer */}
          <div className="overflow-auto max-h-[80vh]">
            <DocxViewer
              document={docx.document}
              redactions={docx.redactions}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
            />
          </div>

          {/* Controls sidebar */}
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
      ) : pdf.document ? (
        /* PDF Processing state */
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_340px] gap-6">
          {/* Page thumbnails */}
          <div className="hidden lg:block">
            <PDFPageThumbnails
              totalPages={pdf.document.totalPages}
              currentPage={pdf.currentPage}
              onPageChange={pdf.setCurrentPage}
              redactionCounts={redactionCounts}
            />
          </div>

          {/* PDF Viewer */}
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
                drawMode={drawMode}
              />
            </div>
          </div>

          {/* Controls sidebar */}
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
              drawMode={drawMode}
              onToggleDrawMode={() => setDrawMode((d) => !d)}
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
