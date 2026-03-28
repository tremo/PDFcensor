"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

type ExtPhase =
  | "idle"
  | "inputAppear"
  | "typing"
  | "typingDone"
  | "piiHighlight"
  | "toastAppear"
  | "maskClick"
  | "masking"
  | "success"
  | "reset";

const TIMELINE: { phase: ExtPhase; delay: number }[] = [
  { phase: "typing", delay: 3500 },
  { phase: "typingDone", delay: 800 },
  { phase: "piiHighlight", delay: 1500 },
  { phase: "toastAppear", delay: 1500 },
  { phase: "maskClick", delay: 1200 },
  { phase: "masking", delay: 1200 },
  { phase: "success", delay: 3000 },
  { phase: "reset", delay: 800 },
  { phase: "idle", delay: 1000 },
];

// Demo text segments — UK PII
const SEGMENTS = [
  { type: "text" as const, text: "My client " },
  { type: "pii" as const, id: "name", original: "James Wilson", masked: "[NAME]" },
  { type: "text" as const, text: ", NI: " },
  { type: "pii" as const, id: "ni", original: "AB 12 34 56 C", masked: "[NATIONAL ID]" },
  { type: "text" as const, text: ", email: " },
  { type: "pii" as const, id: "email", original: "j.wilson@example.com", masked: "[EMAIL]" },
];

const FULL_TEXT = SEGMENTS.map((s) =>
  s.type === "pii" ? s.original : s.text
).join("");

function ShieldIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function ExtensionDemo() {
  const t = useTranslations("extensionDemo");
  const [phase, setPhase] = useState<ExtPhase>("idle");
  const [charIndex, setCharIndex] = useState(0);
  const [isMasked, setIsMasked] = useState(false);
  const roundRef = useRef(0);

  const runDemo = useCallback(() => {
    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    for (const step of TIMELINE) {
      totalDelay += step.delay;
      timeouts.push(
        setTimeout(() => {
          setPhase(step.phase);
        }, totalDelay)
      );
    }

    return {
      cleanup: () => timeouts.forEach(clearTimeout),
      duration: totalDelay,
    };
  }, []);

  useEffect(() => {
    const cleanupRef = { current: () => {} };
    const cycleRef = { current: null as NodeJS.Timeout | null };

    const startCycle = () => {
      setPhase("idle");
      setCharIndex(0);
      setIsMasked(false);

      const { cleanup, duration } = runDemo();
      cleanupRef.current = cleanup;

      cycleRef.current = setTimeout(() => {
        cleanup();
        roundRef.current++;
        startCycle();
      }, duration + 200);
    };

    startCycle();

    return () => {
      cleanupRef.current();
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [runDemo]);

  // Typing effect
  useEffect(() => {
    if (phase !== "typing") return;
    setCharIndex(0);
    const typingDuration = TIMELINE.find((step) => step.phase === "typing")?.delay ?? 3500;
    const interval = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= FULL_TEXT.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, typingDuration / FULL_TEXT.length);
    return () => clearInterval(interval);
  }, [phase]);

  // Masking trigger
  useEffect(() => {
    if (phase === "masking") {
      const timer = setTimeout(() => setIsMasked(true), 200);
      return () => clearTimeout(timer);
    }
    if (phase === "idle" || phase === "reset") {
      setIsMasked(false);
    }
  }, [phase]);

  const showInput =
    phase !== "idle" && phase !== "reset" && phase !== "inputAppear";
  const isTyping = phase === "typing";
  const showCursor = phase === "typing" || phase === "typingDone";
  const piiDetected =
    phase === "piiHighlight" ||
    phase === "toastAppear" ||
    phase === "maskClick";
  const showToast =
    phase === "toastAppear" || phase === "maskClick";
  const maskHighlighted = phase === "maskClick";
  const showSuccess = phase === "success";
  const sendActive = isMasked || phase === "success";

  // Build displayed text with PII spans
  const renderText = () => {
    if (phase === "idle" || phase === "reset" || phase === "inputAppear") {
      return null;
    }

    const visibleText = isTyping || phase === "typingDone"
      ? FULL_TEXT.slice(0, charIndex)
      : FULL_TEXT;

    // For typing phase, just show plain text with cursor
    if (isTyping || phase === "typingDone") {
      return (
        <>
          {visibleText}
          {showCursor && <span className="ext-cursor" />}
        </>
      );
    }

    // For highlight/mask phases, render with PII spans
    let pos = 0;
    const elements: React.ReactNode[] = [];

    for (const seg of SEGMENTS) {
      if (seg.type === "text") {
        elements.push(<span key={pos}>{seg.text}</span>);
        pos += seg.text.length;
      } else {
        const displayText = isMasked ? seg.masked : seg.original;
        const piiClass = isMasked
          ? "ext-pii masked ext-pii-morph"
          : piiDetected
          ? "ext-pii detected"
          : "ext-pii";

        elements.push(
          <span key={pos} className={piiClass}>
            {displayText}
          </span>
        );
        pos += seg.original.length;
      }
    }

    return elements;
  };

  return (
    <div className="ext-demo-wrapper">
      <div className="relative">
        <div className="ext-demo-backdrop" />
        <div className="ext-demo-frame">
          {/* Header */}
          <div className="ext-demo-header">
            <div className="ext-demo-header-dot" />
            <span className="ext-demo-header-label">ChatGPT</span>
            <div className="ext-demo-header-right">
              <ShieldIcon size={18} className="ext-demo-shield" />
              <span className="ext-demo-pro-badge">PRO</span>
            </div>
          </div>

          {/* Chat area */}
          <div className="ext-demo-chat">
            {/* Input */}
            <div className={`ext-demo-input-wrap ${showInput ? "visible" : ""}`}>
              <div className="ext-demo-input-text">
                {renderText()}
              </div>
              <button className={`ext-demo-send-btn ${sendActive ? "active" : ""}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>

            {/* Toast */}
            {showToast && (
              <div className="ext-demo-toast">
                <div className="ext-toast-header">
                  <ShieldIcon size={16} className="ext-toast-shield" />
                  <span className="ext-toast-title">{t("toastCount", { count: 3 })}</span>
                </div>
                <div className="ext-toast-actions">
                  <button className={`ext-toast-btn mask ${maskHighlighted ? "highlighted" : ""}`}>
                    {t("btnMask")}
                  </button>
                  <button className="ext-toast-btn ignore">{t("btnIgnore")}</button>
                  <button className="ext-toast-btn review">{t("btnReview")}</button>
                </div>
              </div>
            )}

            {/* Success */}
            {showSuccess && (
              <div className="ext-demo-success">
                <div className="ext-demo-success-content">
                  <div className="ext-demo-success-icon">
                    <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="ext-demo-success-title">{t("successText")}</div>
                  <div className="ext-demo-success-badge">
                    <ShieldIcon size={14} />
                    {t("successBadge")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
