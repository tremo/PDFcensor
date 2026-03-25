import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/lib/i18n/config";
import {
  FileText,
  CheckCircle,
  Monitor,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Ban,
  ShieldCheck,
  User,
  Server,
  Scale,
  Gavel,
  Puzzle,
  Mail,
  Shield,
} from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

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
        locales.map((l) => [l, `/${l}/terms`])
      ),
    },
  };
}

const sectionIcons = [
  { id: "acceptance", icon: CheckCircle },
  { id: "serviceDesc", icon: Monitor },
  { id: "noGuarantee", icon: AlertTriangle },
  { id: "license", icon: CreditCard },
  { id: "refundPolicy", icon: RefreshCw },
  { id: "acceptableUse", icon: Ban },
  { id: "ip", icon: ShieldCheck },
  { id: "accountTerms", icon: User },
  { id: "availability", icon: Server },
  { id: "liability", icon: Scale },
  { id: "governingLaw", icon: Gavel },
  { id: "disputes", icon: Gavel },
  { id: "severability", icon: Puzzle },
  { id: "contact", icon: Mail },
];

export default async function TermsPage() {
  const t = await getTranslations("terms");

  const serviceFeatures: string[] = t.raw("serviceDesc.features");
  const noGuaranteeItems: string[] = t.raw("noGuarantee.items");
  const freeItems: string[] = t.raw("license.freeItems");
  const proItems: string[] = t.raw("license.proItems");
  const refundItems: string[] = t.raw("refundPolicy.items");
  const prohibitedItems: string[] = t.raw("acceptableUse.prohibited");
  const accountItems: string[] = t.raw("accountTerms.items");
  const liabilityItems: string[] = t.raw("liability.items");
  const contactItems: string[] = t.raw("contact.items");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
          <FileText className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("lastUpdated")} &middot; {t("effectiveDate")}</p>
      </div>

      {/* Highlight Boxes */}
      <div className="mb-10 space-y-3">
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 flex items-start gap-4">
          <RefreshCw className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm leading-relaxed">{t("highlightGuarantee")}</p>
        </div>
        <div className="p-5 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900 flex items-start gap-4">
          <Shield className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <p className="text-green-800 dark:text-green-300 font-medium text-sm leading-relaxed">{t("highlightOwnership")}</p>
        </div>
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
        {/* 1. Acceptance */}
        <section id="acceptance">
          <SectionHeading icon={CheckCircle} title={t("acceptance.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("acceptance.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("acceptance.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("acceptance.text3")}</p>
        </section>

        {/* 2. Service Description */}
        <section id="serviceDesc">
          <SectionHeading icon={Monitor} title={t("serviceDesc.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("serviceDesc.text")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {serviceFeatures.map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border bg-muted/20">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {feat}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground leading-relaxed">{t("serviceDesc.text2")}</p>
        </section>

        {/* 3. No Guarantee */}
        <section id="noGuarantee">
          <SectionHeading icon={AlertTriangle} title={t("noGuarantee.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("noGuarantee.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("noGuarantee.text2")}</p>
          <ul className="mt-3 space-y-2">
            {noGuaranteeItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("noGuarantee.text3")}</p>
        </section>

        {/* 4. License */}
        <section id="license">
          <SectionHeading icon={CreditCard} title={t("license.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-4">{t("license.text")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-5 rounded-xl border border-border">
              <h4 className="font-semibold mb-3">{t("license.freeHeading")}</h4>
              <ul className="space-y-2">
                {freeItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-xl border-2 border-accent bg-accent/5">
              <h4 className="font-semibold mb-3">{t("license.proHeading")}</h4>
              <ul className="space-y-2">
                {proItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">{t("license.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("license.text3")}</p>
        </section>

        {/* 5. Refund Policy */}
        <section id="refundPolicy">
          <SectionHeading icon={RefreshCw} title={t("refundPolicy.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("refundPolicy.text")}</p>
          <ul className="space-y-2 mb-3">
            {refundItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">{t("refundPolicy.text2")}</p>
        </section>

        {/* 6. Acceptable Use */}
        <section id="acceptableUse">
          <SectionHeading icon={Ban} title={t("acceptableUse.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("acceptableUse.text")}</p>
          <ul className="space-y-2 mb-3">
            {prohibitedItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">{t("acceptableUse.text2")}</p>
        </section>

        {/* 7. IP */}
        <section id="ip">
          <SectionHeading icon={ShieldCheck} title={t("ip.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("ip.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("ip.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("ip.text3")}</p>
        </section>

        {/* 8. Account Terms */}
        <section id="accountTerms">
          <SectionHeading icon={User} title={t("accountTerms.heading")} />
          <p className="text-muted-foreground leading-relaxed mb-3">{t("accountTerms.text")}</p>
          <ul className="space-y-2">
            {accountItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 9. Availability */}
        <section id="availability">
          <SectionHeading icon={Server} title={t("availability.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("availability.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("availability.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("availability.text3")}</p>
        </section>

        {/* 10. Liability */}
        <section id="liability">
          <SectionHeading icon={Scale} title={t("liability.heading")} />
          <p className="text-muted-foreground leading-relaxed text-xs uppercase tracking-wide font-medium mb-3">{t("liability.text")}</p>
          <ul className="space-y-2 mb-3">
            {liabilityItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">{t("liability.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("liability.text3")}</p>
        </section>

        {/* 11. Governing Law */}
        <section id="governingLaw">
          <SectionHeading icon={Gavel} title={t("governingLaw.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("governingLaw.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("governingLaw.text2")}</p>
        </section>

        {/* 12. Disputes */}
        <section id="disputes">
          <SectionHeading icon={Gavel} title={t("disputes.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("disputes.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("disputes.text2")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("disputes.text3")}</p>
        </section>

        {/* 13. Severability */}
        <section id="severability">
          <SectionHeading icon={Puzzle} title={t("severability.heading")} />
          <p className="text-muted-foreground leading-relaxed">{t("severability.text")}</p>
          <p className="text-muted-foreground leading-relaxed mt-3">{t("severability.text2")}</p>
        </section>

        {/* 14. Contact */}
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
