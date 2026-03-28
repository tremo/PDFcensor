"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PIIType } from "@/types/pii";
import type { ProcessingStatus } from "@/types/pdf";
import type { DocxRedactionItem } from "@/hooks/useDocxProcessor";
import {
  ScanSearch,
  ShieldCheck,
  Download,
  RotateCcw,
  CheckCheck,
  XCircle,
  ChevronDown,
  Trash2,
  Undo2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocxRedactionControlsProps {
  status: ProcessingStatus;
  progress: number;
  redactions: DocxRedactionItem[];
  onScan: () => void;
  onRedact: () => void;
  onDownload: () => void;
  onReset: () => void;
  hasDocument: boolean;
  hasRedactedDoc: boolean;
  onConfirmAll: () => void;
  onRejectAll: () => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
}

export function DocxRedactionControls({
  status,
  progress,
  redactions,
  onScan,
  onRedact,
  onDownload,
  onReset,
  hasDocument,
  hasRedactedDoc,
  onConfirmAll,
  onRejectAll,
  onToggleRedaction,
  onRemoveRedaction,
  selectedRedactionId,
  onSelectRedaction,
}: DocxRedactionControlsProps) {
  const t = useTranslations("redact.controls");
  const tp = useTranslations("redact.piiTypes");

  const confirmedRedactions = redactions.filter((r) => r.confirmed);
  const pendingRedactions = redactions.filter((r) => !r.confirmed);
  const confirmedCount = confirmedRedactions.length;
  const pendingCount = pendingRedactions.length;

  const isProcessing = ["parsing", "scanning", "redacting"].includes(status);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const allPiiTypes: PIIType[] = [
    "ssn", "tcKimlik", "itin", "email", "phone",
    "iban", "creditCard", "passport", "names", "address",
    "dateOfBirth", "ipAddress", "macAddress", "cryptoWallet",
    "gpsCoordinate", "licensePlate", "nationalId",
  ];

  const piiTypeLabels: Record<string, string> = {};
  for (const type of allPiiTypes) {
    piiTypeLabels[type] = tp(type);
  }

  // Group by PII type
  const groupedConfirmed = confirmedRedactions.reduce<
    Record<string, DocxRedactionItem[]>
  >((acc, r) => {
    const key = r.match.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const groupedPending = pendingRedactions.reduce<
    Record<string, DocxRedactionItem[]>
  >((acc, r) => {
    const key = r.match.type;
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
            {status === "parsing" && t("parsingDocx")}
          </p>
        </div>
      )}

      {/* Summary + bulk actions */}
      {redactions.length > 0 && !hasRedactedDoc && (
        <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
          {/* Summary bar */}
          <div className="p-4 flex items-center justify-between">
            <div>
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

          {/* Redaction items list */}
          <div className="border-t border-border max-h-[400px] overflow-y-auto">
            {/* Pending review section */}
            {Object.keys(groupedPending).length > 0 && (
              <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200/60">
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                  {t("pendingItems")}
                </span>
              </div>
            )}
            {Object.entries(groupedPending).map(([type, items]) => {
              const key = `pending-${type}`;
              const isExpanded = expandedGroup === key;

              return (
                <div key={key} className="border-b border-border last:border-b-0">
                  <button
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-amber-50/80 transition-colors"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : key)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-amber-500 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <div className="w-3 h-3 bg-amber-400/30 border-2 border-amber-400 rounded-sm" />
                      <span className="text-sm font-medium">
                        {piiTypeLabels[type] || type}
                      </span>
                    </div>
                    <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      {items.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-amber-50/30">
                      {items.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "px-4 py-2 flex items-center gap-2 border-t border-amber-100/50 hover:bg-amber-50/60 transition-colors cursor-pointer",
                            selectedRedactionId === r.id && "bg-amber-100/50"
                          )}
                          onClick={() => onSelectRedaction(r.id)}
                        >
                          <div className="w-2.5 h-2.5 bg-amber-400/30 border border-amber-400 rounded-sm flex-shrink-0" />
                          <p className="flex-1 text-xs font-mono truncate min-w-0">
                            {r.match.value}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRedaction(r.id);
                              }}
                              className="p-1 rounded text-green-600 hover:bg-green-100 hover:scale-110 transition-all"
                              title={t("confirm")}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveRedaction(r.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 hover:scale-110 transition-all"
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

            {/* Approved section */}
            {Object.keys(groupedConfirmed).length > 0 && (
              <div className="px-4 py-1.5 bg-neutral-50 border-b border-border">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {t("confirmed")}
                </span>
              </div>
            )}
            {Object.entries(groupedConfirmed).map(([type, items]) => {
              const key = `confirmed-${type}`;
              const isExpanded = expandedGroup === key;

              return (
                <div key={key} className="border-b border-border last:border-b-0">
                  <button
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : key)
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
                            selectedRedactionId === r.id && "bg-blue-50"
                          )}
                          onClick={() => onSelectRedaction(r.id)}
                        >
                          <div className="w-2.5 h-2.5 bg-black rounded-sm flex-shrink-0" />
                          <p className="flex-1 text-xs font-mono truncate min-w-0 line-through">
                            {r.match.value}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRedaction(r.id);
                              }}
                              className="p-1 rounded text-amber-500 hover:bg-amber-100 hover:scale-110 transition-all"
                              title={t("restore")}
                            >
                              <Undo2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveRedaction(r.id);
                              }}
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 hover:scale-110 transition-all"
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

      {/* Primary actions */}
      <div className="space-y-2">
        {redactions.length > 0 && !hasRedactedDoc && (
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

        {hasRedactedDoc && (
          <Button
            onClick={onDownload}
            className="w-full h-12 text-base"
            variant="accent"
          >
            <Download className="h-5 w-5" />
            {t("downloadDocx")}
          </Button>
        )}

        {(hasDocument || hasRedactedDoc) && (
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
