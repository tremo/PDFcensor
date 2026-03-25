"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Tag, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomKeywordPanelProps {
  keywords: string[];
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onScan: () => void;
  hasDocument: boolean;
  isProcessing: boolean;
}

export function CustomKeywordPanel({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  onScan,
  hasDocument,
  isProcessing,
}: CustomKeywordPanelProps) {
  const t = useTranslations("redact.controls");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAddKeyword(trimmed);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, onAddKeyword]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <Tag className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold">{t("customKeywords")}</span>
        {keywords.length > 0 && (
          <span className="ml-auto text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full font-medium">
            {keywords.length}
          </span>
        )}
      </div>

      {/* Hint text */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("customKeywordsHint")}
        </p>
      </div>

      {/* Input area */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("keywordPlaceholder")}
              className={cn(
                "w-full h-9 px-3 pr-8 text-sm rounded-lg border border-border bg-background",
                "placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400",
                "transition-all duration-150"
              )}
              disabled={isProcessing}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!inputValue.trim() || isProcessing}
            className={cn(
              "h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-150",
              inputValue.trim()
                ? "bg-violet-500 text-white hover:bg-violet-600 active:scale-95 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {t("addKeyword")}
          </button>
        </div>
      </div>

      {/* Keyword tags */}
      {keywords.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                  "bg-violet-50 text-violet-700 border border-violet-200",
                  "group transition-all duration-150 hover:bg-violet-100"
                )}
              >
                <span className="max-w-[150px] truncate">{keyword}</span>
                <button
                  onClick={() => onRemoveKeyword(keyword)}
                  className="p-0.5 rounded hover:bg-violet-200 text-violet-400 hover:text-violet-600 transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Re-scan button - shown when document is loaded */}
      {hasDocument && keywords.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={onScan}
            disabled={isProcessing}
            className={cn(
              "w-full h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150",
              "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border border-violet-200",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            <Search className="w-3 h-3" />
            {t("scanKeywords")}
          </button>
        </div>
      )}
    </div>
  );
}
