"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { RedactionArea } from "@/types/pdf";
import type { ImageDocumentData } from "@/types/image";
import { cn } from "@/lib/utils";
import { PenLine, X } from "lucide-react";

const HINT_DISMISSED_KEY = "pdf-draw-hint-dismissed";

interface ImageViewerProps {
  document: ImageDocumentData;
  redactions: RedactionArea[];
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  onManualRedaction: (
    area: Omit<RedactionArea, "id" | "piiType" | "text" | "confirmed">
  ) => void;
}

export function ImageViewer({
  document,
  redactions,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
  onRemoveRedaction,
  onManualRedaction,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgScale, setImgScale] = useState(1);

  // Recalculate scale when image loads or container resizes
  const updateScale = useCallback(() => {
    if (!imgRef.current) return;
    const displayed = imgRef.current.getBoundingClientRect();
    if (document.width > 0) {
      setImgScale(displayed.width / document.width);
    }
  }, [document.width]);

  useEffect(() => {
    const observer = new ResizeObserver(updateScale);
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  const [isOverlay, setIsOverlay] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(HINT_DISMISSED_KEY) === "1";
  });

  const dismissHint = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHintDismissed(true);
    localStorage.setItem(HINT_DISMISSED_KEY, "1");
  }, []);

  // Manual redaction drawing state
  const isDrawing = useRef(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);

  const getImageCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const rect = imgRef.current!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / imgScale,
        y: (e.clientY - rect.top) / imgScale,
      };
    },
    [imgScale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Only start drawing if clicking on the image background (not a redaction box)
      if ((e.target as HTMLElement).dataset.redaction) return;
      e.preventDefault();
      isDrawing.current = true;
      drawStart.current = getImageCoords(e);
      setDrawRect(null);
      onSelectRedaction(null);
    },
    [getImageCoords, onSelectRedaction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || !drawStart.current) return;
      const cur = getImageCoords(e);
      setDrawRect({
        x: Math.min(drawStart.current.x, cur.x),
        y: Math.min(drawStart.current.y, cur.y),
        width: Math.abs(cur.x - drawStart.current.x),
        height: Math.abs(cur.y - drawStart.current.y),
      });
    },
    [getImageCoords]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || !drawStart.current) return;
      isDrawing.current = false;
      const cur = getImageCoords(e);
      const rect = {
        x: Math.min(drawStart.current.x, cur.x),
        y: Math.min(drawStart.current.y, cur.y),
        width: Math.abs(cur.x - drawStart.current.x),
        height: Math.abs(cur.y - drawStart.current.y),
      };
      if (rect.width > 5 && rect.height > 5) {
        onManualRedaction({ pageIndex: 0, ...rect });
      }
      setDrawRect(null);
      drawStart.current = null;
    },
    [getImageCoords, onManualRedaction]
  );

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsOverlay(true)}
      onMouseLeave={() => {
        setIsOverlay(false);
        if (isDrawing.current) {
          isDrawing.current = false;
          setDrawRect(null);
          drawStart.current = null;
        }
      }}
    >
      {/* The image */}
      <img
        ref={imgRef}
        src={document.objectUrl}
        alt={document.fileName}
        onLoad={updateScale}
        className="block max-w-full h-auto"
        draggable={false}
      />

      {/* Redaction overlays */}
      {redactions.map((r) => {
        const isSelected = selectedRedactionId === r.id;
        return (
          <div
            key={r.id}
            data-redaction="true"
            style={{
              position: "absolute",
              left: r.x * imgScale,
              top: r.y * imgScale,
              width: r.width * imgScale,
              height: r.height * imgScale,
              ...(r.blurMode ? { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" } : {}),
            }}
            className={cn(
              "border-2 cursor-pointer transition-colors",
              r.blurMode
                ? (r.confirmed
                    ? "border-blue-500"
                    : "border-blue-400/70 bg-blue-400/15")
                : (r.confirmed
                    ? "bg-black border-black"
                    : "bg-amber-400/30 border-amber-400"),
              isSelected && "ring-2 ring-blue-500 ring-offset-1"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRedaction(isSelected ? null : r.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onToggleRedaction(r.id);
            }}
          />
        );
      })}

      {/* Hover hint */}
      {!hintDismissed && isOverlay && !drawRect && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 bg-neutral-800/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm select-none">
            <PenLine className="w-3.5 h-3.5 text-blue-300 shrink-0 animate-pulse" />
            <span className="whitespace-nowrap">Sürükleyerek manuel sansürle</span>
            <button
              className="ml-1 text-neutral-400 hover:text-white transition-colors"
              title="Kapat"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={dismissHint}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Draw-in-progress rectangle */}
      {drawRect && (
        <div
          style={{
            position: "absolute",
            left: drawRect.x * imgScale,
            top: drawRect.y * imgScale,
            width: drawRect.width * imgScale,
            height: drawRect.height * imgScale,
            pointerEvents: "none",
          }}
          className="border-2 border-dashed border-blue-500 bg-blue-200/20"
        />
      )}
    </div>
  );
}
