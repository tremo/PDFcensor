"use client";

import { useTranslations } from "next-intl";
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
}: RedactionControlsProps) {
  const t = useTranslations("redact.controls");
  const tp = useTranslations("redact.piiTypes");
  const confirmedCount = redactions.filter((r) => r.confirmed).length;

  const isProcessing = ["parsing", "scanning", "redacting"].includes(status);

  const allPiiTypes: PIIType[] = [
    "ssn", "tcKimlik", "itin", "email", "phone", "trPhone",
    "usPhone", "iban", "creditCard", "passport", "names", "address",
  ];

  const piiTypeLabels: Record<string, string> = {};
  for (const type of allPiiTypes) {
    try {
      piiTypeLabels[type] = tp(type as never);
    } catch {
      piiTypeLabels[type] = type;
    }
  }

  return (
    <div className="space-y-6 p-4 bg-muted/30 rounded-xl border border-border">
      {/* Regulation selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          {t("regulation")}
        </label>
        <select
          value={regulation}
          onChange={(e) => onRegulationChange(e.target.value as RegulationType)}
          disabled={isProcessing}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {Object.entries(regulations).map(([key, reg]) => (
            <option key={key} value={key}>
              {reg.name} — {reg.description}
            </option>
          ))}
        </select>
      </div>

      {/* PII type toggles */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          {t("piiTypes")}
        </label>
        <div className="flex flex-wrap gap-2">
          {regulations[regulation].patterns.map((type) => (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              disabled={isProcessing}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer",
                enabledTypes.includes(type)
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background text-muted-foreground border-border hover:border-accent/50"
              )}
            >
              {piiTypeLabels[type] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {status === "scanning" && t("scanning")}
            {status === "redacting" && t("redacting")}
            {status === "parsing" && t("scanning")}
          </p>
        </div>
      )}

      {/* Results count */}
      {redactions.length > 0 && status !== "scanning" && (
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-sm font-medium">
            {t("found", { count: redactions.length })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {confirmedCount} / {redactions.length} confirmed
          </p>
        </div>
      )}

      {redactions.length === 0 && status === "previewing" && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t("noResults")}
        </p>
      )}

      {/* Page navigation */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {t("page", { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {hasDocument && status === "previewing" && redactions.length === 0 && (
          <Button
            onClick={onScan}
            className="w-full"
            variant="accent"
            disabled={isProcessing}
          >
            <ScanSearch className="h-4 w-4" />
            {t("scan")}
          </Button>
        )}

        {hasDocument && !hasRedactedPdf && (status === "idle" || status === "loading") && (
          <Button
            onClick={onScan}
            className="w-full"
            variant="accent"
            disabled={isProcessing || !hasDocument}
          >
            <ScanSearch className="h-4 w-4" />
            {t("scan")}
          </Button>
        )}

        {redactions.length > 0 && !hasRedactedPdf && (
          <Button
            onClick={onRedact}
            className="w-full"
            variant="default"
            disabled={isProcessing || confirmedCount === 0}
          >
            <ShieldCheck className="h-4 w-4" />
            {t("redact")}
          </Button>
        )}

        {hasRedactedPdf && (
          <Button onClick={onDownload} className="w-full" variant="accent">
            <Download className="h-4 w-4" />
            {t("download")}
          </Button>
        )}

        {(hasDocument || hasRedactedPdf) && (
          <Button
            onClick={onReset}
            className="w-full"
            variant="outline"
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4" />
            {t("reset")}
          </Button>
        )}
      </div>
    </div>
  );
}
