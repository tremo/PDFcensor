"use client";

import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { regulations } from "@/lib/pii/regulations";
import type { RegulationType, PIIType } from "@/types/pii";

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  regulation: RegulationType;
  onRegulationChange: (r: RegulationType) => void;
  enabledTypes: PIIType[];
  onToggleType: (type: PIIType) => void;
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
      ];
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => ACCEPTED_TYPES.includes(f.type) || f.name.endsWith(".docx")
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
                    ? "bg-foreground text-background border-foreground font-medium"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30"
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
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                )}
              >
                {tp(type)}
              </button>
            ))}
          </div>
        </div>
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
          accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-1">
          {isProcessing ? t("processing") : t("title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
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
