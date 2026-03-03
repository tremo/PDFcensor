"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { renderPageToCanvas } from "@/lib/pdf/parser";
import type { RedactionArea } from "@/types/pdf";
import { cn } from "@/lib/utils";
import { X, Move, Check, XIcon } from "lucide-react";

interface PDFViewerProps {
  arrayBuffer: ArrayBuffer | null;
  currentPage: number;
  totalPages: number;
  redactions: RedactionArea[];
  scale: number;
  selectedRedactionId: string | null;
  onSelectRedaction: (id: string | null) => void;
  onToggleRedaction: (id: string) => void;
  onRemoveRedaction: (id: string) => void;
  onUpdateRedaction: (
    id: string,
    updates: Partial<Pick<RedactionArea, "x" | "y" | "width" | "height">>
  ) => void;
  onManualRedaction?: (
    area: Omit<RedactionArea, "id" | "piiType" | "text" | "confirmed">
  ) => void;
  drawMode: boolean;
}

type InteractionMode =
  | { type: "none" }
  | { type: "drawing"; startX: number; startY: number }
  | { type: "moving"; id: string; offsetX: number; offsetY: number }
  | {
      type: "resizing";
      id: string;
      handle: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
    };

const HANDLE_SIZE = 8;
const MIN_SIZE = 10;

