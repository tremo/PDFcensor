import { getSettings, incrementUsage, getUsage, getProStatus } from "../src/lib/storage";
import { detectPII } from "../src/lib/pii/detector";
import { getRegulationPatterns } from "../src/lib/pii/regulations";
import { maskText } from "../src/lib/masker";
import type { Message, ScanResponse, UsageResponse, SettingsResponse } from "../src/utils/messaging";

const FREE_DAILY_LIMIT = 5;
const FREE_PII_TYPES = ["email", "phone", "tcKimlik"] as const;

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      handleMessage(message).then(sendResponse);
      return true; // async response
    }
  );
});

async function handleMessage(message: Message): Promise<ScanResponse | UsageResponse | SettingsResponse> {
  switch (message.type) {
    case "SCAN_TEXT":
      return handleScanText(message.text);

    case "CHECK_USAGE":
      return handleCheckUsage();

    case "GET_SETTINGS": {
      const settings = await getSettings();
      return { type: "SETTINGS", settings };
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
