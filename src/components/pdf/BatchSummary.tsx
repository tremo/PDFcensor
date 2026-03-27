"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BatchSummaryData, BatchStatus } from "@/hooks/useBatchProcessor";
import type { PIIType } from "@/types/pii";
import {
  ShieldAlert,
  FileText,
  Eye,
  RotateCcw,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  User,
  Hash,
  Globe,
  Fingerprint,
  FileCheck,
  Loader2,
  Calendar,
  Wifi,
  Network,
  Bitcoin,
  Navigation,
  Car,
  BookOpen,
  ScanFace,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchSummaryProps {
  summary: BatchSummaryData;
  status: BatchStatus;
  progress: number;
  currentFileIndex: number;
  onReviewFile: (index: number) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

const PII_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  trPhone: <Phone className="w-4 h-4" />,
  usPhone: <Phone className="w-4 h-4" />,
  creditCard: <CreditCard className="w-4 h-4" />,
  address: <MapPin className="w-4 h-4" />,
  names: <User className="w-4 h-4" />,
  ssn: <Hash className="w-4 h-4" />,
  tcKimlik: <Fingerprint className="w-4 h-4" />,
  itin: <Hash className="w-4 h-4" />,
  iban: <Globe className="w-4 h-4" />,
  passport: <FileCheck className="w-4 h-4" />,
  dateOfBirth: <Calendar className="w-4 h-4" />,
  face: <ScanFace className="w-4 h-4" />,
  ipAddress: <Wifi className="w-4 h-4" />,
  macAddress: <Network className="w-4 h-4" />,
  cryptoWallet: <Bitcoin className="w-4 h-4" />,
  gpsCoordinate: <Navigation className="w-4 h-4" />,
  licensePlate: <Car className="w-4 h-4" />,
  nationalId: <Fingerprint className="w-4 h-4" />,
};

const PII_COLORS: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-600 border-blue-200",
  phone: "bg-violet-500/10 text-violet-600 border-violet-200",
  trPhone: "bg-violet-500/10 text-violet-600 border-violet-200",
  usPhone: "bg-violet-500/10 text-violet-600 border-violet-200",
  creditCard: "bg-rose-500/10 text-rose-600 border-rose-200",
  address: "bg-amber-500/10 text-amber-600 border-amber-200",
  names: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  ssn: "bg-red-500/10 text-red-600 border-red-200",
  tcKimlik: "bg-red-500/10 text-red-600 border-red-200",
  itin: "bg-orange-500/10 text-orange-600 border-orange-200",
  iban: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  passport: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  dateOfBirth: "bg-teal-500/10 text-teal-600 border-teal-200",
  face: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  ipAddress: "bg-slate-500/10 text-slate-600 border-slate-200",
  macAddress: "bg-gray-500/10 text-gray-600 border-gray-200",
  cryptoWallet: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  gpsCoordinate: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  licensePlate: "bg-sky-500/10 text-sky-600 border-sky-200",
  nationalId: "bg-rose-500/10 text-rose-600 border-rose-200",
};

