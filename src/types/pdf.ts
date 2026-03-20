export interface PDFTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  fontName?: string;
  transform: number[];
  /** Character offset of this item's text within the page's fullText string */
  charOffset: number;
}

export interface PDFPageData {
  pageIndex: number;
  width: number;
  height: number;
  textItems: PDFTextItem[];
  fullText: string;
}

export interface PDFDocumentData {
  fileName: string;
  totalPages: number;
  pages: PDFPageData[];
  fileSize: number;
  /** Original File reference for lazy ArrayBuffer loading */
  file: File;
  /**
   * Cached ArrayBuffer — only loaded on demand via getDocumentArrayBuffer().
   * After redaction, set to null to free memory.
   */
  arrayBuffer: ArrayBuffer | null;
}

export interface RedactionArea {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  piiType: string;
  isManual?: boolean;
  confirmed: boolean;
}

export type ProcessingStatus =
  | "idle"
  | "loading"
  | "parsing"
  | "scanning"
  | "ocr-scanning"
  | "previewing"
  | "redacting"
  | "done"
  | "error";

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  message: string;
  documents: PDFDocumentData[];
  currentDocIndex: number;
  redactions: RedactionArea[];
  redactedPdfBytes: Uint8Array | null;
  error: string | null;
}
