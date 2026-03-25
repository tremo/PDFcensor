"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFPageThumbnails } from "@/components/pdf/PDFPageThumbnails";
import { RedactionControls } from "@/components/pdf/RedactionControls";
import { CustomKeywordPanel } from "@/components/pdf/CustomKeywordPanel";
import { DocxViewer } from "@/components/docx/DocxViewer";
import { DocxRedactionControls } from "@/components/docx/DocxRedactionControls";
import { BatchSummary } from "@/components/pdf/BatchSummary";
import { ImageViewer } from "@/components/image/ImageViewer";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";
import { useDocxProcessor } from "@/hooks/useDocxProcessor";
import { useBatchProcessor } from "@/hooks/useBatchProcessor";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { useAuth } from "@/components/auth/AuthProvider";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { useLocale } from "next-intl";

type DocumentType = "none" | "pdf" | "docx" | "image";
type FlowMode = "single" | "batch";

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
  const tb = useTranslations("redact.batch");
  const locale = useLocale();
  const { isPro } = useAuth();

  const [documentType, setDocumentType] = useState<DocumentType>("none");
  const [flowMode, setFlowMode] = useState<FlowMode>("single");
  const [showBatchGate, setShowBatchGate] = useState(false);

  // Single-file processors
  const pdf = usePDFProcessor();
  const docx = useDocxProcessor();
  const img = useImageProcessor();

  // Batch processor
  const batch = useBatchProcessor();

  const [selectedRedactionId, setSelectedRedactionId] = useState<string | null>(null);

  // Route files to correct processor
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      if (files.length > 1) {
        // Multiple files → batch mode (Pro only)
        if (!isPro) {
          setShowBatchGate(true);
          return;
        }
        setShowBatchGate(false);
        setFlowMode("batch");
        batch.handleFilesSelected(files);
      } else {
        // Single file → single mode
        setFlowMode("single");
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
      }
    },
    [pdf, docx, img, batch]
  );

  const handleDismissBatchGate = useCallback(() => {
    setShowBatchGate(false);
  }, []);

  const handleReset = useCallback(() => {
    if (flowMode === "batch") {
      batch.reset();
    } else if (documentType === "docx") {
      docx.reset();
    } else if (documentType === "image") {
      img.reset();
    } else {
      pdf.reset();
    }
    setDocumentType("none");
    setFlowMode("single");
    setSelectedRedactionId(null);
    setDrawMode(false);
  }, [flowMode, documentType, pdf, docx, img, batch]);

  // Determine the active state based on document type (single mode)
  const activeStatus =
    flowMode === "batch"
      ? "idle"
      : documentType === "docx"
      ? docx.status
      : documentType === "image"
      ? img.status
      : pdf.status;
  const activeError = documentType === "docx" ? docx.error : documentType === "image" ? img.error : pdf.error;
  const activeFiles = flowMode === "batch" ? batch.files : (documentType === "docx" ? docx.files : documentType === "image" ? img.files : pdf.files);
  const activeRegulation = flowMode === "batch" ? batch.regulation : (documentType === "docx" ? docx.regulation : documentType === "image" ? img.regulation : pdf.regulation);
  const activeEnabledTypes = flowMode === "batch" ? batch.enabledTypes : (documentType === "docx" ? docx.enabledTypes : documentType === "image" ? img.enabledTypes : pdf.enabledTypes);
  const hasActiveDocument = documentType === "docx" ? !!docx.document : documentType === "image" ? !!img.document : !!pdf.document;

  const activeRemoveFile = useCallback(
    (index: number) => {
      if (flowMode === "batch") {
        batch.removeFile(index);
      } else if (documentType === "docx") {
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
    [flowMode, documentType, pdf, docx, img, batch]
  );

  const activeChangeRegulation = flowMode === "batch"
    ? batch.changeRegulation
    : documentType === "docx"
      ? docx.changeRegulation
      : documentType === "image"
        ? img.changeRegulation
        : pdf.changeRegulation;
  const activeToggleType = flowMode === "batch"
    ? batch.toggleType
    : documentType === "docx"
      ? docx.toggleType
      : documentType === "image"
        ? img.toggleType
        : pdf.toggleType;

  // Calculate redaction counts per page (PDF only, single mode)
  const redactionCounts: Record<number, number> = {};
  if (documentType === "pdf") {
    for (const r of pdf.redactions) {
      redactionCounts[r.pageIndex] = (redactionCounts[r.pageIndex] || 0) + 1;
    }
  }

  // Get the page title based on mode
  const pageTitle =
    flowMode === "batch"
      ? t("titleBatch")
      : documentType === "docx"
        ? t("titleDocx")
        : t("title");

  // Determine if we're in upload phase
  const isUploadPhase =
    flowMode === "single"
      ? !hasActiveDocument
      : batch.status === "idle";

  // Batch processing state
  const isBatchProcessing = flowMode === "batch" && batch.status === "processing";
  const isBatchSummary = flowMode === "batch" && (batch.status === "summary" || batch.status === "redacting-all" || batch.status === "done");
  const isBatchReviewing = flowMode === "batch" && batch.status === "reviewing";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>

      {/* Error display */}
      {(activeError || batch.error) && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {activeError || batch.error}
        </div>
      )}

      {/* Batch Pro gate */}
      {showBatchGate && (
        <div className="mb-6 max-w-lg mx-auto p-6 rounded-xl border border-accent bg-accent/5 text-center space-y-3">
          <div className="text-2xl">⚡</div>
          <h2 className="text-lg font-semibold">Batch Processing is a Pro Feature</h2>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro to scan and redact multiple files at once and download them as a ZIP. Just $6.99/month, cancel anytime.
          </p>
          <div className="flex gap-3 justify-center pt-1">
            <Button asChild variant="accent">
              <Link href={`/${locale}/pricing`}>Upgrade to Pro — $6.99/mo</Link>
            </Button>
            <Button variant="outline" onClick={handleDismissBatchGate}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isUploadPhase ? (
        /* Upload state - regulation selection + dropzone */
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
            customKeywords={documentType === "pdf" || documentType === "none" ? pdf.customKeywords : undefined}
            onAddCustomKeyword={documentType === "pdf" || documentType === "none" ? pdf.addCustomKeyword : undefined}
            onRemoveCustomKeyword={documentType === "pdf" || documentType === "none" ? pdf.removeCustomKeyword : undefined}
          />
        </div>
      ) : isBatchProcessing ? (
        /* Batch processing progress */
        <div className="max-w-lg mx-auto space-y-6">
          <div className="p-6 bg-muted/30 rounded-xl border border-border space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{tb("processing")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tb("processingFile", {
                  current: batch.currentFileIndex + 1,
                  total: batch.totalFiles,
                })}
              </p>
            </div>
            <Progress value={batch.progress} />
          </div>
        </div>
      ) : isBatchSummary ? (
        /* Batch summary view */
        <BatchSummary
          summary={batch.getSummary()}
          status={batch.status}
          progress={batch.progress}
          currentFileIndex={batch.currentFileIndex}
          onReviewFile={batch.startReview}
          onDownloadAll={batch.redactAllAndDownloadZip}
          onReset={handleReset}
        />
      ) : isBatchReviewing && batch.reviewingIndex !== null ? (
        /* Batch - reviewing individual file */
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-1.5"
            onClick={batch.backToSummary}
          >
            <ArrowLeft className="w-4 h-4" />
            {tb("backToSummary")}
          </Button>

          {(() => {
            const result = batch.fileResults[batch.reviewingIndex];
            if (!result) return null;

            if (result.type === "pdf" && result.pdfDocument) {
              const reviewRedactionCounts: Record<number, number> = {};
              for (const r of result.pdfRedactions) {
                reviewRedactionCounts[r.pageIndex] =
                  (reviewRedactionCounts[r.pageIndex] || 0) + 1;
              }

              return (
                <BatchPDFReview
                  result={result}
                  redactionCounts={reviewRedactionCounts}
                  selectedRedactionId={selectedRedactionId}
                  onSelectRedaction={setSelectedRedactionId}
                  onToggleRedaction={(id) =>
                    batch.toggleFileRedaction(batch.reviewingIndex!, id)
                  }
                  onRemoveRedaction={(id) =>
                    batch.removeFileRedaction(batch.reviewingIndex!, id)
                  }
                  onConfirmAll={() =>
                    batch.confirmAllForFile(batch.reviewingIndex!)
                  }
                  onBack={batch.backToSummary}
                />
              );
            }

            // DOCX review (simplified text view)
            if (result.type === "docx" && result.docxDocument) {
              return (
                <BatchDocxReview
                  result={result}
                  selectedRedactionId={selectedRedactionId}
                  onSelectRedaction={setSelectedRedactionId}
                  onToggleRedaction={(id) =>
                    batch.toggleFileRedaction(batch.reviewingIndex!, id)
                  }
                  onRemoveRedaction={(id) =>
                    batch.removeFileRedaction(batch.reviewingIndex!, id)
                  }
                  onConfirmAll={() =>
                    batch.confirmAllForFile(batch.reviewingIndex!)
                  }
                  onBack={batch.backToSummary}
                />
              );
            }

            return null;
          })()}
        </div>
      ) : documentType === "docx" && docx.document ? (
        /* DOCX Processing state (single) */
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
        /* Image Processing state (single) */
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
        /* PDF Processing state (single) */
        <div className="space-y-3">
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
                  file={pdf.document.file}
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
            <div className="space-y-4">
              {/* Custom keyword panel - in editing sidebar */}
              <CustomKeywordPanel
                keywords={pdf.customKeywords}
                onAddKeyword={pdf.addCustomKeyword}
                onRemoveKeyword={pdf.removeCustomKeyword}
                onScan={pdf.scan}
                hasDocument={true}
                isProcessing={[
                  "parsing",
                  "scanning",
                  "ocr-scanning",
                  "redacting",
                ].includes(pdf.status)}
              />
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
        </div>
      ) : null}
    </div>
  );
}

