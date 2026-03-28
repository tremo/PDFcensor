"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Puzzle, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { detectBrowser, STORE_URLS, BROWSER_LABELS } from "@/lib/detectBrowser";

const DISMISS_KEY = "offlineredact-ext-tip-dismissed";

export function ExtensionTip({ isPro }: { isPro: boolean }) {
  const t = useTranslations("redact.extensionTip");
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (isPro) {
    const browser = detectBrowser();
    const storeUrl = STORE_URLS[browser];
    const browserLabel = BROWSER_LABELS[browser];

    return (
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
        <Puzzle className="h-4 w-4 text-accent shrink-0" />
        <p className="flex-1 text-sm text-muted-foreground">
          {t("pro")}{" "}
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            {t("proBrowserCta", { browser: browserLabel })}
          </a>
        </p>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
      <Puzzle className="h-4 w-4 text-accent shrink-0" />
      <p className="flex-1 text-sm text-muted-foreground">
        {t("free")}{" "}
        <Link href="/extension" className="font-medium text-accent hover:underline">
          {t("freeCta")}
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
