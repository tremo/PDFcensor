"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFPageThumbnails } from "@/components/pdf/PDFPageThumbnails";
import { RedactionControls } from "@/components/pdf/RedactionControls";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";

export default function RedactPage() {
  const t = useTranslations("redact");

  const {
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
  } = usePDFProcessor();

  const [selectedRedactionId, setSelectedRedactionId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);

  // Calculate redaction counts per page
  const redactionCounts: Record<number, number> = {};
  for (const r of redactions) {
    redactionCounts[r.pageIndex] = (redactionCounts[r.pageIndex] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {!document ? (
        /* Upload state */
        <div className="max-w-2xl mx-auto">
          <PDFDropzone
            onFilesSelected={handleFilesSelected}
            isProcessing={status === "parsing"}
            selectedFiles={files}
            onRemoveFile={removeFile}
          />
        </div>
      ) : (
        /* Processing state */
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_340px] gap-6">
          {/* Page thumbnails */}
          <div className="hidden lg:block">
            <PDFPageThumbnails
              totalPages={document.totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              redactionCounts={redactionCounts}
            />
          </div>

          {/* PDF Viewer */}
          <div className="overflow-auto max-h-[80vh]">
            <div className="flex justify-center min-w-fit">
              <PDFViewer
                arrayBuffer={document.arrayBuffer}
                currentPage={currentPage}
                totalPages={document.totalPages}
                redactions={redactions}
                scale={1.2}
                selectedRedactionId={selectedRedactionId}
                onSelectRedaction={setSelectedRedactionId}
                onToggleRedaction={toggleRedaction}
                onRemoveRedaction={removeRedaction}
                onUpdateRedaction={updateRedaction}
                onManualRedaction={addManualRedaction}
                drawMode={drawMode}
              />
            </div>
          </div>

          {/* Controls */}
          <div>
            <RedactionControls
              status={status}
              progress={progress}
              regulation={regulation}
              onRegulationChange={changeRegulation}
              enabledTypes={enabledTypes}
              onToggleType={toggleType}
              redactions={redactions}
              currentPage={currentPage}
              totalPages={document.totalPages}
              onPageChange={setCurrentPage}
              onScan={scan}
              onRedact={() => applyRedaction(false)}
              onDownload={downloadRedactedPdf}
              onReset={reset}
              hasDocument={!!document}
              hasRedactedPdf={!!redactedPdfBytes}
              drawMode={drawMode}
              onToggleDrawMode={() => setDrawMode((d) => !d)}
              onConfirmAll={confirmAll}
              onRejectAll={rejectAll}
              onToggleRedaction={toggleRedaction}
              onRemoveRedaction={removeRedaction}
              selectedRedactionId={selectedRedactionId}
              onSelectRedaction={setSelectedRedactionId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