/* ─── Batch review sub-components ─── */

import type { BatchFileResult } from "@/hooks/useBatchProcessor";

function BatchPDFReview({
  result,
  redactionCounts,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
  onRemoveRedaction,
  onConfirmAll,
  onBack,
}: {
  result: BatchFileResult;
  redactionCounts: Record<number, number>;
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  onConfirmAll: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("redact.controls");
  const tb = useTranslations("redact.batch");
  const tp = useTranslations("redact.piiTypes");
  const [currentPage, setCurrentPage] = useState(1);

  if (!result.pdfDocument) return null;

  const doc = result.pdfDocument;
  const redactions = result.pdfRedactions;
  const confirmedCount = redactions.filter((r) => r.confirmed).length;
  const pendingCount = redactions.filter((r) => !r.confirmed).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_340px] gap-6">
      <div className="hidden lg:block">
        <PDFPageThumbnails
          totalPages={doc.totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          redactionCounts={redactionCounts}
        />
      </div>

      <div className="overflow-auto max-h-[80vh]">
        <div className="flex justify-center min-w-fit">
          <PDFViewer
            file={doc.file}
            currentPage={currentPage}
            totalPages={doc.totalPages}
            redactions={redactions}
            scale={1.2}
            selectedRedactionId={selectedRedactionId}
            onSelectRedaction={onSelectRedaction}
            onToggleRedaction={onToggleRedaction}
            onRemoveRedaction={onRemoveRedaction}
            onUpdateRedaction={() => {}}
            onManualRedaction={() => {}}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-muted/30 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">
            {t("found", { count: redactions.length })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-medium">
              {confirmedCount} {t("censored")}
            </span>
            {pendingCount > 0 && (
              <>
                {" "}&middot;{" "}
                <span className="text-amber-500 font-medium">
                  {pendingCount} {t("pending")}
                </span>
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="default" onClick={onConfirmAll}>
              {t("confirmAll")}
            </Button>
            <Button size="sm" variant="outline" onClick={onBack}>
              {tb("backToSummary")}
            </Button>
          </div>
        </div>

        {/* Redaction list */}
        <div className="bg-muted/30 rounded-xl border border-border max-h-[50vh] overflow-y-auto">
          {redactions.map((r) => (
            <div
              key={r.id}
              className={`px-4 py-2.5 flex items-center gap-2 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                selectedRedactionId === r.id ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelectRedaction(r.id)}
            >
              <div
                className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${
                  r.confirmed ? "bg-black" : "bg-amber-400/30 border border-amber-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate">{r.text || t("manualArea")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tp(r.piiType as import("@/types/pii").PIIType)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRedaction(r.id);
                  }}
                  className={`p-1 rounded hover:scale-110 transition-all ${
                    r.confirmed
                      ? "text-amber-500 hover:bg-amber-100"
                      : "text-green-600 hover:bg-green-100"
                  }`}
                >
                  {r.confirmed ? "↩" : "✓"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRedaction(r.id);
                  }}
                  className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 hover:scale-110 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BatchDocxReview({
  result,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
  onRemoveRedaction,
  onConfirmAll,
  onBack,
}: {
  result: BatchFileResult;
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  onConfirmAll: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("redact.controls");
  const tp = useTranslations("redact.piiTypes");
  const tb = useTranslations("redact.batch");

  if (!result.docxDocument) return null;

  const doc = result.docxDocument;
  const redactions = result.docxRedactions;
  const confirmedCount = redactions.filter((r) => r.confirmed).length;
  const pendingCount = redactions.filter((r) => !r.confirmed).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* DOCX content with highlights */}
      <div className="overflow-auto max-h-[80vh] bg-white rounded-xl border border-border p-6">
        <DocxTextHighlighter
          fullText={doc.fullText}
          redactions={redactions}
          selectedRedactionId={selectedRedactionId}
          onSelectRedaction={onSelectRedaction}
          onToggleRedaction={onToggleRedaction}
        />
      </div>

      <div className="space-y-4">
        <div className="bg-muted/30 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">
            {t("found", { count: redactions.length })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-medium">
              {confirmedCount} {t("censored")}
            </span>
            {pendingCount > 0 && (
              <>
                {" "}&middot;{" "}
                <span className="text-amber-500 font-medium">
                  {pendingCount} {t("pending")}
                </span>
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="default" onClick={onConfirmAll}>
              {t("confirmAll")}
            </Button>
            <Button size="sm" variant="outline" onClick={onBack}>
              {tb("backToSummary")}
            </Button>
          </div>
        </div>

        {/* Redaction list */}
        <div className="bg-muted/30 rounded-xl border border-border max-h-[50vh] overflow-y-auto">
          {redactions.map((r) => (
            <div
              key={r.id}
              className={`px-4 py-2.5 flex items-center gap-2 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                selectedRedactionId === r.id ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelectRedaction(r.id)}
            >
              <div
                className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${
                  r.confirmed ? "bg-black" : "bg-amber-400/30 border border-amber-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate">{r.match.value}</p>
                <p className="text-[10px] text-muted-foreground">
                  {tp(r.match.type as import("@/types/pii").PIIType)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRedaction(r.id);
                  }}
                  className={`p-1 rounded hover:scale-110 transition-all ${
                    r.confirmed
                      ? "text-amber-500 hover:bg-amber-100"
                      : "text-green-600 hover:bg-green-100"
                  }`}
                >
                  {r.confirmed ? "↩" : "✓"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRedaction(r.id);
                  }}
                  className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 hover:scale-110 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Simple DOCX text highlighter for batch review */
function DocxTextHighlighter({
  fullText,
  redactions,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
}: {
  fullText: string;
  redactions: { id: string; match: import("@/types/pii").PIIMatch; confirmed: boolean }[];
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
}) {
  // Build segments: plain text + highlighted matches
  const sorted = [...redactions].sort(
    (a, b) => a.match.startIndex - b.match.startIndex
  );

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const r of sorted) {
    if (r.match.startIndex > lastIndex) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {fullText.slice(lastIndex, r.match.startIndex)}
        </span>
      );
    }
    segments.push(
      <span
        key={r.id}
        className={`px-0.5 rounded cursor-pointer transition-all ${
          r.confirmed
            ? "bg-black text-white"
            : selectedRedactionId === r.id
              ? "bg-amber-300 ring-2 ring-amber-400"
              : "bg-amber-200 hover:bg-amber-300"
        }`}
        onClick={() => {
          onSelectRedaction(r.id);
          onToggleRedaction(r.id);
        }}
      >
        {r.match.value}
      </span>
    );
    lastIndex = r.match.endIndex;
  }

  if (lastIndex < fullText.length) {
    segments.push(
      <span key={`text-${lastIndex}`}>{fullText.slice(lastIndex)}</span>
    );
  }

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
      {segments}
    </div>
  );
}
