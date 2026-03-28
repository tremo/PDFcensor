"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "@/lib/i18n/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;

  useEffect(() => {
    if (!isLoading && user) {
      const defaultPath = `/${locale}/redact`;
      const safeDest =
        redirect && redirect.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : defaultPath;
      router.replace(safeDest);
    }
  }, [isLoading, user, redirect, locale, router]);

  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center py-24">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("loginSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
