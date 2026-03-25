import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { locales } from "@/lib/i18n/config";
import { StructuredData } from "@/components/seo/StructuredData";

const validSlugs = [
  "kvkk-pdf-redaction-guide",
  "cnil-rgpd-caviardage-pdf",
  "lopdgdd-redaccion-pdf",
  "lgpd-redacao-pdf",
  "dsgvo-pdf-schwaerzung",
  "appi-pdf-sumikeshi",
  "pipa-pdf-masking",
  "pipl-pdf-tumin",
  "gdpr-italia-oscuramento-pdf",
  "client-side-vs-server-side-redaction",
  "avg-pdf-lakken",
  "rodo-redakcja-pdf",
  "dataskydd-pdf-maskering",
  "pdf-redaction-healthcare-checklist",
  "ccpa-pdf-redaction",
  "hipaa-compliant-pdf-redaction",
  "ediscovery-document-redaction",
  "gdpr-pdf-compliance",
];

const blogDates: Record<string, string> = {
  "kvkk-pdf-redaction-guide": "2026-03-25",
  "cnil-rgpd-caviardage-pdf": "2026-03-13",
  "lopdgdd-redaccion-pdf": "2026-02-26",
  "lgpd-redacao-pdf": "2026-02-15",
  "dsgvo-pdf-schwaerzung": "2026-02-01",
  "appi-pdf-sumikeshi": "2026-01-19",
  "pipa-pdf-masking": "2026-01-03",
  "pipl-pdf-tumin": "2025-12-22",
  "gdpr-italia-oscuramento-pdf": "2025-12-05",
  "client-side-vs-server-side-redaction": "2025-11-24",
  "avg-pdf-lakken": "2025-11-09",
  "rodo-redakcja-pdf": "2025-10-27",
  "dataskydd-pdf-maskering": "2025-10-09",
  "pdf-redaction-healthcare-checklist": "2025-09-25",
  "ccpa-pdf-redaction": "2025-09-13",
  "hipaa-compliant-pdf-redaction": "2025-08-28",
  "ediscovery-document-redaction": "2025-08-17",
  "gdpr-pdf-compliance": "2025-07-29",
};

type Params = { slug: string; locale: string };

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, locale } = await params;

  if (!validSlugs.includes(slug)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "blog" });
  const title = t(`posts.${slug}.title`);
  const description = t(`posts.${slug}.excerpt`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale,
      publishedTime: blogDates[slug],
    },
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/blog/${slug}`])
      ),
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  if (!validSlugs.includes(slug)) {
    notFound();
  }

  const t = await getTranslations("blog");
  const locale = await getLocale();
  const content: string[] = t.raw(`posts.${slug}.content`);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: t(`posts.${slug}.title`),
    description: t(`posts.${slug}.excerpt`),
    datePublished: blogDates[slug],
    author: { "@type": "Organization", name: "OfflineRedact", url: "https://offlineredact.com" },
    publisher: { "@type": "Organization", name: "OfflineRedact", url: "https://offlineredact.com" },
    mainEntityOfPage: `https://offlineredact.com/${locale}/blog/${slug}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <StructuredData data={blogPostingSchema} />
      <Button asChild variant="ghost" className="mb-8">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>
      </Button>

      <article>
        <p className="text-sm text-muted-foreground mb-4">
          {new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(blogDates[slug]))}
        </p>
        <h1 className="text-3xl font-bold mb-8">
          {t(`posts.${slug}.title`)}
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">{t("cta.title")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("cta.subtitle")}
        </p>
        <Button asChild variant="accent">
          <Link href="/redact">
            {t("cta.button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
