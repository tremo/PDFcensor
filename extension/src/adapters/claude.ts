import type { SiteAdapter } from "./types";

/** Claude.ai adapter */
export const claudeAdapter: SiteAdapter = {
  name: "Claude",
  hostnames: ["claude.ai"],

  getInputElement() {
    return document.querySelector<HTMLElement>(
      '[contenteditable="true"].ProseMirror, div[contenteditable="true"]'
    );
  },

  getSendButton() {
    return document.querySelector<HTMLElement>(
      'button[aria-label="Send Message"], button[data-testid="send-button"]'
    );
  },

  getMessageText() {
    const el = this.getInputElement();
    if (!el) return "";
    return el.innerText || el.textContent || "";
  },

  setMessageText(text: string) {
    const el = this.getInputElement();
    if (!el) return;
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
