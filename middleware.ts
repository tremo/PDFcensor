import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { locales, defaultLocale } from "@/lib/i18n/config";

const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localeDetection: true,
});

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedPaths = ["/account"];

const localeSet = new Set<string>(locales);

function getPathWithoutLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && localeSet.has(segments[1])) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && localeSet.has(segments[1])) {
    return segments[1];
  }
  return "en";
}

export async function middleware(request: NextRequest) {
  // 0. Fix doubled locale prefix: /tr/tr/... → /tr/...
  const segments = request.nextUrl.pathname.split("/");
  if (
    segments.length > 2 &&
    segments[1] === segments[2] &&
    localeSet.has(segments[1])
  ) {
    const fixed = "/" + segments[1] + (segments.length > 3 ? "/" + segments.slice(3).join("/") : "");
    return NextResponse.redirect(new URL(fixed, request.url), 308);
  }

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

const localePattern = locales.join("|");
export const config = {
  matcher: ["/", `/(${localePattern})/:path*`],
};
