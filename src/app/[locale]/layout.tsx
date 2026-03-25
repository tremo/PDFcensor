import type { Metadata } from "next";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { StructuredData, getWebApplicationSchema, getOrganizationSchema } from "@/components/seo/StructuredData";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
    },
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`])
      ),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <StructuredData data={getWebApplicationSchema(locale)} />
        <StructuredData data={getOrganizationSchema()} />
      </head>
      <GoogleTagManager gtmId="GTM-K4678NT5" />
      <GoogleAnalytics gaId="AW-18041459351" />
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
