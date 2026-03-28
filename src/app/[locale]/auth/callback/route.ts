import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";

const localeSet = new Set<string>(locales);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  // Extract locale from the URL path
  const pathname = new URL(request.url).pathname;
  const pathSegments = pathname.split("/");
  const locale =
    pathSegments.length > 1 && localeSet.has(pathSegments[1])
      ? pathSegments[1]
      : "en";

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(new URL(`/${locale}/login`, origin));
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate redirect is a relative path to prevent open redirect
      const safeRedirect =
        redirect && redirect.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : `/${locale}/redact`;
      return NextResponse.redirect(new URL(safeRedirect, origin));
    }
  }

  // Auth code exchange failed, redirect to login with error
  return NextResponse.redirect(new URL(`/${locale}/login`, origin));
}
