"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Undo2 } from "lucide-react";
import type { DocxDocumentData } from "@/lib/docx/parser";
import type { DocxRedactionItem } from "@/hooks/useDocxProcessor";
import { cn } from "@/lib/utils";

interface DocxViewerProps {
  document: DocxDocumentData;
  redactions: DocxRedactionItem[];
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
}

interface TextSegment {
  text: string;
  redaction?: DocxRedactionItem;
}

export function DocxViewer({
  document,
  redactions,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
  onRemoveRedaction,
}: DocxViewerProps) {
  const t = useTranslations("redact.docx");
  const [hoveredRedactionId, setHoveredRedactionId] = useState<string | null>(null);

  // Build segments of text with highlighted redactions
  const segments = useMemo(() => {
    const fullText = document.fullText;
    if (redactions.length === 0) {
      return [{ text: fullText }] as TextSegment[];
    }

    // Sort redactions by start index, then by longer range first
    const sorted = [...redactions].sort(
      (a, b) => a.match.startIndex - b.match.startIndex || b.match.endIndex - a.match.endIndex
    );

    // Merge overlapping ranges so no text leaks between partial overlaps
    const merged: { start: number; end: number; redaction: DocxRedactionItem }[] = [];
    for (const redaction of sorted) {
      const start = redaction.match.startIndex;
      const end = redaction.match.endIndex;
      const last = merged[merged.length - 1];

      if (last && start <= last.end) {
        // Extend the previous range if this one goes further
        if (end > last.end) {
          last.end = end;
        }
      } else {
        merged.push({ start, end, redaction });
      }
    }

    const result: TextSegment[] = [];
    let lastIndex = 0;

    for (const { start, end, redaction } of merged) {
      // Add text before this redaction
      if (start > lastIndex) {
        result.push({ text: fullText.slice(lastIndex, start) });
      }

      // Add the redacted segment
      result.push({
        text: fullText.slice(start, end),
        redaction,
      });

      lastIndex = end;
    }

    // Add remaining text
    if (lastIndex < fullText.length) {
      result.push({ text: fullText.slice(lastIndex) });
    }

    return result;
  }, [document.fullText, redactions]);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full" />
        <span className="text-sm font-medium truncate">{document.fileName}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {(document.fileSize / 1024).toFixed(1)} KB
        </span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-border bg-muted/10 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-amber-300/40 border border-amber-400 rounded-sm" />
          {t("pending")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-black rounded-sm" />
          {t("confirmed")}
        </div>
      </div>

      {/* Document content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto font-serif text-base leading-relaxed whitespace-pre-wrap text-gray-900">
        {segments.map((segment, i) => {
          if (!segment.redaction) {
            return <span key={i}>{segment.text}</span>;
          }

          const r = segment.redaction;
          const isSelected = selectedRedactionId === r.id;
          const isHovered = hoveredRedactionId === r.id;
          const showButtons = isHovered || isSelected;

          if (r.confirmed) {
            // Confirmed: show asterisks with black background
            return (
              <span
                key={i}
                className="relative inline-block group"
                onMouseEnter={() => setHoveredRedactionId(r.id)}
                onMouseLeave={() => setHoveredRedactionId(null)}
              >
                <span
                  className={cn(
                    "bg-black text-white px-0.5 rounded-sm cursor-pointer font-mono text-sm transition-all",
                    isSelected && "ring-2 ring-blue-500 ring-offset-1"
                  )}
                  onClick={() => onSelectRedaction(r.id)}
                  title={r.match.type}
                >
                  {"*".repeat(r.match.value.length)}
                </span>
                {/* Action buttons */}
                <span
                  className={cn(
                    "absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 transition-opacity duration-150",
                    showButtons ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <button
                    className="p-1.5 rounded-md shadow-md bg-amber-500 text-white hover:bg-amber-600 hover:scale-110 active:scale-95 transition-all duration-150"
                    title="Undo"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRedaction(r.id);
                    }}
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                  <button
                    className="p-1.5 rounded-md shadow-md bg-red-500 text-white hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-150"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRedaction(r.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </span>
            );
          }

          // Pending: show highlighted text
          return (
            <span
              key={i}
              className="relative inline-block group"
              onMouseEnter={() => setHoveredRedactionId(r.id)}
              onMouseLeave={() => setHoveredRedactionId(null)}
            >
              <span
                className={cn(
                  "bg-amber-200/50 border-b-2 border-amber-400 cursor-pointer transition-all",
                  isSelected
                    ? "bg-amber-300/70 ring-2 ring-blue-500 ring-offset-1 rounded-sm"
                    : "hover:bg-amber-300/50"
                )}
                onClick={() => onSelectRedaction(r.id)}
                title={r.match.type}
              >
                {segment.text}
              </span>
              {/* Action buttons */}
              <span
                className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 transition-opacity duration-150",
                  showButtons ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <button
                  className="p-1.5 rounded-md shadow-md bg-green-500 text-white hover:bg-green-600 hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-150"
                  title="Approve"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRedaction(r.id);
                  }}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  className="p-1.5 rounded-md shadow-md bg-red-500 text-white hover:bg-red-600 hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-150"
                  title="Reject"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRedaction(r.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
