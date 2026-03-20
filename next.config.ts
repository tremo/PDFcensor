import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath: "/PDFcensor",
    images: { unoptimized: true },
  }),
  webpack: (config) => {
    // pdf.js worker setup
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
