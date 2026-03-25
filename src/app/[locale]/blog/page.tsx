import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { locales } from "@/lib/i18n/config";

const blogPosts = [
  { slug: "kvkk-pdf-redaction-guide", lang: "tr", date: "2026-03-20" },
  { slug: "cnil-rgpd-caviardage-pdf", lang: "fr", date: "2026-03-18" },
  { slug: "lopdgdd-redaccion-pdf", lang: "es", date: "2026-03-17" },
  { slug: "lgpd-redacao-pdf", lang: "pt", date: "2026-03-16" },
  { slug: "dsgvo-pdf-schwaerzung", lang: "de", date: "2026-03-15" },
  { slug: "appi-pdf-sumikeshi", lang: "ja", date: "2026-03-14" },
  { slug: "pipa-pdf-masking", lang: "ko", date: "2026-03-13" },
  { slug: "pipl-pdf-tumin", lang: "zh", date: "2026-03-12" },
  { slug: "gdpr-italia-oscuramento-pdf", lang: "it", date: "2026-03-11" },
  { slug: "client-side-vs-server-side-redaction", lang: "en", date: "2026-03-10" },
  { slug: "avg-pdf-lakken", lang: "nl", date: "2026-03-09" },
  { slug: "rodo-redakcja-pdf", lang: "pl", date: "2026-03-08" },
  { slug: "dataskydd-pdf-maskering", lang: "sv", date: "2026-03-07" },
  { slug: "pdf-redaction-healthcare-checklist", lang: "en", date: "2026-03-05" },
  { slug: "ccpa-pdf-redaction", lang: "en", date: "2026-02-28" },
  { slug: "hipaa-compliant-pdf-redaction", lang: "en", date: "2026-02-15" },
  { slug: "ediscovery-document-redaction", lang: "en", date: "2026-02-10" },
  { slug: "gdpr-pdf-compliance", lang: "en", date: "2026-02-05" },
];

const blogSlugs = blogPosts.map((post) => post.slug);

const blogDates: Record<string, string> = Object.fromEntries(
  blogPosts.map((post) => [post.slug, post.date])
);

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      type: "website",
      locale,
    },
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/blog`])
      ),
    },
  };
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const locale = await getLocale();

  const sortedPosts = [...blogPosts].sort((a, b) => {
    const aIsLocale = a.lang === locale;
    const bIsLocale = b.lang === locale;
    const aIsEn = a.lang === "en";
    const bIsEn = b.lang === "en";

    if (aIsLocale !== bIsLocale) return aIsLocale ? -1 : 1;
    if (aIsEn !== bIsEn) return aIsEn ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="space-y-8">
        {sortedPosts.map((post) => (
          <article
            key={post.slug}
            className="group border border-border rounded-xl p-6 hover:shadow-md transition-all"
          >
            <Link href={`/blog/${post.slug}`}>
              <p className="text-sm text-muted-foreground mb-2">
                {new Intl.DateTimeFormat(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(new Date(post.date))}
              </p>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                {t(`posts.${post.slug}.title`)}
              </h2>
              <p className="text-muted-foreground">
                {t(`posts.${post.slug}.excerpt`)}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
