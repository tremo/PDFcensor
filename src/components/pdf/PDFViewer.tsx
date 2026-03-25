"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { renderPageToCanvas, openPDFProxy } from "@/lib/pdf/parser";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { RedactionArea } from "@/types/pdf";
import { cn } from "@/lib/utils";
import { X, Check, Undo2, PenLine } from "lucide-react";

const HINT_DISMISSED_KEY = "pdf-draw-hint-dismissed";

interface PDFViewerProps {
  /** File reference for lazy PDF loading — preferred over arrayBuffer */
  file?: File | null;
  /** @deprecated Use `file` prop instead. Kept for backward compatibility. */
  arrayBuffer?: ArrayBuffer | null;
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
const RESIZE_HANDLES = ["nw", "ne", "sw", "se"] as const;
const HANDLE_CURSOR_MAP: Record<string, string> = {
  nw: "nw-resize",
  ne: "ne-resize",
  sw: "sw-resize",
  se: "se-resize",
};

function getHandleCursor(handle: string): string {
  return HANDLE_CURSOR_MAP[handle] || "pointer";
}

export function PDFViewer({
  file,
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
  const [hoveredRedactionId, setHoveredRedactionId] = useState<string | null>(
    null
  );
  const [isOverlay, setIsOverlay] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(HINT_DISMISSED_KEY) === "1";
  });

  // Cache PDFDocumentProxy so we don't re-parse the PDF on every page change
  const pdfProxyRef = useRef<PDFDocumentProxy | null>(null);
  const pdfFileRef = useRef<File | null>(null);

  // Clean up cached proxy on unmount
  useEffect(() => {
    return () => {
      pdfProxyRef.current?.destroy();
      pdfProxyRef.current = null;
    };
  }, []);

  // Render the page using cached PDFDocumentProxy (from File) or fallback to ArrayBuffer
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!file && !arrayBuffer) return;

    const abortController = new AbortController();

    const render = async () => {
      if (abortController.signal.aborted) return;

      let source: PDFDocumentProxy | ArrayBuffer;

      if (file) {
        // Use cached proxy if same file, otherwise create new one
        if (pdfFileRef.current !== file) {
          pdfProxyRef.current?.destroy();
          pdfProxyRef.current = await openPDFProxy(file);
          pdfFileRef.current = file;
        }
        source = pdfProxyRef.current!;
      } else {
        source = arrayBuffer!;
      }

      if (abortController.signal.aborted) return;

      const dims = await renderPageToCanvas(
        source,
        currentPage,
        canvasRef.current!,
        scale,
        abortController.signal
      );
      setDimensions(dims);
    };

    render().catch((err) => {
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
  }, [file, arrayBuffer, currentPage, scale]);

  // Show all redactions on current page (both approved and pending)
  const pageRedactions = useMemo(
    () => redactions.filter((r) => r.pageIndex === currentPage - 1),
    [redactions, currentPage]
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

      if (onManualRedaction) {
        setInteraction({ type: "drawing", startX: pos.x, startY: pos.y });
        setDrawCurrent(pos);
        onSelectRedaction(null);
        return;
      }

      onSelectRedaction(null);
    },
    [onManualRedaction, getRelativePos, onSelectRedaction]
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
    if (interaction.type === "drawing" && drawCurrent && onManualRedaction) {
      const startX = interaction.startX;
      const startY = interaction.startY;
      const width = Math.abs(drawCurrent.x - startX);
      const height = Math.abs(drawCurrent.y - startY);

      if (width > 5 && height > 5) {
        // Drag: create custom-sized redaction
        const x = Math.min(startX, drawCurrent.x);
        const y = Math.min(startY, drawCurrent.y);
        onManualRedaction({
          pageIndex: currentPage - 1,
          x,
          y,
          width,
          height,
          isManual: true,
        });
      } else {
        // Click: create default-sized redaction centered on click point
        const defaultW = 100;
        const defaultH = 24;
        onManualRedaction({
          pageIndex: currentPage - 1,
          x: Math.max(0, startX - defaultW / 2),
          y: Math.max(0, startY - defaultH / 2),
          width: defaultW,
          height: defaultH,
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

  const dismissHint = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHintDismissed(true);
    localStorage.setItem(HINT_DISMISSED_KEY, "1");
  }, []);

  if (!file && !arrayBuffer) return null;

  const isSelected = (id: string) => selectedRedactionId === id;

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
        className="absolute inset-0 cursor-crosshair"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setIsOverlay(false); }}
        onMouseEnter={() => setIsOverlay(true)}
      >
        {pageRedactions.map((r) => {
          const selected = isSelected(r.id);
          const hovered = hoveredRedactionId === r.id;
          const w = r.width * scale;
          const h = r.height * scale;

          return (
            <div
              key={r.id}
              className={cn(
                "absolute group",
                (selected || hovered) && "z-10",
                interaction.type === "none" && "cursor-move"
              )}
              style={{
                left: r.x * scale,
                top: r.y * scale,
                width: w,
                height: h,
              }}
              onMouseEnter={() => setHoveredRedactionId(r.id)}
              onMouseLeave={() => setHoveredRedactionId(null)}
              onMouseDown={(e) => startMove(e, r)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRedaction(r.id);
              }}
            >
              {r.confirmed ? (
                <>
                  {/* Approved: solid black fill */}
                  <div className="absolute inset-0 bg-black rounded-[1px]" />
                  {/* Corner resize triangles */}
                  <div
                    className="absolute bottom-0 right-0 w-0 h-0 pointer-events-none opacity-60"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderBottom: "6px solid white",
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 w-0 h-0 pointer-events-none opacity-60"
                    style={{
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid white",
                    }}
                  />
                </>
              ) : (
                /* Pending review: transparent highlight showing text underneath */
                <div
                  className={cn(
                    "absolute inset-0 rounded-[1px] border-2 transition-all duration-150",
                    hovered || selected
                      ? "bg-amber-400/35 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                      : "bg-amber-300/20 border-amber-400/70"
                  )}
                />
              )}

              {/* Selection ring */}
              {selected && (
                <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-1 rounded-[1px]" />
              )}

              {/* Text tooltip on hover - helps identify overlapping items */}
              {(hovered || selected) && r.text && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <span className="inline-block text-[10px] leading-tight bg-neutral-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap max-w-[200px] truncate">
                    {r.text}
                  </span>
                </div>
              )}

              {/* Action buttons - appear on hover */}
              {(
                <div
                  className={cn(
                    "absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 transition-opacity duration-150",
                    hovered || selected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {r.confirmed ? (
                    <>
                      <button
                        className="p-1.5 rounded-md shadow-md bg-amber-500 text-white hover:bg-amber-600 hover:scale-110 active:scale-95 transition-all duration-150"
                        title="Undo"
                        onMouseDown={(e) => e.stopPropagation()}
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
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRedaction(r.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="p-1.5 rounded-md shadow-md bg-green-500 text-white hover:bg-green-600 hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-150"
                        title="Approve"
                        onMouseDown={(e) => e.stopPropagation()}
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
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRedaction(r.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Resize handles - visible when selected */}
              {selected &&
                RESIZE_HANDLES.map((handle) => {
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

        {/* Hover hint — appears on first hover, dismissable */}
        {onManualRedaction && !hintDismissed && isOverlay && interaction.type === "none" && (
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
      </div>
    </div>
  );
}
