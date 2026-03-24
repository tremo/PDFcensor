import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

const validSlugs = [
  "hipaa-compliant-pdf-redaction",
  "ediscovery-document-redaction",
  "gdpr-pdf-compliance",
];

const blogDates: Record<string, string> = {
  "hipaa-compliant-pdf-redaction": "2026-02-15",
  "ediscovery-document-redaction": "2026-02-10",
  "gdpr-pdf-compliance": "2026-02-05",
};

type Params = { slug: string; locale: string };

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  if (!validSlugs.includes(slug)) {
    notFound();
  }

  const t = await getTranslations("blog");
  const locale = await getLocale();
  const content: string[] = t.raw(`posts.${slug}.content`);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
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
        <h1 className="text-3xl font-bold mb-8">{t(`posts.${slug}.title`)}</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">
          {t("cta.title")}
        </h3>
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
