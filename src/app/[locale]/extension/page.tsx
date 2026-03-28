import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/lib/i18n/config";
import ExtensionClient from "./ExtensionClient";
import { PlatformIcon } from "@/components/landing/PlatformIcon";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "extensionPage" });

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
        locales.map((l) => [l, `/${l}/extension`])
      ),
    },
  };
}

export default async function ExtensionPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "extensionPage" });

  const platforms = [
    { name: "ChatGPT", desc: t("platforms.chatgpt"), bg: "bg-[#10a37f]/10", text: "text-[#10a37f]" },
    { name: "Claude", desc: t("platforms.claude"), bg: "bg-[#d97706]/10", text: "text-[#d97706]" },
    { name: "Gemini", desc: t("platforms.gemini"), bg: "bg-[#4285f4]/10", text: "text-[#4285f4]" },
    { name: "Copilot", desc: t("platforms.copilot"), bg: "bg-[#7c3aed]/10", text: "text-[#7c3aed]" },
    { name: "Gmail", desc: t("platforms.gmail"), bg: "bg-[#ea4335]/10", text: "text-[#ea4335]" },
    { name: "Slack", desc: t("platforms.slack"), bg: "bg-[#4a154b]/10", text: "text-[#4a154b]" },
    { name: "Discord", desc: t("platforms.discord"), bg: "bg-[#5865f2]/10", text: "text-[#5865f2]" },
    { name: "Notion", desc: t("platforms.notion"), bg: "bg-[#000]/10", text: "text-foreground" },
    { name: "More", desc: t("platforms.more"), bg: "bg-muted", text: "text-muted-foreground" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero + Browser Download */}
      <ExtensionClient />

      {/* Platform Grid */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map(({ name, desc, bg, text }) => (
              <div
                key={name}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:shadow-md transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0 ${text}`}>
                  <PlatformIcon name={name} className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{name === "More" ? "More..." : name}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["realtime", "oneClick", "fileUpload", "everywhere"] as const).map((key) => (
              <div key={key} className="rounded-xl border border-border bg-background p-6 hover:shadow-lg transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2">{t(`features.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`features.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Reminder */}
      <section className="py-12 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">{t("pricing.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("pricing.subtitle")}</p>
          <a
            href={`/${locale}/pricing`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("pricing.cta")}
          </a>
        </div>
      </section>
    </div>
  );
}
