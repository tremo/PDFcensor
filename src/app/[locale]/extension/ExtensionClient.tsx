"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Puzzle } from "lucide-react";
import ExtensionDemo from "@/components/landing/ExtensionDemo";

type Browser = "chrome" | "firefox" | "edge" | "safari" | "unknown";

const STORE_URLS: Record<Browser, string> = {
  chrome: "https://chromewebstore.google.com",
  firefox: "https://addons.mozilla.org",
  edge: "https://microsoftedge.microsoft.com/addons",
  safari: "https://apps.apple.com",
  unknown: "https://chromewebstore.google.com",
};

const BROWSER_LABELS: Record<Browser, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  edge: "Edge",
  safari: "Safari",
  unknown: "Chrome",
};

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  if (ua.includes("Chrome/")) return "chrome";
  return "unknown";
}

export default function ExtensionClient() {
  const t = useTranslations("extensionPage");
  const [browser, setBrowser] = useState<Browser>("unknown");

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const storeUrl = STORE_URLS[browser];
  const browserLabel = BROWSER_LABELS[browser];
  const otherBrowsers = (["chrome", "firefox", "edge", "safari"] as Browser[]).filter(
    (b) => b !== browser && b !== "unknown"
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="accent" className="mb-6">
              <Puzzle className="h-3 w-3 mr-1" />
              {t("hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>

            {/* Browser-aware download */}
            <div className="flex flex-col items-center gap-4">
              <Button asChild size="lg" variant="accent">
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <Puzzle className="h-4 w-4" />
                  {t("hero.downloadFor", { browser: browserLabel })}
                </a>
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("hero.alsoAvailable")}</span>
                {otherBrowsers.map((b) => (
                  <a
                    key={b}
                    href={STORE_URLS[b]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/70 font-medium transition-colors"
                  >
                    {BROWSER_LABELS[b]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Animated Demo */}
          <div className="mt-8">
            <ExtensionDemo />
          </div>
        </div>
      </section>
    </>
  );
}
