import JSZip from "jszip";

export interface DocxParagraph {
  text: string;
  /** Character offset of this paragraph's text within the full document text */
  charOffset: number;
}

export interface DocxDocumentData {
  fileName: string;
  fileSize: number;
  paragraphs: DocxParagraph[];
  fullText: string;
  arrayBuffer: ArrayBuffer;
}

/**
 * Parse a DOCX file and extract text content.
 * DOCX files are ZIP archives containing XML files.
 * The main document content is in word/document.xml.
 */
export async function parseDocx(
  file: File,
  onProgress?: (progress: number) => void
): Promise<DocxDocumentData> {
  onProgress?.(10);

  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(30);

  const zip = await JSZip.loadAsync(arrayBuffer);
  onProgress?.(50);

  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new Error("Invalid DOCX file: word/document.xml not found");
  }

  const xmlContent = await documentXml.async("string");
  onProgress?.(70);

  const paragraphs = extractParagraphs(xmlContent);
  onProgress?.(90);

  // Build full text
  const fullText = paragraphs.map((p) => p.text).join("\n");

  onProgress?.(100);

  return {
    fileName: file.name,
    fileSize: file.size,
    paragraphs,
    fullText,
    arrayBuffer,
  };
}

/**
 * Extract paragraphs from DOCX XML content.
 * Parses <w:p> elements and their <w:r><w:t> children.
 */
function extractParagraphs(xml: string): DocxParagraph[] {
  const paragraphs: DocxParagraph[] = [];
  let charOffset = 0;

  // Match all <w:p ...>...</w:p> elements (paragraphs)
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[0];

    // Extract text from <w:t> elements within this paragraph
    const textParts: string[] = [];
    const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    let tMatch;

    while ((tMatch = tRegex.exec(pContent)) !== null) {
      textParts.push(decodeXmlEntities(tMatch[1]));
    }

    const text = textParts.join("");

    if (text.length > 0) {
      paragraphs.push({ text, charOffset });
      charOffset += text.length + 1; // +1 for \n separator
    }
    // Empty paragraphs are excluded from fullText, so don't advance charOffset
  }

  return paragraphs;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Get all XML files from the DOCX that may contain text content.
 * Returns the paths of XML files that should be processed for redaction.
 */
export async function getDocxTextXmlPaths(
  arrayBuffer: ArrayBuffer
): Promise<string[]> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const paths: string[] = [];

  // Main document
  if (zip.file("word/document.xml")) {
    paths.push("word/document.xml");
  }

  // Headers and footers
  zip.forEach((relativePath) => {
    if (
      /^word\/(header|footer)\d*\.xml$/.test(relativePath) ||
      relativePath === "word/footnotes.xml" ||
      relativePath === "word/endnotes.xml"
    ) {
      paths.push(relativePath);
    }
  });

  return paths;
}
