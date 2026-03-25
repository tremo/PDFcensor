"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Crown } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Suspense } from "react";

function SuccessContent() {
  const t = useTranslations("auth");
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">{t("paymentSuccess")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            {t("paymentSuccessDescription")}
          </p>

          {/* Pro status indicator */}
          <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Crown className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-800">{t("proActivated")}</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {t("proLinkedToAccount", { email: user?.email || "" })}
          </p>

          <div className="flex gap-3">
            <Button asChild className="flex-1" variant="outline">
              <Link href="/account">
                {t("account")}
              </Link>
            </Button>
            <Button asChild className="flex-1" variant="accent">
              <Link href="/redact">
                {t("goToRedact")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessClient() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
