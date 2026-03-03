"use client";

import { cn } from "@/lib/utils";

interface PDFPageThumbnailsProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  redactionCounts: Record<number, number>;
}

export function PDFPageThumbnails({
  totalPages,
  currentPage,
  onPageChange,
  redactionCounts,
}: PDFPageThumbnailsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto p-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const count = redactionCounts[page - 1] || 0;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "relative w-16 h-20 rounded border text-xs font-medium transition-all cursor-pointer flex items-center justify-center",
              currentPage === page
                ? "border-accent bg-accent/10 text-accent"
                : "border-border hover:border-accent/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {page}
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
