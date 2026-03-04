"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Shield, ArrowRight, Loader2 } from "lucide-react";

export default function AccountPage() {
  const t = useTranslations("auth");
  const { user, isPro, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware redirects to login
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24 space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full mx-auto mb-2"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <CardTitle className="text-xl">{displayName}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </CardHeader>
      </Card>

      {/* License Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            {isPro ? (
              <>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">{t("proPlan")}</p>
                  <p className="text-xs text-muted-foreground">{t("proDescription")}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{t("freePlan")}</p>
                  <p className="text-xs text-muted-foreground">{t("freeDescription")}</p>
                </div>
              </>
            )}
          </div>

          {!isPro && (
            <Button variant="accent" className="w-full" asChild>
              <Link href="/pricing">
                {t("upgradeToPro")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Button variant="outline" className="w-full" asChild>
        <Link href="/redact">
          {t("goToRedact")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
