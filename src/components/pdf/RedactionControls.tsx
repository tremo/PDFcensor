"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PIIType } from "@/types/pii";
import type { ProcessingStatus, RedactionArea } from "@/types/pdf";
import {
  ScanSearch,
  ShieldCheck,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  XCircle,
  Pencil,
  MousePointer,
  ChevronDown,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RedactionControlsProps {
  status: ProcessingStatus;
  progress: number;
  redactions: RedactionArea[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onScan: () => void;
  onRedact: () => void;
  onDownload: () => void;
  onReset: () => void;
  hasDocument: boolean;
  hasRedactedPdf: boolean;
  drawMode: boolean;
  onToggleDrawMode: () => void;
  onConfirmAll: () => void;
  onRejectAll: () => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
}

export function RedactionControls({
  status,
  progress,
  redactions,
  currentPage,
  totalPages,
  onPageChange,
  onScan,
  onRedact,
  onDownload,
  onReset,
  hasDocument,
  hasRedactedPdf,
  drawMode,
  onToggleDrawMode,
  onConfirmAll,
  onRejectAll,
  onToggleRedaction,
  onRemoveRedaction,
  selectedRedactionId,
  onSelectRedaction,
}: RedactionControlsProps) {
  const t = useTranslations("redact.controls");
  const tp = useTranslations("redact.piiTypes");

  const confirmedRedactions = redactions.filter((r) => r.confirmed);
  const rejectedRedactions = redactions.filter((r) => !r.confirmed);
  const confirmedCount = confirmedRedactions.length;
  const rejectedCount = rejectedRedactions.length;

  const isProcessing = ["parsing", "scanning", "redacting"].includes(status);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  const allPiiTypes: PIIType[] = [
    "ssn", "tcKimlik", "itin", "email", "phone", "trPhone",
    "usPhone", "iban", "creditCard", "passport", "names", "address",
  ];

  const piiTypeLabels: Record<string, string> = {};
  for (const type of allPiiTypes) {
    piiTypeLabels[type] = tp(type);
  }

  // Group CONFIRMED redactions by PII type for current page
  const pageConfirmed = confirmedRedactions.filter(
    (r) => r.pageIndex === currentPage - 1
  );
  const pageRejected = rejectedRedactions.filter(
    (r) => r.pageIndex === currentPage - 1
  );

  const groupedConfirmed = pageConfirmed.reduce<
    Record<string, RedactionArea[]>
  >((acc, r) => {
    const key = r.piiType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Progress */}
      {isProcessing && (
        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {status === "scanning" && t("scanning")}
            {status === "redacting" && t("redacting")}
            {status === "parsing" && t("parsing")}
          </p>
        </div>
      )}

      {/* Summary + bulk actions */}
      {redactions.length > 0 && !hasRedactedPdf && (
        <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
          {/* Summary bar */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                {t("found", { count: redactions.length })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-black font-medium">{confirmedCount} {t("censored")}</span>
                {rejectedCount > 0 && (
                  <>
                    {" "}&middot;{" "}
                    <span className="text-orange-500 font-medium">{rejectedCount} {t("rejected")}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onConfirmAll}
                className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                title={t("confirmAll")}
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onRejectAll}
                className="p-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                title={t("rejectAll")}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmed redactions grouped by type */}
          <div className="border-t border-border max-h-[280px] overflow-y-auto">
            {Object.entries(groupedConfirmed).map(([type, items]) => {
              const isExpanded = expandedGroup === type;

              return (
                <div key={type} className="border-b border-border last:border-b-0">
                  <button
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : type)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <div className="w-3 h-3 bg-black rounded-sm" />
                      <span className="text-sm font-medium">
                        {piiTypeLabels[type] || type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {items.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-background/50">
                      {items.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "px-4 py-2 flex items-center gap-2 border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                            selectedRedactionId === r.id && "bg-blue-50 dark:bg-blue-950/30"
                          )}
                          onClick={() => onSelectRedaction(r.id)}
                        >
                          <div className="w-2.5 h-2.5 bg-black rounded-sm flex-shrink-0" />
                          <p className="flex-1 text-xs font-mono truncate min-w-0">
                            {r.text || t("manualArea")}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRedaction(r.id);
                              }}
                              className="p-1 rounded text-orange-500 hover:bg-orange-100 transition-colors"
                              title={t("reject")}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveRedaction(r.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                              title={t("delete")}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {pageConfirmed.length === 0 && redactions.length > 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("noResultsOnPage")}
              </p>
            )}
          </div>

          {/* Rejected section - collapsible */}
          {pageRejected.length > 0 && (
            <div className="border-t border-border">
              <button
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-orange-50 transition-colors"
                onClick={() => setShowRejected(!showRejected)}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-orange-400 transition-transform",
                      showRejected && "rotate-180"
                    )}
                  />
                  <span className="text-sm font-medium text-orange-600">
                    {t("rejectedItems")}
                  </span>
                </div>
                <span className="text-xs text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded">
                  {pageRejected.length}
                </span>
              </button>

              {showRejected && (
                <div className="bg-orange-50/50">
                  {pageRejected.map((r) => (
                    <div
                      key={r.id}
                      className="px-4 py-2 flex items-center gap-2 border-t border-orange-100 hover:bg-orange-50 transition-colors"
                    >
                      <div className="w-2.5 h-2.5 border border-orange-300 rounded-sm flex-shrink-0 bg-orange-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate text-muted-foreground line-through">
                          {r.text || t("manualArea")}
                        </p>
                        <p className="text-[10px] text-orange-400">
                          {piiTypeLabels[r.piiType] || r.piiType}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleRedaction(r.id)}
                        className="p-1 rounded text-green-600 hover:bg-green-100 transition-colors"
                        title={t("restore")}
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Re-scan button */}
          <div className="p-3 border-t border-border">
            <button
              onClick={onScan}
              disabled={isProcessing}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ScanSearch className="w-3 h-3" />
              {t("rescan")}
            </button>
          </div>
        </div>
      )}

      {/* Tools bar */}
      {hasDocument && !hasRedactedPdf && redactions.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={onToggleDrawMode}
            variant={drawMode ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            {drawMode ? (
              <>
                <Pencil className="h-4 w-4" />
                {t("drawing")}
              </>
            ) : (
              <>
                <MousePointer className="h-4 w-4" />
                {t("select")}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-muted/30 rounded-xl border border-border px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {t("page", { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Primary actions */}
      <div className="space-y-2">
        {redactions.length > 0 && !hasRedactedPdf && (
          <Button
            onClick={onRedact}
            className="w-full h-12 text-base"
            variant="default"
            disabled={isProcessing || confirmedCount === 0}
          >
            <ShieldCheck className="h-5 w-5" />
            {t("redact")} ({confirmedCount})
          </Button>
        )}

        {hasRedactedPdf && (
          <Button
            onClick={onDownload}
            className="w-full h-12 text-base"
            variant="accent"
          >
            <Download className="h-5 w-5" />
            {t("download")}
          </Button>
        )}

        {(hasDocument || hasRedactedPdf) && (
          <Button
            onClick={onReset}
            className="w-full"
            variant="outline"
            size="sm"
            disabled={isProcessing}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset")}
          </Button>
        )}
      </div>

      {/* No results hint */}
      {redactions.length === 0 && status === "previewing" && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t("noResults")}
        </p>
      )}
    </div>
  );
}
