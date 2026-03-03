import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            <p className="mt-8 text-sm text-muted-foreground">
              {t("hero.trustedBy")}
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
