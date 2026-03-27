import type { SiteAdapter } from "./types";

/** Microsoft Copilot adapter */
export const copilotAdapter: SiteAdapter = {
  name: "Copilot",
  hostnames: ["copilot.microsoft.com"],

  getInputElement() {
    return document.querySelector<HTMLElement>(
      'textarea#userInput, textarea[placeholder], #searchbox textarea'
    );
  },

  getSendButton() {
    return document.querySelector<HTMLElement>(
      'button[aria-label="Submit"], button.submit-button, button[type="submit"]'
    );
  },

  getMessageText() {
    const el = this.getInputElement();
    if (!el) return "";
    if (el instanceof HTMLTextAreaElement) return el.value;
    return el.innerText || el.textContent || "";
  },

  setMessageText(text: string) {
    const el = this.getInputElement();
    if (!el) return;
    if (el instanceof HTMLTextAreaElement) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, "value"
      )?.set;
      nativeInputValueSetter?.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.innerText = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
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
      if (target instanceof HTMLTextAreaElement) {
        target.addEventListener("input", callback);
        return () => target.removeEventListener("input", callback);
      }
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
