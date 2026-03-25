"use client";

import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, X, ScanFace, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { regulations } from "@/lib/pii/regulations";
import type { RegulationType, PIIType } from "@/types/pii";
import { CustomKeywordPanel } from "./CustomKeywordPanel";

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  regulation: RegulationType;
  onRegulationChange: (r: RegulationType) => void;
  enabledTypes: PIIType[];
  onToggleType: (type: PIIType) => void;
  customKeywords?: string[];
  onAddCustomKeyword?: (keyword: string) => void;
  onRemoveCustomKeyword?: (keyword: string) => void;
  faceDetectionEnabled?: boolean;
  onFaceDetectionToggle?: (enabled: boolean) => void;
}

export function PDFDropzone({
  onFilesSelected,
  isProcessing,
  selectedFiles,
  onRemoveFile,
  regulation,
  onRegulationChange,
  enabledTypes,
  onToggleType,
  customKeywords = [],
  onAddCustomKeyword,
  onRemoveCustomKeyword,
  faceDetectionEnabled,
  onFaceDetectionToggle,
}: PDFDropzoneProps) {
  const t = useTranslations("redact.dropzone");
  const tp = useTranslations("redact.piiTypes");
  const tc = useTranslations("redact.controls");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isProcessing) return;

      const ACCEPTED_TYPES = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/tiff",
      ];
      const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff"];
      const files = Array.from(e.dataTransfer.files).filter(
        (f) =>
          ACCEPTED_TYPES.includes(f.type) ||
          f.name.endsWith(".docx") ||
          IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
      );
      if (files.length > 0) onFilesSelected(files);
    },
    [isProcessing, onFilesSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFilesSelected(files);
      e.target.value = "";
    },
    [onFilesSelected]
  );

  const allPiiTypes: PIIType[] = [
    "ssn", "tcKimlik", "itin", "email", "phone", "trPhone",
    "usPhone", "iban", "creditCard", "passport", "names", "address",
  ];

  return (
    <div className="space-y-6">
      {/* Regulation selector */}
      <div className="bg-muted/30 rounded-xl border border-border p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
            {tc("regulation")}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(regulations).map(([key, reg]) => (
              <button
                key={key}
                onClick={() => onRegulationChange(key as RegulationType)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer",
                  regulation === key
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {reg.name === "COMPREHENSIVE" ? tc("comprehensive") : reg.name}
              </button>
            ))}
          </div>
        </div>

        {/* PII type chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
            {tc("piiTypes")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allPiiTypes.map((type) => (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full border transition-all cursor-pointer",
                  enabledTypes.includes(type)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {tp(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Face detection toggle */}
        {onFaceDetectionToggle && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onFaceDetectionToggle(!faceDetectionEnabled)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left",
                faceDetectionEnabled
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                  : "bg-background border-border hover:border-blue-300"
              )}
            >
              <ScanFace className={cn(
                "w-5 h-5 shrink-0",
                faceDetectionEnabled ? "text-blue-500" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-medium block",
                  faceDetectionEnabled ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                )}>
                  {tc("faceDetection")}
                </span>
                {faceDetectionEnabled && (
                  <span className="text-xs text-blue-500/80 dark:text-blue-400/70 mt-0.5 block">
                    {tc("faceDetectionWarning")}
                  </span>
                )}
              </div>
              <div
                role="switch"
                aria-checked={faceDetectionEnabled}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                  faceDetectionEnabled ? "bg-blue-500" : "bg-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    faceDetectionEnabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </div>
            </button>
          </div>
        )}

        {/* Custom keywords */}
        {onAddCustomKeyword && onRemoveCustomKeyword && (
          <CustomKeywordPanel
            keywords={customKeywords}
            onAddKeyword={onAddCustomKeyword}
            onRemoveKeyword={onRemoveCustomKeyword}
            onScan={() => {}}
            hasDocument={false}
            isProcessing={isProcessing}
          />
        )}
      </div>

      {/* Drop area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
          isDragOver
            ? "border-accent bg-accent/5 scale-[1.01]"
            : "border-border hover:border-accent/50 hover:bg-muted/50",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif,image/tiff,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-1">
          {isProcessing ? t("processing") : t("title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("hint")}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <FileText className="h-3 w-3" /> PDF
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <FileText className="h-3 w-3" /> DOCX
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <Image className="h-3 w-3" /> JPG
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <Image className="h-3 w-3" /> PNG
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <Image className="h-3 w-3" /> WebP
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            <Image className="h-3 w-3" /> TIFF
          </span>
        </div>
      </div>

      {/* File list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <FileText className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isProcessing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(i);
                  }}
                  className="p-1 hover:bg-muted rounded cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
