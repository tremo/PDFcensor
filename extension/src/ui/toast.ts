import type { PIIMatch } from "../lib/pii/types";

/** Actions the toast can trigger */
export interface ToastActions {
  matchCount: number;
  onMask: () => void;
  onIgnore: () => void;
  onReview: () => void;
}

/** Toast controller rendered inside Shadow DOM */
export interface ToastController {
  show(actions: ToastActions): void;
  showWarning(count: number): void;
  showLimit(): void;
  showDetails(matches: PIIMatch[]): void;
  hide(): void;
  destroy(): void;
}

const TOAST_STYLES = `
  :host { all: initial; }
  .pdfcensor-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  }
  .toast-card {
    background: #1a1a2e;
    color: #eee;
    border-radius: 12px;
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: slideIn 0.2s ease-out;
  }
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .toast-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .toast-icon { font-size: 20px; }
  .toast-title { font-weight: 600; flex: 1; }
  .toast-close {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
  }
  .toast-body { margin-bottom: 12px; color: #ccc; }
  .toast-actions {
    display: flex;
    gap: 8px;
  }
  .btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn-mask { background: #e74c3c; color: white; }
  .btn-ignore { background: #333; color: #ccc; }
  .btn-review { background: #2563eb; color: white; }
  .toast-warning {
    background: #f59e0b22;
    border: 1px solid #f59e0b;
    color: #f59e0b;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
  }
  .toast-limit {
    background: #ef444422;
    border: 1px solid #ef4444;
    color: #ef4444;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
  }
  .details-list {
    max-height: 200px;
    overflow-y: auto;
    margin: 8px 0;
  }
  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #333;
    font-size: 12px;
  }
  .detail-type { color: #f59e0b; font-weight: 500; }
  .detail-value { color: #888; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

export function createToast(): ToastController {
  const host = document.createElement("pdfcensor-toast");
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = TOAST_STYLES;
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "pdfcensor-toast";
  shadow.appendChild(container);

  document.body.appendChild(host);

  function render(html: string) {
    container.innerHTML = html;
  }

  return {
    show(actions: ToastActions) {
      render(`
        <div class="toast-card">
          <div class="toast-header">
            <span class="toast-icon">&#x26a0;</span>
            <span class="toast-title">${actions.matchCount} hassas veri tespit edildi</span>
            <button class="toast-close" data-action="close">&times;</button>
          </div>
          <div class="toast-body">
            Mesaj\u0131n\u0131zda ki\u015fisel veriler bulundu. G\u00f6ndermeden \u00f6nce maskelemek ister misiniz?
          </div>
          <div class="toast-actions">
            <button class="btn btn-mask" data-action="mask">Maskele</button>
            <button class="btn btn-ignore" data-action="ignore">Yoksay</button>
            <button class="btn btn-review" data-action="review">\u0130ncele</button>
          </div>
        </div>
      `);

      container.querySelector('[data-action="mask"]')?.addEventListener("click", actions.onMask);
      container.querySelector('[data-action="ignore"]')?.addEventListener("click", actions.onIgnore);
      container.querySelector('[data-action="review"]')?.addEventListener("click", actions.onReview);
      container.querySelector('[data-action="close"]')?.addEventListener("click", () => this.hide());
    },

    showWarning(count: number) {
      render(`
        <div class="toast-warning">
          &#x26a0; ${count} hassas veri tespit edildi \u2014 g\u00f6ndermeden \u00f6nce kontrol edin.
        </div>
      `);
    },

    showLimit() {
      render(`
        <div class="toast-limit">
          G\u00fcnl\u00fck \u00fccretsiz tarama limitinize ula\u015ft\u0131n\u0131z. Pro'ya ge\u00e7in.
        </div>
      `);
      setTimeout(() => this.hide(), 5000);
    },

    showDetails(matches: PIIMatch[]) {
      const items = matches
        .map(
          (m) =>
            `<div class="detail-item">
              <span class="detail-type">${m.type}</span>
              <span class="detail-value">${escapeHtml(m.value.slice(0, 30))}${m.value.length > 30 ? "..." : ""}</span>
            </div>`
        )
        .join("");

      render(`
        <div class="toast-card">
          <div class="toast-header">
            <span class="toast-title">Tespit Edilen Veriler (${matches.length})</span>
            <button class="toast-close" data-action="close">&times;</button>
          </div>
          <div class="details-list">${items}</div>
        </div>
      `);

      container.querySelector('[data-action="close"]')?.addEventListener("click", () => this.hide());
    },

    hide() {
      container.innerHTML = "";
    },

    destroy() {
      host.remove();
    },
  };
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
