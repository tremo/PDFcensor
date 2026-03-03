"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { regulations } from "@/lib/pii/regulations";
import type { RegulationType, PIIType } from "@/types/pii";
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
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RedactionControlsProps {
  status: ProcessingStatus;
  progress: number;
  regulation: RegulationType;
  onRegulationChange: (r: RegulationType) => void;
  enabledTypes: PIIType[];
  onToggleType: (type: PIIType) => void;
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
  regulation,
  onRegulationChange,
  enabledTypes,
  onToggleType,
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
  const confirmedCount = redactions.filter((r) => r.confirmed).length;
  const rejectedCount = redactions.length - confirmedCount;

  const isProcessing = ["parsing", "scanning", "redacting"].includes(status);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const allPiiTypes: PIIType[] = [
    "ssn", "tcKimlik", "itin", "email", "phone", "trPhone",
    "usPhone", "iban", "creditCard", "passport", "names", "address",
  ];

  const piiTypeLabels: Record<string, string> = {};
  for (const type of allPiiTypes) {
    piiTypeLabels[type] = tp(type);
  }

  // Group redactions by PII type for the current page
  const pageRedactions = redactions.filter(
    (r) => r.pageIndex === currentPage - 1
  );

  const groupedRedactions = pageRedactions.reduce<
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
            {status === "parsing" && t("scanning")}
          </p>
        </div>
      )}

      {/* Regulation & PII types - collapsible before scan */}
      {!hasRedactedPdf && (
        <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
          <div className="p-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
              {t("regulation")}
            </label>
            <select
              value={regulation}
              onChange={(e) =>
                onRegulationChange(e.target.value as RegulationType)
              }
              disabled={isProcessing}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(regulations).map(([key, reg]) => (
                <option key={key} value={key}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>

          <div className="px-4 pb-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
              {t("piiTypes")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {regulations[regulation].patterns.map((type) => (
                <button
                  key={type}
                  onClick={() => onToggleType(type)}
                  disabled={isProcessing}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full border transition-all cursor-pointer",
                    enabledTypes.includes(type)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {piiTypeLabels[type] || type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scan / Main action */}
      {hasDocument && !hasRedactedPdf && redactions.length === 0 && (
        <Button
          onClick={onScan}
          className="w-full h-12 text-base"
          variant="accent"
          disabled={isProcessing}
        >
          <ScanSearch className="h-5 w-5" />
          {t("scan")}
        </Button>
      )}

      {/* Results summary + bulk actions */}
      {redactions.length > 0 && !hasRedactedPdf && (
        <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
          {/* Summary bar */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                {t("found", { count: redactions.length })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-green-600 font-medium">{confirmedCount} {t("confirmed")}</span>
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
                className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
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

          {/* Redaction list grouped by type - scrollable */}
          <div className="border-t border-border max-h-[340px] overflow-y-auto">
            {Object.entries(groupedRedactions).map(([type, items]) => {
              const isExpanded = expandedGroup === type;
              const confirmedInGroup = items.filter((r) => r.confirmed).length;

              return (
                <div key={type} className="border-b border-border last:border-b-0">
                  {/* Group header */}
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
                      <span className="text-sm font-medium">
                        {piiTypeLabels[type] || type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {confirmedInGroup}/{items.length}
                      </span>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          confirmedInGroup === items.length
                            ? "bg-green-500"
                            : confirmedInGroup > 0
                            ? "bg-yellow-500"
                            : "bg-orange-400"
                        )}
                      />
                    </div>
                  </button>

                  {/* Group items */}
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
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono truncate">
                              {r.text || t("manualArea")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRedaction(r.id);
                              }}
                              className={cn(
                                "p-1 rounded transition-colors",
                                r.confirmed
                                  ? "text-green-600 bg-green-100 hover:bg-green-200"
                                  : "text-orange-500 bg-orange-100 hover:bg-orange-200"
                              )}
                              title={r.confirmed ? t("reject") : t("confirm")}
                            >
                              {r.confirmed ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
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

            {pageRedactions.length === 0 && redactions.length > 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t("noResultsOnPage")}
              </p>
            )}
          </div>

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

      {/* No results on page hint */}
      {redactions.length === 0 && status === "previewing" && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t("noResults")}
        </p>
      )}
    </div>
  );
}
