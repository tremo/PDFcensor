import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SuccessClient from "./SuccessClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: `${t("paymentSuccess")} — OfflineRedact`,
    robots: { index: false, follow: false },
  };
}

export default function SuccessPage() {
  return <SuccessClient />;
}
