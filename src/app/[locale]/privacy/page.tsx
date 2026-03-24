import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const infoItems: string[] = t.raw("infoCollect.items");
  const thirdPartyItems: string[] = t.raw("thirdParty.items");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="prose prose-sm max-w-none space-y-6">
        <p className="text-muted-foreground">{t("lastUpdated")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("intro.heading")}</h2>
        <p>{t("intro.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("noFileUploads.heading")}</h2>
        <p>
          {t.rich("noFileUploads.text", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>

        <h2 className="text-xl font-semibold mt-8">{t("infoCollect.heading")}</h2>
        <p>{t("infoCollect.text")}</p>
        <ul className="list-disc pl-6 space-y-1">
          {infoItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mt-8">{t("cookies.heading")}</h2>
        <p>{t("cookies.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("thirdParty.heading")}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {thirdPartyItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mt-8">{t("dataRetention.heading")}</h2>
        <p>{t("dataRetention.text")}</p>

        <h2 className="text-xl font-semibold mt-8">{t("contact.heading")}</h2>
        <p>{t("contact.text")}</p>
      </div>
    </div>
  );
}
