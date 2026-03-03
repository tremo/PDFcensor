import { PDFDocument, PDFName } from "pdf-lib";

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

  // Clear Info dictionary fields
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("OfflineRedact");
  pdfDoc.setCreator("OfflineRedact");

  // Clear creation and modification dates
  const epoch = new Date(0);
  pdfDoc.setCreationDate(epoch);
  pdfDoc.setModificationDate(epoch);

  // Remove XMP metadata stream from the document catalog
  try {
    const catalog = pdfDoc.catalog;
    if (catalog.has(PDFName.of("Metadata"))) {
      catalog.delete(PDFName.of("Metadata"));
    }
  } catch {
    // If XMP removal fails, the Info dictionary is still cleaned
  }

  return pdfDoc.save();
}
