"use client";

import { useEffect, useRef, useState } from "react";
import { renderPageToCanvas } from "@/lib/pdf/parser";
import type { RedactionArea } from "@/types/pdf";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
  arrayBuffer: ArrayBuffer | null;
  currentPage: number;
  totalPages: number;
  redactions: RedactionArea[];
  scale: number;
  onToggleRedaction: (id: string) => void;
  onManualRedaction?: (area: Omit<RedactionArea, "id" | "piiType" | "text" | "confirmed">) => void;
}

export function PDFViewer({
  arrayBuffer,
  currentPage,
  redactions,
  scale,
  onToggleRedaction,
  onManualRedaction,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Render the page
  useEffect(() => {
    if (!arrayBuffer || !canvasRef.current) return;

    renderPageToCanvas(arrayBuffer, currentPage, canvasRef.current, scale).then(
      (dims) => setDimensions(dims)
    );
  }, [arrayBuffer, currentPage, scale]);

  const pageRedactions = redactions.filter(
    (r) => r.pageIndex === currentPage - 1
  );

  // Manual drawing handlers
  const getRelativePos = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onManualRedaction) return;
    const pos = getRelativePos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setDrawCurrent(getRelativePos(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent || !onManualRedaction) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    if (width > 5 && height > 5) {
      onManualRedaction({
        pageIndex: currentPage - 1,
        x,
        y,
        width,
        height,
        isManual: true,
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  if (!arrayBuffer) return null;

  return (
    <div className="relative inline-block border border-border rounded-lg overflow-hidden shadow-sm">
      <canvas ref={canvasRef} className="block" />

      {/* Redaction overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {pageRedactions.map((r) => (
          <div
            key={r.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggleRedaction(r.id);
            }}
            className={cn(
              "absolute border-2 cursor-pointer transition-colors",
              r.confirmed
                ? "bg-red-500/30 border-red-500 hover:bg-red-500/40"
                : "bg-yellow-500/20 border-yellow-400 hover:bg-yellow-500/30"
            )}
            style={{
              left: r.x * scale,
              top: r.y * scale,
              width: r.width * scale,
              height: r.height * scale,
            }}
            title={`${r.piiType}: ${r.text}`}
          />
        ))}

        {/* Drawing rectangle */}
        {isDrawing && drawStart && drawCurrent && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20"
            style={{
              left: Math.min(drawStart.x, drawCurrent.x) * scale,
              top: Math.min(drawStart.y, drawCurrent.y) * scale,
              width: Math.abs(drawCurrent.x - drawStart.x) * scale,
              height: Math.abs(drawCurrent.y - drawStart.y) * scale,
            }}
          />
        )}
      </div>
    </div>
  );
}
