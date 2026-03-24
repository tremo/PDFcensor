"use client";

import { useTranslations } from "next-intl";
import { MousePointer2, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawModeToolbarProps {
  isDrawMode: boolean;
  onToggle: () => void;
}

export function DrawModeToolbar({ isDrawMode, onToggle }: DrawModeToolbarProps) {
  const t = useTranslations("redact.controls");

  return (
    <div className="flex items-center gap-2">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
          isDrawMode
            ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
            : "bg-muted/50 text-muted-foreground border-border hover:border-blue-300 hover:bg-blue-50"
        )}
      >
        {isDrawMode ? (
          <>
            <PenTool className="w-4 h-4" />
            <span>{t("drawModeOn")}</span>
          </>
        ) : (
          <>
            <MousePointer2 className="w-4 h-4" />
            <span>{t("drawModeOff")}</span>
          </>
        )}
      </button>

      {/* Hint text */}
      <p className="text-[11px] text-muted-foreground leading-tight flex-1">
        {isDrawMode ? t("drawModeHint") : t("selectModeHint")}
      </p>
    </div>
  );
}
