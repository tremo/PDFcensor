import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";

const routing = defineRouting({
  locales: ["en", "tr", "de", "fr", "es", "pt", "ja", "ko", "zh"],
  defaultLocale: "en",
});

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(tr|en|de|fr|es|pt|ja|ko|zh)/:path*"],
};
