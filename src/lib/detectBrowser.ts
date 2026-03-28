export type Browser = "chrome" | "firefox" | "edge" | "safari" | "unknown";

export const STORE_URLS: Record<Browser, string> = {
  chrome: "https://chromewebstore.google.com",
  firefox: "https://addons.mozilla.org",
  edge: "https://microsoftedge.microsoft.com/addons",
  safari: "https://apps.apple.com",
  unknown: "https://chromewebstore.google.com",
};

export const BROWSER_LABELS: Record<Browser, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  edge: "Edge",
  safari: "Safari",
  unknown: "Chrome",
};

export function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  if (ua.includes("Chrome/")) return "chrome";
  return "unknown";
}
