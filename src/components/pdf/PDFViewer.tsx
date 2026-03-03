"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { renderPageToCanvas } from "@/lib/pdf/parser";
import type { RedactionArea } from "@/types/pdf";
import { cn } from "@/lib/utils";
import { X, Check, XIcon } from "lucide-react";

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

  // Only show confirmed redactions on the PDF
  const pageRedactions = redactions.filter(
    (r) => r.pageIndex === currentPage - 1 && r.confirmed
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
      if (e.button !== 0) return;
      const pos = getRelativePos(e);

      if (drawMode && onManualRedaction) {
        setInteraction({ type: "drawing", startX: pos.x, startY: pos.y });
        setDrawCurrent(pos);
        onSelectRedaction(null);
        return;
      }

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
    [interaction, getRelativePos, onUpdateRedaction]
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
        className={cn("absolute inset-0", drawMode && "cursor-crosshair")}
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {pageRedactions.map((r) => {
          const selected = isSelected(r.id);
          const w = r.width * scale;
          const h = r.height * scale;

          return (
            <div
              key={r.id}
              className={cn(
                "absolute group",
                selected && "z-10",
                interaction.type === "none" && !drawMode && "cursor-move"
              )}
              style={{
                left: r.x * scale,
                top: r.y * scale,
                width: w,
                height: h,
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
              {/* Solid black fill - the actual censorship look */}
              <div className="absolute inset-0 bg-black rounded-[1px]" />

              {/* Selection border */}
              {selected && (
                <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-1 rounded-[1px]" />
              )}

              {/* Corner resize triangles - always visible as subtle hint */}
              {!drawMode && (
                <>
                  {/* Bottom-right corner triangle */}
                  <div className="absolute bottom-0 right-0 w-0 h-0 pointer-events-none opacity-60"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderBottom: "6px solid white",
                    }}
                  />
                  {/* Top-left corner triangle */}
                  <div className="absolute top-0 left-0 w-0 h-0 pointer-events-none opacity-60"
                    style={{
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid white",
                    }}
                  />
                </>
              )}

              {/* Always-visible action buttons */}
              {!drawMode && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-20">
                  <button
                    className="p-1 rounded shadow bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Reject"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRedaction(r.id);
                    }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  <button
                    className="p-1 rounded shadow bg-white/90 text-red-500 hover:bg-white transition-colors border border-red-200"
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

              {/* Resize handles - visible when selected */}
              {selected &&
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
          );
        })}

        {/* Drawing preview rectangle */}
        {interaction.type === "drawing" && drawCurrent && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left: Math.min(interaction.startX, drawCurrent.x) * scale,
              top: Math.min(interaction.startY, drawCurrent.y) * scale,
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
