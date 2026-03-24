import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

const blogPosts = [
  {
    slug: "kvkk-pdf-redaction-guide",
    title: "KVKK Uyumlu PDF Sansürleme: Kapsamlı Rehber",
    excerpt:
      "Türkiye'deki KVKK düzenlemesine uygun şekilde PDF belgelerindeki kişisel verileri nasıl sansürleyeceğinizi öğrenin.",
    date: "2026-03-20",
  },
  {
    slug: "dsgvo-pdf-schwaerzung",
    title: "DSGVO-konforme PDF-Schwärzung: Vollständiger Leitfaden",
    excerpt:
      "Erfahren Sie, wie Sie personenbezogene Daten in PDF-Dokumenten DSGVO-konform schwärzen und dauerhaft entfernen.",
    date: "2026-03-15",
  },
  {
    slug: "client-side-vs-server-side-redaction",
    title: "Client-Side vs Server-Side PDF Redaction: Security Comparison",
    excerpt:
      "Why processing documents in your browser is more secure than uploading them to a server for redaction.",
    date: "2026-03-10",
  },
  {
    slug: "pdf-redaction-healthcare-checklist",
    title: "PDF Redaction for Healthcare: HIPAA Compliance Checklist",
    excerpt:
      "A practical checklist for healthcare organizations to ensure HIPAA-compliant PDF redaction workflows.",
    date: "2026-03-05",
  },
  {
    slug: "ccpa-pdf-redaction",
    title: "CCPA Compliance: How to Redact Personal Information from PDFs",
    excerpt:
      "Guide for California businesses on redacting consumer personal information from PDF documents under CCPA.",
    date: "2026-02-28",
  },
  {
    slug: "hipaa-compliant-pdf-redaction",
    title: "HIPAA Compliant PDF Redaction: A Complete Guide",
    excerpt:
      "Learn how to properly redact protected health information (PHI) from PDF documents to maintain HIPAA compliance.",
    date: "2026-02-15",
  },
  {
    slug: "ediscovery-document-redaction",
    title: "eDiscovery Document Redaction Best Practices",
    excerpt:
      "Essential guide for legal professionals on redacting sensitive information during the eDiscovery process.",
    date: "2026-02-10",
  },
  {
    slug: "gdpr-pdf-compliance",
    title: "GDPR PDF Compliance: Protecting Personal Data in Documents",
    excerpt:
      "How to ensure your PDF documents comply with GDPR data protection requirements through proper redaction.",
    date: "2026-02-05",
  },
];

const blogDates: Record<string, string> = {
  "hipaa-compliant-pdf-redaction": "2026-02-15",
  "ediscovery-document-redaction": "2026-02-10",
  "gdpr-pdf-compliance": "2026-02-05",
};

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="space-y-8">
        {blogSlugs.map((slug) => (
          <article
            key={slug}
            className="group border border-border rounded-xl p-6 hover:shadow-md transition-all"
          >
            <Link href={`/blog/${slug}`}>
              <p className="text-sm text-muted-foreground mb-2">
                {new Intl.DateTimeFormat(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(new Date(blogDates[slug]))}
              </p>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                {t(`posts.${slug}.title`)}
              </h2>
              <p className="text-muted-foreground">
                {t(`posts.${slug}.excerpt`)}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
