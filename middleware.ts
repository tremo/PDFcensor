import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { updateSession } from "@/lib/supabase/middleware";

const routing = defineRouting({
  locales: ["en", "tr", "de", "fr", "es", "pt", "ja", "ko", "zh"],
  defaultLocale: "en",
  localeDetection: true,
});

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedPaths = ["/account"];

function getPathWithoutLocale(pathname: string): string {
  const localePattern = /^\/(en|tr|de|fr|es|pt|ja|ko|zh)(\/|$)/;
  return pathname.replace(localePattern, "/");
}

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(en|tr|de|fr|es|pt|ja|ko|zh)(\/|$)/);
  return match ? match[1] : "en";
}

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session (updates cookies)
  const { user, supabaseResponse } = await updateSession(request);

  // 2. Check protected routes
  const pathWithoutLocale = getPathWithoutLocale(request.nextUrl.pathname);
  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  if (isProtected && !user) {
    const locale = getLocaleFromPath(request.nextUrl.pathname);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 4. Copy Supabase auth cookies to intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(tr|en|de|fr|es|pt|ja|ko|zh)/:path*"],
};
