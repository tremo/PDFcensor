import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("terms");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="prose prose-sm max-w-none space-y-6">
        <p className="text-muted-foreground">{t("lastUpdated")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("acceptance.heading")}</h2>
        <p>{t("acceptance.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("serviceDesc.heading")}</h2>
        <p>{t("serviceDesc.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("noGuarantee.heading")}</h2>
        <p>{t("noGuarantee.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("license.heading")}</h2>
        <p>{t("license.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("refundPolicy.heading")}</h2>
        <p>{t("refundPolicy.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("liability.heading")}</h2>
        <p>{t("liability.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("contact.heading")}</h2>
        <p>{t("contact.text")}</p>
      </div>
    </div>
  );
}
