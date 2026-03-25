import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/lib/i18n/config";
import { StructuredData } from "@/components/seo/StructuredData";
import PricingClient from "./PricingClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

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
        locales.map((l) => [l, `/${l}/pricing`])
      ),
    },
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: t("faq.q1"), acceptedAnswer: { "@type": "Answer", text: t("faq.a1") } },
      { "@type": "Question", name: t("faq.q2"), acceptedAnswer: { "@type": "Answer", text: t("faq.a2") } },
      { "@type": "Question", name: t("faq.q3"), acceptedAnswer: { "@type": "Answer", text: t("faq.a3") } },
      { "@type": "Question", name: t("faq.q4"), acceptedAnswer: { "@type": "Answer", text: t("faq.a4") } },
      { "@type": "Question", name: t("faq.q5"), acceptedAnswer: { "@type": "Answer", text: t("faq.a5") } },
    ],
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      <PricingClient />
    </>
  );
}
