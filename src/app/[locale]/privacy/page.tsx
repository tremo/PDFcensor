import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/lib/i18n/config";
import {
  Shield,
  MonitorSmartphone,
  Database,
  Cookie,
  Globe,
  Clock,
  UserCheck,
  Baby,
  Server,
  Lock,
  Scale,
  Bell,
  FileText,
  Building2,
  Mail,
} from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

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
        locales.map((l) => [l, `/${l}/privacy`])
      ),
    },
  };
}

const sectionIcons = [
  { id: "intro", icon: FileText },
  { id: "noFileUploads", icon: MonitorSmartphone },
  { id: "infoCollect", icon: Database },
  { id: "cookies", icon: Cookie },
  { id: "thirdParty", icon: Globe },
  { id: "dataRetention", icon: Clock },
  { id: "rights", icon: UserCheck },
  { id: "children", icon: Baby },
  { id: "transfers", icon: Server },
  { id: "security", icon: Lock },
  { id: "legalBasis", icon: Scale },
  { id: "breach", icon: Bell },
  { id: "changes", icon: FileText },
  { id: "authorities", icon: Building2 },
  { id: "contact", icon: Mail },
];

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const infoAccountItems: string[] = t.raw("infoCollect.accountItems");
  const infoPaymentItems: string[] = t.raw("infoCollect.paymentItems");
  const infoAnalyticsItems: string[] = t.raw("infoCollect.analyticsItems");
  const infoAutoItems: string[] = t.raw("infoCollect.autoItems");
  const noFileItems: string[] = t.raw("noFileUploads.items");
  const retentionItems: string[] = t.raw("dataRetention.items");
  const gdprRights: { title: string; desc: string }[] = t.raw("rights.gdprRights");
  const ccpaRights: string[] = t.raw("rights.ccpaRights");
  const securityItems: string[] = t.raw("security.items");
  const legalBases: { basis: string; description: string }[] = t.raw("legalBasis.bases");
  const changesItems: string[] = t.raw("changes.items");
  const authorityItems: string[] = t.raw("authorities.items");
  const contactItems: string[] = t.raw("contact.items");
  const cookieTableHeaders: string[] = t.raw("cookies.tableHeaders");
  const cookieTableRows: string[][] = t.raw("cookies.tableRows");
  const thirdPartyServices: { name: string; purpose: string; dataShared: string; url: string }[] = t.raw("thirdParty.services");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
          <Shield className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("lastUpdated")} &middot; {t("effectiveDate")}</p>
      </div>

      {/* Highlight */}
      <div className="mb-10 p-5 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900 flex items-start gap-4">
        <Shield className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
        <p className="text-green-800 dark:text-green-300 font-medium text-sm leading-relaxed">{t("highlight")}</p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-12 p-5 rounded-xl border border-border bg-muted/30">
        <h2 className="font-semibold mb-3 text-sm">{t("toc")}</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
          {sectionIcons.map(({ id, icon: Icon }) => (
            <li key={id}>
              <a href={`#${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors py-0.5">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t(`${id}.heading`)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Content */}
      <div className="space-y-12">
        {/* 1. Introduction */}
        <section id="intro">
          <SectionHeading icon={FileText} title={t("intro.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("intro.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("intro.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("intro.text3")}</p>
        </section>

        {/* 2. Zero-Knowledge */}
        <section id="noFileUploads">
          <SectionHeading icon={MonitorSmartphone} title={t("noFileUploads.heading")} />
          <p className="text-muted-foreground leading-relaxed">
            {t.rich("noFileUploads.text", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("noFileUploads.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("noFileUploads.text3")}</p>
          <ul className="mt-4 space-y-2">
            {noFileItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Information We Collect */}
        <section id="infoCollect">
          <SectionHeading icon={Database} title={t("infoCollect.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("infoCollect.text")}</p>

          <div className="space-y-4">
            <InfoCard title={t("infoCollect.accountHeading")} items={infoAccountItems} />
            <InfoCard title={t("infoCollect.paymentHeading")} items={infoPaymentItems} />
            <InfoCard title={t("infoCollect.analyticsHeading")} items={infoAnalyticsItems} />
            <InfoCard title={t("infoCollect.autoHeading")} items={infoAutoItems} />
          </div>
        </section>

        {/* 4. Cookies */}
        <section id="cookies">
          <SectionHeading icon={Cookie} title={t("cookies.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("cookies.text")}</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {cookieTableHeaders.map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cookieTableRows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="py-3 px-4 text-muted-foreground">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Third-Party Services */}
        <section id="thirdParty">
          <SectionHeading icon={Globe} title={t("thirdParty.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("thirdParty.text")}</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">{t("thirdParty.serviceLabel")}</th>
                  <th className="text-left py-3 px-4 font-medium">{t("thirdParty.purposeLabel")}</th>
                  <th className="text-left py-3 px-4 font-medium">{t("thirdParty.dataSharedLabel")}</th>
                  <th className="text-left py-3 px-4 font-medium">{t("thirdParty.policyLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyServices.map((s, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.purpose}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.dataShared}</td>
                    <td className="py-3 px-4">
                      <span className="text-accent text-xs">Link</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Data Retention */}
        <section id="dataRetention">
          <SectionHeading icon={Clock} title={t("dataRetention.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("dataRetention.text")}</p>
          <ul className="space-y-2">
            {retentionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 7. Your Rights */}
        <section id="rights">
          <SectionHeading icon={UserCheck} title={t("rights.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("rights.text")}</p>

          <h3 className="font-semibold text-sm mb-3">{t("rights.gdprHeading")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {gdprRights.map((r, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-background">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-sm mb-3">{t("rights.ccpaHeading")}</h3>
          <ul className="space-y-2 mb-4">
            {ccpaRights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <UserCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t("rights.exerciseText")}</p>
        </section>

        {/* 8. Children */}
        <section id="children">
          <SectionHeading icon={Baby} title={t("children.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("children.text")}</p>
        </section>

        {/* 9. International Transfers */}
        <section id="transfers">
          <SectionHeading icon={Server} title={t("transfers.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("transfers.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("transfers.text2")}</p>
        </section>

        {/* 10. Data Security */}
        <section id="security">
          <SectionHeading icon={Lock} title={t("security.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("security.text")}</p>
          <ul className="space-y-2">
            {securityItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 11. Legal Basis */}
        <section id="legalBasis">
          <SectionHeading icon={Scale} title={t("legalBasis.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("legalBasis.text")}</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">{t("legalBasis.basisLabel")}</th>
                  <th className="text-left py-3 px-4 font-medium">{t("legalBasis.descriptionLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {legalBases.map((b, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-3 px-4 font-medium">{b.basis}</td>
                    <td className="py-3 px-4 text-muted-foreground">{b.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 12. Breach Notification */}
        <section id="breach">
          <SectionHeading icon={Bell} title={t("breach.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("breach.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("breach.text2")}</p>
        </section>

        {/* 13. Changes */}
        <section id="changes">
          <SectionHeading icon={FileText} title={t("changes.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("changes.text")}</p>
          <ul className="space-y-2">
            {changesItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 14. Authorities */}
        <section id="authorities">
          <SectionHeading icon={Building2} title={t("authorities.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("authorities.text")}</p>
          <ul className="space-y-2">
            {authorityItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 15. Contact */}
        <section id="contact" className="p-6 rounded-xl border border-accent/20 bg-accent/5">
          <SectionHeading icon={Mail} title={t("contact.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("contact.text")}</p>
          <ul className="space-y-2 mb-3">
            {contactItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t("contact.responseTime")}</p>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/20">
      <h4 className="font-medium text-sm mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
