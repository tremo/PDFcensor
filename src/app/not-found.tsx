import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");

  return (
    <html lang={locale}>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold mb-4">{t("code")}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {t("message")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </body>
    </html>
  );
}
