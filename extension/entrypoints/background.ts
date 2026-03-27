import { getSettings, incrementUsage, getUsage } from "../src/lib/storage";
import { getProStatus, verifyProStatus, login, logout, getUserInfo } from "../src/lib/auth";
import { detectPII } from "../src/lib/pii/detector";
import { getRegulationPatterns } from "../src/lib/pii/regulations";
import { maskText } from "../src/lib/masker";
import type { Message, ScanResponse, UsageResponse, SettingsResponse } from "../src/utils/messaging";

const FREE_DAILY_LIMIT = 5;
const FREE_PII_TYPES = ["email", "phone", "tcKimlik"] as const;

// Pro durumunu periyodik olarak doğrula (1 saat)
const PRO_CHECK_INTERVAL = 3600000;

export default defineBackground(() => {
  // Message handler
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      handleMessage(message).then(sendResponse);
      return true; // async response
    }
  );

  // Periyodik Pro doğrulama — extension açıldığında ve her 1 saatte
  verifyProStatus().catch(() => {});
  setInterval(() => {
    verifyProStatus().catch(() => {});
  }, PRO_CHECK_INTERVAL);
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case "SCAN_TEXT":
      return handleScanText(message.text);

    case "CHECK_USAGE":
      return handleCheckUsage();

    case "GET_SETTINGS": {
      const settings = await getSettings();
      return { type: "SETTINGS", settings };
    }

    case "LOGIN": {
      const success = await login();
      return { type: "LOGIN_RESULT", success };
    }

    case "LOGOUT": {
      await logout();
      return { type: "LOGOUT_RESULT", success: true };
    }

    case "GET_USER_INFO": {
      const info = await getUserInfo();
      return { type: "USER_INFO", ...info };
    }

    default:
      return { type: "SCAN_RESULT", matches: [], totalCount: 0 };
  }
}

async function handleScanText(text: string): Promise<ScanResponse> {
  const settings = await getSettings();
  if (!settings.enabled) {
    return { type: "SCAN_RESULT", matches: [], totalCount: 0 };
  }

  const isPro = await getProStatus();

  // Free tier: check daily limit
  if (!isPro) {
    const usage = await getUsage();
    const today = new Date().toISOString().slice(0, 10);
    if (usage.date === today && usage.count >= FREE_DAILY_LIMIT) {
      return { type: "SCAN_RESULT", matches: [], totalCount: 0, limitReached: true };
    }
  }

  // Determine which PII types to scan
  let piiTypes = getRegulationPatterns(settings.regulation);
  if (!isPro) {
    piiTypes = piiTypes.filter((t) =>
      (FREE_PII_TYPES as readonly string[]).includes(t)
    );
  }

  const result = detectPII(text, 0, piiTypes);

  // Increment usage counter
  if (result.totalCount > 0) {
    await incrementUsage();
  }

  // Auto-mask if Pro
  let masked: string | undefined;
  if (isPro && settings.autoMask && result.totalCount > 0) {
    masked = maskText(text, result.matches);
  }

  return {
    type: "SCAN_RESULT",
    matches: result.matches,
    totalCount: result.totalCount,
    masked,
  };
}

async function handleCheckUsage(): Promise<UsageResponse> {
  const isPro = await getProStatus();
  const usage = await getUsage();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = usage.date === today ? usage.count : 0;

  return {
    type: "USAGE_STATUS",
    remaining: isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - todayCount),
    isPro,
  };
}
