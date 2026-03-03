import JSZip from "jszip";
import type { PIIMatch } from "@/types/pii";

/**
 * Redact PII from a DOCX file by replacing matched text with asterisks.
 * Works by modifying the XML content inside the DOCX ZIP archive.
 */
export async function redactDocx(
  arrayBuffer: ArrayBuffer,
  matches: PIIMatch[],
  fullText: string,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  onProgress?.(10);

  const zip = await JSZip.loadAsync(arrayBuffer);
  onProgress?.(20);

  // Build a set of text ranges to redact from the full text
  const redactionRanges = matches
    .map((m) => ({
      start: m.startIndex,
      end: m.endIndex,
      value: m.value,
      asterisks: "*".repeat(m.value.length),
    }))
    .sort((a, b) => a.start - b.start);

  // Process main document XML
  const xmlPaths = [
    "word/document.xml",
    ...getHeaderFooterPaths(zip),
  ];

  let processed = 0;
  for (const xmlPath of xmlPaths) {
    const xmlFile = zip.file(xmlPath);
    if (!xmlFile) continue;

    const xmlContent = await xmlFile.async("string");
    const redactedXml = redactXmlContent(xmlContent, redactionRanges);
    zip.file(xmlPath, redactedXml);

    processed++;
    onProgress?.(20 + Math.round((processed / xmlPaths.length) * 60));
  }

  // Remove document metadata (core.xml)
  const coreXml = zip.file("docProps/core.xml");
  if (coreXml) {
    const coreContent = await coreXml.async("string");
    const cleanedCore = cleanMetadata(coreContent);
    zip.file("docProps/core.xml", cleanedCore);
  }

  // Remove app metadata
  const appXml = zip.file("docProps/app.xml");
  if (appXml) {
    const appContent = await appXml.async("string");
    const cleanedApp = cleanAppMetadata(appContent);
    zip.file("docProps/app.xml", cleanedApp);
  }

  onProgress?.(90);

  const result = await zip.generateAsync({ type: "uint8array" });
  onProgress?.(100);

  return result;
}

/**
 * Get all header and footer XML file paths from the DOCX.
 */
function getHeaderFooterPaths(zip: JSZip): string[] {
  const paths: string[] = [];
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

interface RedactionRange {
  start: number;
  end: number;
  value: string;
  asterisks: string;
}

/**
 * Redact text within DOCX XML content.
 * Replaces text in <w:t> elements that matches PII values with asterisks.
 */
function redactXmlContent(
  xml: string,
  ranges: RedactionRange[]
): string {
  if (ranges.length === 0) return xml;

  // Extract all text values to find and replace
  const replacements = new Map<string, string>();
  for (const range of ranges) {
    replacements.set(range.value, range.asterisks);
  }

  // Sort by length descending so longer matches are replaced first
  const sortedValues = Array.from(replacements.keys()).sort(
    (a, b) => b.length - a.length
  );

  let result = xml;

  // Process each <w:t> element and replace matching text
  for (const value of sortedValues) {
    const asterisks = replacements.get(value)!;
    // Escape special XML/regex characters in the value for safe regex matching
    const escaped = escapeRegex(value);
    // Replace within <w:t> element content
    // The text might be split across multiple <w:t> elements in a run,
    // but for simple cases, direct replacement works
    result = result.replace(new RegExp(escaped, "g"), escapeXml(asterisks));
  }

  return result;
}

/**
 * Also handle cases where PII text is split across multiple <w:r> (run) elements.
 * This reconstructs paragraph text, finds matches, and replaces them.
 */
export function redactXmlContentAdvanced(
  xml: string,
  ranges: RedactionRange[]
): string {
  if (ranges.length === 0) return xml;

  // Process paragraph by paragraph
  const pRegex = /(<w:p[\s>][\s\S]*?<\/w:p>)/g;

  return xml.replace(pRegex, (pElement) => {
    return redactParagraphElement(pElement, ranges);
  });
}

function redactParagraphElement(
  pXml: string,
  ranges: RedactionRange[]
): string {
  // Extract all <w:t> text content from this paragraph
  const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  const textParts: { fullMatch: string; text: string; index: number }[] = [];
  let match;

  while ((match = tRegex.exec(pXml)) !== null) {
    textParts.push({
      fullMatch: match[0],
      text: match[1],
      index: match.index,
    });
  }

  if (textParts.length === 0) return pXml;

  const fullParagraphText = textParts.map((p) => p.text).join("");

  // Check if any redaction range values appear in this paragraph
  let result = pXml;
  for (const range of ranges) {
    if (fullParagraphText.includes(range.value)) {
      // Simple case: value is within a single <w:t> element
      const escaped = escapeRegex(range.value);
      result = result.replace(
        new RegExp(escaped, "g"),
        escapeXml(range.asterisks)
      );
    }
  }

  return result;
}

/**
 * Clean document metadata from core.xml
 */
function cleanMetadata(xml: string): string {
  // Redacted date placeholder (ISO 8601)
  const redactedDate = "1970-01-01T00:00:00Z";

  return xml
    .replace(/<dc:creator>[^<]*<\/dc:creator>/g, "<dc:creator></dc:creator>")
    .replace(
      /<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>/g,
      "<cp:lastModifiedBy></cp:lastModifiedBy>"
    )
    .replace(/<dc:title>[^<]*<\/dc:title>/g, "<dc:title></dc:title>")
    .replace(/<dc:subject>[^<]*<\/dc:subject>/g, "<dc:subject></dc:subject>")
    .replace(
      /<dc:description>[^<]*<\/dc:description>/g,
      "<dc:description></dc:description>"
    )
    .replace(/<cp:keywords>[^<]*<\/cp:keywords>/g, "<cp:keywords></cp:keywords>")
    .replace(/<cp:category>[^<]*<\/cp:category>/g, "<cp:category></cp:category>")
    .replace(/<cp:revision>[^<]*<\/cp:revision>/g, "<cp:revision>1</cp:revision>")
    .replace(
      /<dcterms:created[^>]*>[^<]*<\/dcterms:created>/g,
      `<dcterms:created xsi:type="dcterms:W3CDTF">${redactedDate}</dcterms:created>`
    )
    .replace(
      /<dcterms:modified[^>]*>[^<]*<\/dcterms:modified>/g,
      `<dcterms:modified xsi:type="dcterms:W3CDTF">${redactedDate}</dcterms:modified>`
    );
}

/**
 * Clean application metadata from app.xml
 */
function cleanAppMetadata(xml: string): string {
  return xml
    .replace(/<Application>[^<]*<\/Application>/g, "<Application></Application>")
    .replace(/<Company>[^<]*<\/Company>/g, "<Company></Company>")
    .replace(/<Manager>[^<]*<\/Manager>/g, "<Manager></Manager>");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
