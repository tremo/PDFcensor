"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Suspense } from "react";

function LoginContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;

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
