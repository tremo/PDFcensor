import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  // Extract locale from the URL path
  const pathname = new URL(request.url).pathname;
  const localeMatch = pathname.match(/^\/(en|tr|de|fr|es|pt|ja|ko|zh)\//);
  const locale = localeMatch ? localeMatch[1] : "en";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectUrl = redirect || `/${locale}/redact`;
      return NextResponse.redirect(new URL(redirectUrl, origin));
    }
  }

  // Auth code exchange failed, redirect to login with error
  return NextResponse.redirect(new URL(`/${locale}/login`, origin));
}
