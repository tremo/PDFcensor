"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Shield, ArrowRight, Loader2, AlertTriangle, Puzzle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface SubscriptionStatus {
  status: "active" | "no_subscription";
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
  interval?: "month" | "year" | null;
}

export default function AccountPage() {
  const t = useTranslations("auth");
  const { user, isPro, isLoading } = useAuth();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchSubscriptionStatus = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscription-status");
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
    } catch {
      // non-fatal
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPro && user) {
      fetchSubscriptionStatus();
    }
  }, [isPro, user, fetchSubscriptionStatus]);

  const handleCancelOrReactivate = async (action: "cancel" | "reactivate") => {
    setActionLoading(true);
    setShowConfirm(false);
    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchSubscriptionStatus();
      }
    } catch {
      // non-fatal
    } finally {
      setActionLoading(false);
    }
  };

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

  const periodEndDate = subStatus?.currentPeriodEnd
    ? new Date(subStatus.currentPeriodEnd * 1000)
    : null;

  const formattedEndDate = periodEndDate
    ? periodEndDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

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

          {/* Subscription management for Pro users */}
          {isPro && subStatus?.status === "active" && (
            <div className="mt-4 space-y-3">
              {subStatus.cancelAtPeriodEnd ? (
                <>
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">
                        {t("subscriptionCanceling")}
                      </p>
                      <p className="text-amber-700 mt-0.5">
                        {t("accessUntil", { date: formattedEndDate })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCancelOrReactivate("reactivate")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("reactivateSubscription")}
                  </Button>
                </>
              ) : (
                <>
                  {formattedEndDate && (
                    <p className="text-xs text-muted-foreground">
                      {t("nextBillingDate", { date: formattedEndDate })}
                    </p>
                  )}
                  {showConfirm ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
                      <p className="text-sm text-destructive">
                        {t("cancelConfirmMessage", { date: formattedEndDate })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCancelOrReactivate("cancel")}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {t("confirmCancel")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowConfirm(false)}
                          disabled={actionLoading}
                        >
                          {t("keepSubscription")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-destructive"
                      onClick={() => setShowConfirm(true)}
                    >
                      {t("cancelSubscription")}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {isPro && subLoading && (
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

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

      {/* Extension Card — Pro only */}
      {isPro && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Puzzle className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t("extensionTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("extensionSubtitle")}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/extension">{t("installExtension")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
