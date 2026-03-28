"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, ChevronDown } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PricingClient() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const isYearly = billingPeriod === "yearly";

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, plan: billingPeriod }),
      });
      if (response.status === 401) {
        router.push("/login?redirect=/pricing");
        return;
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError("Server error. Please try again later.");
        return;
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Checkout failed");
      }
    } catch (e) {
      console.error("Checkout failed:", e);
      setError("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures: string[] = t.raw("free.features");
  const proFeatures: string[] = t.raw("pro.features");

  const comparisonRows: { key: string; values: (string | boolean)[]; highlight?: boolean }[] = [
    { key: "price", values: [t("comparison.offlineRedactPrice"), t("comparison.adobePrice"), t("comparison.redactablePrice"), t("comparison.ilovepdfPrice")] },
    { key: "clientSide", values: [true, false, false, false], highlight: true },
    { key: "faceDetection", values: [true, false, false, false], highlight: true },
    { key: "multiFormat", values: [true, "limited", false, "limited"], highlight: true },
    { key: "offlineCapable", values: [true, true, false, false] },
    { key: "autoDetect", values: [true, false, true, false] },
    { key: "metadataCleaning", values: [true, true, false, false] },
    { key: "batchProcessing", values: [true, true, true, true] },
    { key: "browserExtension", values: [true, false, false, false], highlight: true },
  ];

  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-muted p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !isYearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("toggle.monthly")}
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isYearly ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("toggle.yearly")}
            <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
              {t("toggle.save")}
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
        {/* Free */}
        <Card className="relative flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">{t("free.title")}</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold">{t("free.price")}</span>
              <span className="text-muted-foreground ml-1">/ {t("free.period")}</span>
            </div>
            <CardDescription className="mt-2">
              {t("free.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {freeFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/redact">{t("free.cta")}</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro */}
        <Card className="relative border-accent flex flex-col pt-4">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Badge variant="accent">Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl">{t("pro.title")}</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold">
                {isYearly ? t("pro.yearlyPrice") : t("pro.price")}
              </span>
              <span className="text-muted-foreground ml-1">
                / {isYearly ? t("pro.yearlyPeriod") : t("pro.period")}
              </span>
            </div>
            <CardDescription className="mt-2">
              {t("pro.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {proFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full"
              variant="accent"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "..." : isYearly ? t("pro.yearlyCta") : t("pro.cta")}
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Money-Back Guarantee */}
      <div className="mt-10 flex items-center justify-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 max-w-xl mx-auto dark:bg-green-950/30 dark:border-green-900">
        <ShieldCheck className="h-6 w-6 text-green-700 dark:text-green-400 shrink-0" />
        <div>
          <p className="font-semibold text-green-900 dark:text-green-200 text-sm">{t("guarantee")}</p>
          <p className="text-xs text-green-800 dark:text-green-300">{t("guaranteeDesc")}</p>
        </div>
      </div>

      {/* Competitor Comparison Table */}
      <div className="mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t("comparison.title")}</h2>
          <p className="text-muted-foreground">{t("comparison.subtitle")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("comparison.feature")}</th>
                <th className="py-3 px-4 font-semibold text-accent text-center">{t("comparison.offlineRedact")}</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">{t("comparison.adobeAcrobat")}</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">{t("comparison.redactable")}</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">{t("comparison.ilovepdf")}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ key, values, highlight }) => (
                <tr key={key} className={`border-b border-border ${highlight ? "bg-accent/5" : ""}`}>
                  <td className="py-3 px-4 font-medium">
                    {t(`comparison.${key}`)}
                    {highlight && (
                      <span className="ml-2 text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                        {t("comparison.onlyUs")}
                      </span>
                    )}
                  </td>
                  {values.map((val, i) => (
                    <td key={i} className={`py-3 px-4 text-center ${i === 0 ? "font-semibold" : ""}`}>
                      {val === "limited" ? (
                        <span className="text-amber-500 text-xs font-medium">{t("comparison.limited")}</span>
                      ) : typeof val === "string" ? (
                        <span className={i === 0 ? "text-accent" : "text-muted-foreground"}>{val}</span>
                      ) : val === true ? (
                        <span className={`inline-block w-5 h-5 rounded-full ${i === 0 ? "bg-accent text-accent-foreground" : "bg-green-100 text-green-600"} text-xs font-bold leading-5`}>
                          &#10003;
                        </span>
                      ) : (
                        <span className="inline-block w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-bold leading-5">
                          &#10007;
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">{t("faq.title")}</h2>
        <div className="space-y-4">
          {faqItems.map(({ q, a }, i) => (
            <details key={i} className="group rounded-xl border border-border bg-background">
              <summary className="flex items-center justify-between cursor-pointer p-5 font-medium">
                {q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
