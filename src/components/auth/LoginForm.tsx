"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

type AuthMode = "login" | "register";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const getRedirectUrl = () => {
    const origin = window.location.origin;
    const locale = window.location.pathname.split("/")[1] || "en";
    const callbackUrl = `${origin}/${locale}/auth/callback`;
    if (redirectTo) {
      return `${callbackUrl}?redirect=${encodeURIComponent(redirectTo)}`;
    }
    return callbackUrl;
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
      setMessage(t("magicLinkSent"));
    }
    setLoading(false);
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(t("confirmEmail"));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        // Redirect on successful login
        const locale = window.location.pathname.split("/")[1] || "en";
        window.location.href = redirectTo || `/${locale}/redact`;
      }
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="text-center space-y-4">
        <Mail className="h-12 w-12 text-accent mx-auto" />
        <h2 className="text-lg font-semibold">{t("checkEmail")}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button
          variant="ghost"
          onClick={() => {
            setMagicLinkSent(false);
            setMessage(null);
          }}
        >
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {t("googleLogin")}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("or")}
          </span>
        </div>
      </div>

      {/* Magic Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("magicLink")}</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="accent"
            onClick={handleMagicLink}
            disabled={loading || !email}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("magicLinkDescription")}
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("or")}
          </span>
        </div>
      </div>

      {/* Email + Password */}
      <form onSubmit={handleEmailPassword} className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              mode === "login"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              mode === "register"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("register")}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("email")}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("password")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? t("loginButton") : t("registerButton")}
        </Button>
      </form>

      {/* Error / Message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      {message && (
        <p className="text-sm text-green-600 text-center">{message}</p>
      )}
    </div>
  );
}
