import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

const blogSlugs = [
  "hipaa-compliant-pdf-redaction",
  "ediscovery-document-redaction",
  "gdpr-pdf-compliance",
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