export function BatchSummary({
  summary,
  status,
  progress,
  currentFileIndex,
  onReviewFile,
  onDownloadAll,
  onReset,
}: BatchSummaryProps) {
  const t = useTranslations("redact.batch");
  const tp = useTranslations("redact.piiTypes");
  const tc = useTranslations("redact.controls");

  const isRedacting = status === "redacting-all";
  const isDone = status === "done";

  // Sort findings by count (descending)
  const sortedFindings = Object.entries(summary.findingsByType).sort(
    ([, a], [, b]) => b - a
  );

  const filesWithFindings = summary.fileResults.filter((r) => {
    const count =
      r.type === "pdf" ? r.pdfRedactions.length : r.docxRedactions.length;
    return count > 0;
  });
  const filesWithErrors = summary.fileResults.filter((r) => r.error);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero summary card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative">
          {/* Title area */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  {t("scanComplete")}
                </span>
              </div>
              <h2 className="text-2xl font-bold">
                {t("totalFindings", { count: summary.totalFindings })}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {t("acrossFiles", { count: summary.totalFiles })}
              </p>
            </div>

            {/* Big number badge */}
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center border border-white/10">
              <span className="text-3xl font-bold text-amber-400">
                {summary.totalFindings}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                PII
              </span>
            </div>
          </div>

          {/* PII type breakdown - chips */}
          {sortedFindings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sortedFindings.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm"
                >
                  <span className="text-white/70">
                    {PII_ICONS[type] || <Hash className="w-4 h-4" />}
                  </span>
                  <span className="font-medium">{count}</span>
                  <span className="text-slate-400">{tp(type as PIIType)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={onDownloadAll}
          disabled={isRedacting || summary.totalFindings === 0}
          className="h-14 text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          variant="default"
        >
          {isRedacting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("redactingAll")}
            </>
          ) : isDone ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t("downloaded")}
            </>
          ) : (
            <>
              <Archive className="w-5 h-5" />
              {t("downloadAllZip")}
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          disabled={isRedacting}
          variant="outline"
          className="h-14 text-base gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {tc("reset")}
        </Button>
      </div>

      {/* Progress bar for ZIP creation */}
      {isRedacting && (
        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {t("processingFile", {
              current: currentFileIndex + 1,
              total: summary.totalFiles,
            })}
          </p>
        </div>
      )}

      {/* Per-file results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {t("fileBreakdown")}
        </h3>

        {summary.fileResults.map((result, index) => {
          const findingCount =
            result.type === "pdf"
              ? result.pdfRedactions.length
              : result.docxRedactions.length;

          // Get PII types for this file
          const fileFindings: Record<string, number> = {};
          if (result.type === "pdf") {
            for (const r of result.pdfRedactions) {
              fileFindings[r.piiType] = (fileFindings[r.piiType] || 0) + 1;
            }
          } else {
            for (const r of result.docxRedactions) {
              fileFindings[r.match.type] =
                (fileFindings[r.match.type] || 0) + 1;
            }
          }

          const fileFindingEntries = Object.entries(fileFindings).sort(
            ([, a], [, b]) => b - a
          );

          return (
            <div
              key={`${result.file.name}-${index}`}
              className={cn(
                "rounded-xl border overflow-hidden transition-all",
                result.error
                  ? "border-red-200 bg-red-50/50"
                  : findingCount > 0
                    ? "border-border bg-background hover:border-amber-300 hover:shadow-sm"
                    : "border-border bg-background hover:border-emerald-300 hover:shadow-sm"
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* File icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      result.error
                        ? "bg-red-100"
                        : findingCount > 0
                          ? "bg-amber-100"
                          : "bg-emerald-100"
                    )}
                  >
                    {result.error ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : findingCount > 0 ? (
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm font-semibold truncate">
                        {result.file.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(result.file.size / 1024 / 1024).toFixed(2)} MB
                      {result.type === "pdf" &&
                        result.pdfDocument &&
                        ` · ${result.pdfDocument.totalPages} ${t("pages")}`}
                    </p>

                    {/* Error message */}
                    {result.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {result.error}
                      </p>
                    )}

                    {/* Finding count */}
                    {!result.error && (
                      <div className="mt-2">
                        {findingCount > 0 ? (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-amber-600">
                              {t("findingsInFile", { count: findingCount })}
                            </span>

                            {/* Mini PII type chips */}
                            <div className="flex flex-wrap gap-1">
                              {fileFindingEntries.map(([type, count]) => (
                                <span
                                  key={type}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                                    PII_COLORS[type] ||
                                      "bg-gray-100 text-gray-600 border-gray-200"
                                  )}
                                >
                                  {PII_ICONS[type] || null}
                                  {count} {tp(type as PIIType)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">
                            {t("noFindings")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Review button */}
                  {!result.error && findingCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-1.5"
                      onClick={() => onReviewFile(index)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("review")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-center gap-6 py-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>
            {t("totalFiles", { count: summary.totalFiles })}
          </span>
        </div>
        {filesWithFindings.length > 0 && (
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {t("filesWithFindings", { count: filesWithFindings.length })}
            </span>
          </div>
        )}
        {filesWithErrors.length > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>
              {t("filesWithErrors", { count: filesWithErrors.length })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
