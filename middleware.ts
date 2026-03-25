import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { updateSession } from "@/lib/supabase/middleware";

const allLocales = [
  "en", "tr", "de", "fr", "es", "pt", "ja", "ko", "zh",
  "bg", "cs", "da", "el", "et", "fi", "ga", "hr", "hu",
  "it", "lt", "lv", "mt", "nl", "pl", "ro", "sk", "sl", "sv",
] as const;

const routing = defineRouting({
  locales: [...allLocales],
  defaultLocale: "en",
  localeDetection: true,
});

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const protectedPaths = ["/account"];

const localeSet = new Set<string>(allLocales);

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
  // 1. Refresh Supabase session (updates cookies)
  const { user, supabaseResponse } = await updateSession(request);

  // For API routes, only refresh the session — skip intl middleware
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

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

const localePattern = allLocales.join("|");
export const config = {
  matcher: ["/", `/(${localePattern})/:path*`, "/api/:path*"],
};