export function PDFViewer({
  arrayBuffer,
  currentPage,
  redactions,
  scale,
  selectedRedactionId,
  onSelectRedaction,
  onToggleRedaction,
  onRemoveRedaction,
  onUpdateRedaction,
  onManualRedaction,
  drawMode,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [interaction, setInteraction] = useState<InteractionMode>({
    type: "none",
  });
  const [drawCurrent, setDrawCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Render the page
  useEffect(() => {
    if (!arrayBuffer || !canvasRef.current) return;

    const abortController = new AbortController();

    renderPageToCanvas(
      arrayBuffer,
      currentPage,
      canvasRef.current,
      scale,
      abortController.signal
    )
      .then((dims) => setDimensions(dims))
      .catch((err) => {
        if (
          err?.name === "RenderingCancelledException" ||
          err?.name === "AbortError"
        )
          return;
        console.error("PDF render error:", err);
      });

    return () => {
      abortController.abort();
    };
  }, [arrayBuffer, currentPage, scale]);

  const pageRedactions = redactions.filter(
    (r) => r.pageIndex === currentPage - 1
  );

  const getRelativePos = useCallback(
    (e: React.MouseEvent) => {
      const rect = overlayRef.current!.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      const pos = getRelativePos(e);

      if (drawMode && onManualRedaction) {
        setInteraction({ type: "drawing", startX: pos.x, startY: pos.y });
        setDrawCurrent(pos);
        onSelectRedaction(null);
        return;
      }

      // If clicking on empty area, deselect
      onSelectRedaction(null);
    },
    [drawMode, onManualRedaction, getRelativePos, onSelectRedaction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (interaction.type === "none") return;
      const pos = getRelativePos(e);

      if (interaction.type === "drawing") {
        setDrawCurrent(pos);
        return;
      }

      if (interaction.type === "moving") {
        const r = redactions.find((r) => r.id === interaction.id);
        if (!r) return;
        onUpdateRedaction(interaction.id, {
          x: Math.max(0, pos.x - interaction.offsetX),
          y: Math.max(0, pos.y - interaction.offsetY),
        });
        return;
      }

      if (interaction.type === "resizing") {
        const { handle, startX, startY, origX, origY, origW, origH } =
          interaction;
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        if (handle.includes("w")) {
          newX = origX + dx;
          newW = origW - dx;
        }
        if (handle.includes("e")) {
          newW = origW + dx;
        }
        if (handle.includes("n")) {
          newY = origY + dy;
          newH = origH - dy;
        }
        if (handle.includes("s")) {
          newH = origH + dy;
        }

        // Enforce minimum size
        if (newW < MIN_SIZE) {
          if (handle.includes("w")) newX = origX + origW - MIN_SIZE;
          newW = MIN_SIZE;
        }
        if (newH < MIN_SIZE) {
          if (handle.includes("n")) newY = origY + origH - MIN_SIZE;
          newH = MIN_SIZE;
        }

        onUpdateRedaction(interaction.id, {
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: newW,
          height: newH,
        });
      }
    },
    [interaction, getRelativePos, onUpdateRedaction, redactions]
  );

  const handleMouseUp = useCallback(() => {
    if (interaction.type === "drawing" && drawCurrent) {
      const startX = interaction.startX;
      const startY = interaction.startY;
      const x = Math.min(startX, drawCurrent.x);
      const y = Math.min(startY, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - startX);
      const height = Math.abs(drawCurrent.y - startY);

      if (width > 5 && height > 5 && onManualRedaction) {
        onManualRedaction({
          pageIndex: currentPage - 1,
          x,
          y,
          width,
          height,
          isManual: true,
        });
      }
    }
    setInteraction({ type: "none" });
    setDrawCurrent(null);
  }, [interaction, drawCurrent, onManualRedaction, currentPage]);

  const startMove = useCallback(
    (e: React.MouseEvent, r: RedactionArea) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = getRelativePos(e);
      setInteraction({
        type: "moving",
        id: r.id,
        offsetX: pos.x - r.x,
        offsetY: pos.y - r.y,
      });
      onSelectRedaction(r.id);
    },
    [getRelativePos, onSelectRedaction]
  );

  const startResize = useCallback(
    (e: React.MouseEvent, r: RedactionArea, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = getRelativePos(e);
      setInteraction({
        type: "resizing",
        id: r.id,
        handle,
        startX: pos.x,
        startY: pos.y,
        origX: r.x,
        origY: r.y,
        origW: r.width,
        origH: r.height,
      });
    },
    [getRelativePos]
  );

  if (!arrayBuffer) return null;

  const isSelected = (id: string) => selectedRedactionId === id;

  const resizeHandles = ["nw", "ne", "sw", "se"];

  const getHandleCursor = (handle: string) => {
    const map: Record<string, string> = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
    };
    return map[handle] || "pointer";
  };

  const getHandlePosition = (
    handle: string,
    r: RedactionArea
  ): { left: number; top: number } => {
    const w = r.width * scale;
    const h = r.height * scale;
    const half = HANDLE_SIZE / 2;

    switch (handle) {
      case "nw":
        return { left: -half, top: -half };
      case "ne":
        return { left: w - half, top: -half };
      case "sw":
        return { left: -half, top: h - half };
      case "se":
        return { left: w - half, top: h - half };
      default:
        return { left: 0, top: 0 };
    }
  };

  return (
    <div className="relative inline-block border border-border rounded-lg overflow-hidden shadow-sm">
      <canvas ref={canvasRef} className="block" />

      {/* Redaction overlay */}
      <div
        ref={overlayRef}
        className={cn(
          "absolute inset-0",
          drawMode && "cursor-crosshair"
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {pageRedactions.map((r) => (
          <div
            key={r.id}
            className={cn(
              "absolute border-2 group",
              r.confirmed
                ? "bg-red-500/30 border-red-500"
                : "bg-yellow-400/20 border-yellow-400 border-dashed",
              isSelected(r.id) && "ring-2 ring-blue-500 ring-offset-1",
              interaction.type === "none" && !drawMode && "cursor-move"
            )}
            style={{
              left: r.x * scale,
              top: r.y * scale,
              width: r.width * scale,
              height: r.height * scale,
            }}
            onMouseDown={(e) => {
              if (drawMode) return;
              startMove(e, r);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (drawMode) return;
              onSelectRedaction(r.id);
            }}
          >
            {/* Inline action buttons - visible on hover or selection */}
            {!drawMode && (
              <div
                className={cn(
                  "absolute -top-8 left-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                  isSelected(r.id) && "opacity-100"
                )}
              >
                <button
                  className={cn(
                    "p-1 rounded shadow-sm border text-xs",
                    r.confirmed
                      ? "bg-green-600 text-white border-green-700"
                      : "bg-white text-green-600 border-green-300 hover:bg-green-50"
                  )}
                  title={r.confirmed ? "Confirmed" : "Confirm"}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!r.confirmed) onToggleRedaction(r.id);
                  }}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  className={cn(
                    "p-1 rounded shadow-sm border text-xs",
                    !r.confirmed
                      ? "bg-orange-500 text-white border-orange-600"
                      : "bg-white text-orange-500 border-orange-300 hover:bg-orange-50"
                  )}
                  title={!r.confirmed ? "Rejected" : "Reject"}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (r.confirmed) onToggleRedaction(r.id);
                  }}
                >
                  <XIcon className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded shadow-sm bg-white text-red-500 border border-red-300 hover:bg-red-50 text-xs"
                  title="Delete"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRedaction(r.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* PII type label inside box */}
            {r.width * scale > 40 && r.height * scale > 16 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-black/60 pointer-events-none select-none truncate px-1">
                {r.piiType !== "manual" ? r.piiType : ""}
              </span>
            )}

            {/* Resize handles - visible when selected */}
            {isSelected(r.id) &&
              !drawMode &&
              resizeHandles.map((handle) => {
                const pos = getHandlePosition(handle, r);
                return (
                  <div
                    key={handle}
                    className="absolute bg-blue-500 border border-white rounded-sm z-20"
                    style={{
                      width: HANDLE_SIZE,
                      height: HANDLE_SIZE,
                      left: pos.left,
                      top: pos.top,
                      cursor: getHandleCursor(handle),
                    }}
                    onMouseDown={(e) => startResize(e, r, handle)}
                  />
                );
              })}
          </div>
        ))}

        {/* Drawing preview rectangle */}
        {interaction.type === "drawing" && drawCurrent && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left:
                Math.min(interaction.startX, drawCurrent.x) * scale,
              top:
                Math.min(interaction.startY, drawCurrent.y) * scale,
              width:
                Math.abs(drawCurrent.x - interaction.startX) * scale,
              height:
                Math.abs(drawCurrent.y - interaction.startY) * scale,
            }}
          />
        )}
      </div>
    </div>
  );
}
