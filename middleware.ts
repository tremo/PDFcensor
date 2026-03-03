import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/navigation";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(tr|en|de|fr|es|pt|ja|ko|zh)/:path*"],
};
