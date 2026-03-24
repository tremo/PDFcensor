import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const baseUrl = "https://offlineredact.com";

const pages = ["", "/redact", "/pricing", "/privacy", "/terms", "/blog"];

const blogSlugs = [
  "kvkk-pdf-redaction-guide",
  "dsgvo-pdf-schwaerzung",
  "client-side-vs-server-side-redaction",
  "pdf-redaction-healthcare-checklist",
  "ccpa-pdf-redaction",
  "hipaa-compliant-pdf-redaction",
  "ediscovery-document-redaction",
  "gdpr-pdf-compliance",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : page === "/redact" ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${page}`])
          ),
        },
      });
    }
  }

  for (const slug of blogSlugs) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/blog/${slug}`])
          ),
        },
      });
    }
  }

  return entries;
}
