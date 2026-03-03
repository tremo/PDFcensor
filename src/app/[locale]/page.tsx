import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingDemo from "@/components/landing/LandingDemo";
import {
  ShieldCheck,
  Monitor,
  ScanSearch,
  Scale,
  FolderArchive,
  FileKey,
  Upload,
  Eye,
  Download,
  ArrowRight,
  FileText,
  Cloud,
  HelpCircle,
  MonitorSmartphone,
  CheckCircle,
  Ban,
  ShieldAlert,
  Lock,
  Heart,
  Home,
  DollarSign,
  Building2,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations();

  const features = [
    { icon: ShieldCheck, key: "trueRedaction" },
    { icon: Monitor, key: "clientSide" },
    { icon: ScanSearch, key: "autoDetect" },
    { icon: Scale, key: "regulations" },
    { icon: FolderArchive, key: "batch" },
    { icon: FileKey, key: "metadata" },
  ];

  const steps = [
    { icon: Upload, num: "01", key: "step1" },
    { icon: Eye, num: "02", key: "step2" },
    { icon: Download, num: "03", key: "step3" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="accent" className="mb-6">
              {t("hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {t("hero.title")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="accent">
                <Link href="/redact">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>

          {/* Interactive Demo */}
          <LandingDemo />
        </div>
      </section>

      {/* Privacy Comparison */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-muted to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              {t("comparison.badge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              {t("comparison.title")}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              {t("comparison.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Other Tools */}
            <div className="bg-background rounded-2xl p-6 md:p-8 border border-border relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                {t("comparison.otherTools")}
              </div>
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{t("comparison.yourDoc")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.yourDocDesc")}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-red-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <Cloud className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-600 dark:text-red-400">{t("comparison.theirServers")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.theirServersDesc")}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground/30 rotate-90" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <HelpCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">{t("comparison.whoKnows")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.whoKnowsDesc")}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground/60">Smallpdf, iLovePDF, Redactable, PDF24...</div>
              </div>
            </div>

            {/* SafeRedact / OfflineRedact */}
            <div className="bg-background rounded-2xl p-6 md:p-8 border-2 border-accent relative shadow-lg shadow-accent/10">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                OfflineRedact
              </div>
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{t("comparison.yourDoc")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.yourDocDesc")}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-accent rotate-90" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <MonitorSmartphone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-accent">{t("comparison.yourBrowser")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.yourBrowserDesc")}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-accent rotate-90" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-accent">{t("comparison.redactedFile")}</div>
                    <div className="text-sm text-muted-foreground">{t("comparison.redactedFileDesc")}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-accent/20">
                <div className="flex items-center gap-2 text-sm text-accent">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("comparison.zeroRetention")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("comparison.footnote")}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="group rounded-xl border border-border bg-background p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map(({ icon: Icon, num, key }) => (
              <div key={key} className="text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-accent/10 p-4 relative">
                  <Icon className="h-8 w-8 text-accent" />
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`howItWorks.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`howItWorks.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground" id="security">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="md:max-w-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t("security.title")}
              </h2>
              <p className="opacity-70">
                {t("security.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t("security.noCopy")}</div>
                  <div className="text-xs opacity-60">{t("security.noCopyDesc")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t("security.noTricks")}</div>
                  <div className="text-xs opacity-60">{t("security.noTricksDesc")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t("security.zeroRetention")}</div>
                  <div className="text-xs opacity-60">{t("security.zeroRetentionDesc")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t("security.encrypted")}</div>
                  <div className="text-xs opacity-60">{t("security.encryptedDesc")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-muted-foreground text-sm mb-6">
            {t("trust.title")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            {[
              { icon: Scale, label: t("trust.legal"), color: "text-blue-600" },
              { icon: Heart, label: t("trust.healthcare"), color: "text-accent" },
              { icon: Home, label: t("trust.realEstate"), color: "text-purple-600" },
              { icon: DollarSign, label: t("trust.finance"), color: "text-amber-600" },
              { icon: Building2, label: t("trust.government"), color: "text-muted-foreground" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Button asChild size="lg" variant="accent">
            <Link href="/redact">
              {t("cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
