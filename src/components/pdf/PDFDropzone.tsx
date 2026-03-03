"use client";

import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
}

export function PDFDropzone({
  onFilesSelected,
  isProcessing,
  selectedFiles,
  onRemoveFile,
}: PDFDropzoneProps) {
  const t = useTranslations("redact.dropzone");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isProcessing) return;

      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf"
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

  return (
    <div className="space-y-4">
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
          accept="application/pdf"
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
