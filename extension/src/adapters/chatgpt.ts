import type { SiteAdapter } from "./types";

/** ChatGPT adapter — chatgpt.com / chat.openai.com */
export const chatgptAdapter: SiteAdapter = {
  name: "ChatGPT",
  hostnames: ["chatgpt.com", "chat.openai.com"],

  getInputElement() {
    return document.querySelector<HTMLElement>("#prompt-textarea, [contenteditable='true']");
  },

  getSendButton() {
    return document.querySelector<HTMLElement>('[data-testid="send-button"], button[aria-label="Send prompt"]');
  },

  getMessageText() {
    const el = this.getInputElement();
    if (!el) return "";
    // ChatGPT uses a contenteditable div or ProseMirror
    return el.innerText || el.textContent || "";
  },

  setMessageText(text: string) {
    const el = this.getInputElement();
    if (!el) return;

    // For contenteditable, set innerText and dispatch input event
    el.innerText = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  },

  getFileInput() {
    return document.querySelector<HTMLInputElement>('input[type="file"]');
  },

  interceptSend(callback: () => boolean): () => void {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const sendBtn = this.getSendButton();
      if (sendBtn && (target === sendBtn || sendBtn.contains(target))) {
        if (!callback()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Also intercept Enter key
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (!callback()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handler, true);
    document.addEventListener("keydown", keyHandler, true);

    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  },

  observe(callback: () => void): () => void {
    const el = this.getInputElement();
    if (!el) {
      // Wait for element to appear
      const observer = new MutationObserver(() => {
        const input = this.getInputElement();
        if (input) {
          observer.disconnect();
          setupObserver(input);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }

    return setupObserver(el);

    function setupObserver(target: HTMLElement): () => void {
      const observer = new MutationObserver(callback);
      observer.observe(target, { childList: true, subtree: true, characterData: true });
      target.addEventListener("input", callback);
      return () => {
        observer.disconnect();
        target.removeEventListener("input", callback);
      };
    }
  },
};
