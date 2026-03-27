import { getAdapter } from "../../src/adapters";
import { createToast } from "../../src/ui/toast";
import type { ScanResponse, ScanTextMessage } from "../../src/utils/messaging";
import type { PIIMatch } from "../../src/lib/pii/types";

export default defineContentScript({
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://copilot.microsoft.com/*",
  ],
  runAt: "document_idle",
  main() {
    const adapter = getAdapter(window.location.hostname);
    if (!adapter) return;

    let lastScanText = "";
    let pendingMatches: PIIMatch[] = [];
    const toast = createToast();

    // Observe input changes
    const cleanup = adapter.observe(() => {
      const text = adapter.getMessageText();
      if (!text || text === lastScanText) return;
      lastScanText = text;
      scanText(text);
    });

    // Intercept send button
    const cleanupIntercept = adapter.interceptSend(() => {
      if (pendingMatches.length === 0) return true; // allow send

      // Block send and show toast
      toast.show({
        matchCount: pendingMatches.length,
        onMask: () => {
          // Request masked text from background
          const message: ScanTextMessage = { type: "SCAN_TEXT", text: adapter.getMessageText() };
          chrome.runtime.sendMessage(message, (response: ScanResponse) => {
            if (response?.masked) {
              adapter.setMessageText(response.masked);
              pendingMatches = [];
              toast.hide();
            }
          });
        },
        onIgnore: () => {
          pendingMatches = [];
          toast.hide();
          // Re-click send
          adapter.getSendButton()?.click();
        },
        onReview: () => {
          toast.showDetails(pendingMatches);
        },
      });

      return false; // block send
    });

    async function scanText(text: string) {
      const message: ScanTextMessage = { type: "SCAN_TEXT", text };
      chrome.runtime.sendMessage(message, (response: ScanResponse) => {
        if (!response) return;

        if (response.limitReached) {
          toast.showLimit();
          return;
        }

        pendingMatches = response.matches;

        if (response.totalCount > 0) {
          toast.showWarning(response.totalCount);
        } else {
          toast.hide();
        }
      });
    }

    // Cleanup on navigation
    window.addEventListener("beforeunload", () => {
      cleanup();
      cleanupIntercept();
      toast.destroy();
    });
  },
});
