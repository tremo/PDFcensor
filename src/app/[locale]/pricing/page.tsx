"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const isYearly = billingPeriod === "yearly";

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, plan: billingPeriod }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Checkout failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures: string[] = t.raw("free.features");
  const proFeatures: string[] = t.raw("pro.features");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free */}
        <Card className="relative">
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
          <CardContent>
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
        <Card className="relative border-accent">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
          <CardContent>
            <ul className="space-y-3">
              {proFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="accent"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "..." : isYearly ? t("pro.yearlyCta") : t("pro.cta")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
