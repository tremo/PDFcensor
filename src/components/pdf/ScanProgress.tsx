"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import type { ProcessingStatus, RedactionArea } from "@/types/pdf";
import {
  ScanSearch,
  FileText,
  ScanFace,
  ShieldCheck,
  Loader2,
  Lock,
  Eye,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanProgressProps {
  status: ProcessingStatus;
  progress: number;
  redactions: RedactionArea[];
  fileName?: string;
  faceDetectionEnabled?: boolean;
}

export function ScanProgress({
  status,
  progress,
  redactions,
  fileName,
  faceDetectionEnabled,
}: ScanProgressProps) {
  const t = useTranslations("redact.controls");
  const tp = useTranslations("redact.piiTypes");
  const ts = useTranslations("redact.scanProgress");

  // Rotating status messages
  const [messageIndex, setMessageIndex] = useState(0);

  const statusMessages = useMemo(() => {
    if (status === "parsing") {
      return [
        { text: ts("msg_parsing1"), icon: FileText },
        { text: ts("msg_parsing2"), icon: Lock },
      ];
    }
    if (status === "face-scanning") {
      return [
        { text: ts("msg_face1"), icon: ScanFace },
        { text: ts("msg_face2"), icon: Eye },
        { text: ts("msg_face3"), icon: ShieldCheck },
      ];
    }
    // scanning / ocr-scanning
    if (faceDetectionEnabled) {
      return [
        { text: ts("msg_scanFace1"), icon: ScanSearch },
        { text: ts("msg_scanFace2"), icon: Fingerprint },
        { text: ts("msg_scanFace3"), icon: Lock },
        { text: ts("msg_scanFace4"), icon: ScanFace },
      ];
    }
    return [
      { text: ts("msg_scan1"), icon: ScanSearch },
      { text: ts("msg_scan2"), icon: Fingerprint },
      { text: ts("msg_scan3"), icon: Lock },
      { text: ts("msg_scan4"), icon: ShieldCheck },
    ];
  }, [status, faceDetectionEnabled, ts]);

  // Rotate messages every 4 seconds
  useEffect(() => {
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  const currentMessage = statusMessages[messageIndex % statusMessages.length];
  const MessageIcon = currentMessage.icon;

  // Group redactions by type for live display
  const findingsByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const r of redactions) {
      grouped[r.piiType] = (grouped[r.piiType] || 0) + 1;
    }
    return grouped;
  }, [redactions]);

  const totalFindings = redactions.length;

  // Step indicators
  const steps = useMemo(() => {
    const s = [
      { key: "parsing", label: ts("stepParsing"), icon: FileText },
      { key: "scanning", label: ts("stepScanning"), icon: ScanSearch },
    ];
    if (faceDetectionEnabled) {
      s.push({ key: "face-scanning", label: ts("stepFaceScanning"), icon: ScanFace });
    }
    return s;
  }, [faceDetectionEnabled, ts]);

  const statusOrder = ["parsing", "scanning", "ocr-scanning", "face-scanning"];
  const currentIndex = statusOrder.indexOf(status);

  const getStepStatus = (stepKey: string) => {
    const stepIndex = statusOrder.indexOf(stepKey === "scanning" ? "scanning" : stepKey);
    if (stepKey === "scanning" && (status === "scanning" || status === "ocr-scanning")) return "active";
    if (status === stepKey) return "active";
    if (stepIndex < currentIndex) return "done";
    if (status === "previewing" || status === "done") return "done";
    return "pending";
  };

  // Main title based on status
  const mainTitle = useMemo(() => {
    if (status === "parsing") return t("parsing");
    if (status === "face-scanning") return t("faceScanning");
    if (status === "ocr-scanning") return t("ocrScanning");
    return t("scanning");
  }, [status, t]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* File info */}
      {fileName && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-accent shrink-0" />
          <p className="text-sm font-medium truncate">{fileName}</p>
        </div>
      )}

      {/* Main progress card */}
      <div className="p-6 bg-muted/30 rounded-xl border border-border space-y-5">
        {/* Animated spinner + status */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{mainTitle}</h3>
            {/* Rotating message */}
            <div className="flex items-center gap-1.5 mt-1 transition-opacity duration-500">
              <MessageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground truncate" key={messageIndex}>
                {currentMessage.text}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} />

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const stepStatus = getStepStatus(step.key);
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                {i > 0 && (
                  <div className={cn(
                    "h-px flex-1",
                    stepStatus === "pending" ? "bg-border" : "bg-primary/40"
                  )} />
                )}
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                  stepStatus === "active" && "bg-primary/10 text-primary",
                  stepStatus === "done" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  stepStatus === "pending" && "bg-muted text-muted-foreground"
                )}>
                  {stepStatus === "done" ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className={cn("w-3.5 h-3.5", stepStatus === "active" && "animate-pulse")} />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live findings */}
      {totalFindings > 0 && (
        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{ts("foundSoFar")}</h4>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {totalFindings}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(findingsByType).map(([type, count]) => (
              <span
                key={type}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  type === "face"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                )}
              >
                {type === "face" ? (
                  <ScanFace className="w-3 h-3" />
                ) : null}
                {type === "face" ? tp("face") : tp(type as never)}
                <span className="font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Face detection queued info */}
      {faceDetectionEnabled && status !== "face-scanning" && status !== "parsing" && (
        <p className="text-xs text-center text-muted-foreground">
          {ts("faceDetectionQueued")}
        </p>
      )}
    </div>
  );
}
