import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

/**
 * Add a watermark to each page of a PDF.
 * Used for free tier output.
 */
export async function addWatermark(
  pdfBytes: Uint8Array,
  text: string = "PDFcensor Free — pdfcensor.com"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    // Bottom-right corner watermark
    page.drawText(text, {
      x: width - textWidth - 10,
      y: 10,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.5,
    });

    // Diagonal center watermark (subtle)
    const diagonalFontSize = 24;
    const angle = Math.atan(height / width) * (180 / Math.PI);
    page.drawText(text, {
      x: width * 0.15,
      y: height * 0.4,
      size: diagonalFontSize,
      font,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.15,
      rotate: degrees(angle),
    });
  }

  return pdfDoc.save();
}
