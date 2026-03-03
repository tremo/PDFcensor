import { PDFDocument } from "pdf-lib";

/**
 * Clean all metadata from a PDF document.
 * Returns new PDF bytes with metadata removed.
 */
export async function cleanPDFMetadata(
  pdfBytes: ArrayBuffer
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  });

  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("PDFcensor");
  pdfDoc.setCreator("PDFcensor");

  return pdfDoc.save();
}
