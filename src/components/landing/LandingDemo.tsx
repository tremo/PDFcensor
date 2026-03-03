"use client";

import { useState, useEffect, useCallback } from "react";

type DemoPhase =
  | "idle"
  | "fileDrop"
  | "docAppear"
  | "analyzing"
  | "piiReveal"
  | "confirmSSN"
  | "confirmRouting"
  | "confirmAccount"
  | "preview"
  | "success"
  | "reset";

export default function LandingDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");

  const runDemo = useCallback(() => {
    const timeline: { phase: DemoPhase; delay: number }[] = [
      { phase: "fileDrop", delay: 2000 },
      { phase: "docAppear", delay: 1200 },
      { phase: "analyzing", delay: 2200 },
      { phase: "piiReveal", delay: 1800 },
      { phase: "confirmSSN", delay: 1200 },
      { phase: "confirmRouting", delay: 800 },
      { phase: "confirmAccount", delay: 800 },
      { phase: "preview", delay: 1500 },
      { phase: "success", delay: 3000 },
      { phase: "reset", delay: 800 },
      { phase: "idle", delay: 1000 },
    ];

    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    for (const step of timeline) {
      totalDelay += step.delay;
      timeouts.push(
        setTimeout(() => {
          setPhase(step.phase);
        }, totalDelay)
      );
    }

    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    let cleanup = runDemo();
    const interval = setInterval(() => {
      cleanup();
      cleanup = runDemo();
    }, 17000);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [runDemo]);

  const showDoc = phase !== "idle" && phase !== "fileDrop" && phase !== "reset";
  const showAnalyzing = phase === "analyzing";
  const showPII =
    phase === "piiReveal" ||
    phase === "confirmSSN" ||
    phase === "confirmRouting" ||
    phase === "confirmAccount" ||
    phase === "preview";
  const ssnConfirmed =
    phase === "confirmSSN" ||
    phase === "confirmRouting" ||
    phase === "confirmAccount" ||
    phase === "preview";
  const routingConfirmed =
    phase === "confirmRouting" ||
    phase === "confirmAccount" ||
    phase === "preview";
  const accountConfirmed = phase === "confirmAccount" || phase === "preview";
  const showSuccess = phase === "success";
  const showGuidance = showPII;
  const showControls = showDoc && !showSuccess;
  const showBottomBar = showDoc && !showSuccess;
  const showFab = showDoc && !showAnalyzing && !showSuccess;

  const fabText = phase === "preview" ? "Download" : "Review";
  const fabClass = phase === "preview" ? "download" : "review";

  return (
    <div className="mt-12 md:mt-16 relative">
      <div className="demo-wrapper">
        <div className="relative">
          <div className="demo-backdrop" />
          <div className="demo-frame">
            {/* Demo Header */}
            <div className="demo-header">
              <div className="demo-logo">
                <svg className="demo-logo-icon" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M6 8 Q24 2 42 8 L42 28 Q42 40 24 46 Q6 40 6 28 Z"
                    fill="#3b82f6"
                  />
                  <rect x="12" y="18" width="24" height="5" rx="1.5" fill="white" />
                  <rect x="12" y="26" width="17" height="5" rx="1.5" fill="white" />
                </svg>
                <div className="demo-logo-text">
                  Safe<span>Redact</span>
                </div>
              </div>
              <div className="demo-header-right">
                <span className="demo-plan-badge">Pro</span>
                <span className="demo-usage">47 docs left</span>
                <div className="demo-avatar">P</div>
              </div>
            </div>

            {/* Demo Viewer */}
            <div className="demo-viewer">
              {/* Start Screen */}
              <div
                className={`demo-start-screen ${showDoc ? "hidden" : ""}`}
              >
                <div className="demo-dropzone">
                  <div className="demo-upload-icon">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                    >
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="demo-dropzone-title">Drop your document here</div>
                  <div className="demo-dropzone-subtitle">or click to browse</div>
                  <div className="demo-dropzone-formats">PDF, JPG, PNG</div>
                </div>
                <div className="demo-feature-cards">
                  <div className="demo-feature-card">
                    <div className="demo-feature-icon blue">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="demo-feature-title">AI Detection</div>
                    <div className="demo-feature-text">Finds SSNs, names, addresses automatically.</div>
                  </div>
                  <div className="demo-feature-card">
                    <div className="demo-feature-icon green">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="demo-feature-title">Files Stay Private</div>
                    <div className="demo-feature-text">Only text sent for detection.</div>
                  </div>
                  <div className="demo-feature-card">
                    <div className="demo-feature-icon purple">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="demo-feature-title">Visual Review</div>
                    <div className="demo-feature-text">Approve, reject, or add manually.</div>
                  </div>
                </div>
              </div>

              {/* File Drop Animation */}
              <svg
                className={`demo-file-drop ${phase === "fileDrop" ? "active" : ""}`}
                viewBox="0 0 60 72"
              >
                <rect x="4" y="4" width="52" height="64" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <path d="M40 4v12a4 4 0 004 4h12" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
                <rect x="12" y="28" width="28" height="4" rx="2" fill="#cbd5e1" />
                <rect x="12" y="36" width="22" height="4" rx="2" fill="#cbd5e1" />
                <rect x="12" y="44" width="26" height="4" rx="2" fill="#cbd5e1" />
                <rect x="12" y="52" width="18" height="4" rx="2" fill="#cbd5e1" />
              </svg>

              {/* Zoom Controls */}
              {showControls && (
                <div className="demo-controls">
                  <button className="demo-zoom-btn">&minus;</button>
                  <span className="demo-zoom-level">100%</span>
                  <button className="demo-zoom-btn">+</button>
                  <div className="demo-controls-divider" />
                  <button className="demo-zoom-btn">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Review & Edit Card */}
              {showGuidance && (
                <div className="demo-guidance">
                  <div className="demo-guidance-header">
                    <span className="demo-guidance-title">Review &amp; Edit</span>
                    <button className="demo-guidance-close">&times;</button>
                  </div>
                  <div className="demo-guidance-text">
                    Click <span className="green">&check;</span> to redact or &times; to
                    dismiss detected items.
                    <br />
                    Drag on empty space to draw a box.
                  </div>
                  <div className="demo-guidance-legend">
                    <div className="demo-legend-item">
                      <div className="demo-legend-box detected" />
                      <span>Detected</span>
                    </div>
                    <div className="demo-legend-item">
                      <div className="demo-legend-box redact" />
                      <span>Will redact</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay Stub Document */}
              <div className={`demo-document ${showDoc ? "visible" : ""}`}>
                <div className="ps-header">
                  <div className="ps-company">ACME CORPORATION</div>
                  <div className="ps-address">123 Business Plaza, Anytown, US 00000</div>
                </div>
                <div className="ps-title">EARNINGS STATEMENT</div>
                <div className="ps-period">Pay Period: Dec 1 - Dec 15, 2025</div>
                <div className="ps-employee-row">
                  <div className="ps-info">
                    <div className="ps-label">Employee</div>
                    <div className="ps-value">Jane Doe</div>
                  </div>
                  <div className="ps-info">
                    <div className="ps-label">SSN</div>
                    <div
                      className={`ps-value pii ${showPII ? "revealed" : ""} ${ssnConfirmed ? "confirmed" : ""}`}
                    >
                      <span className="pii-text">000-12-3456</span>
                      {showPII && !ssnConfirmed && (
                        <div className="pii-actions">
                          <div className="pii-btn confirm">&check;</div>
                          <div className="pii-btn reject">&times;</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ps-table">
                  <div className="ps-table-header">
                    <span>Earnings</span>
                    <span>Hours</span>
                    <span>Rate</span>
                    <span>Current</span>
                    <span>YTD</span>
                  </div>
                  <div className="ps-table-row">
                    <span>Regular</span>
                    <span>80.00</span>
                    <span>45.00</span>
                    <span>3,600.00</span>
                    <span>86,400.00</span>
                  </div>
                </div>

                <div className="ps-table">
                  <div className="ps-table-header">
                    <span>Deductions</span>
                    <span></span>
                    <span></span>
                    <span>Current</span>
                    <span>YTD</span>
                  </div>
                  <div className="ps-table-row">
                    <span>Federal Tax</span>
                    <span></span>
                    <span></span>
                    <span>612.00</span>
                    <span>14,688.00</span>
                  </div>
                  <div className="ps-table-row">
                    <span>State Tax</span>
                    <span></span>
                    <span></span>
                    <span>180.00</span>
                    <span>4,320.00</span>
                  </div>
                  <div className="ps-table-row">
                    <span>Social Security</span>
                    <span></span>
                    <span></span>
                    <span>223.20</span>
                    <span>5,356.80</span>
                  </div>
                </div>

                <div className="ps-net">
                  <span className="ps-net-label">Net Pay</span>
                  <span className="ps-net-amount">$2,584.80</span>
                </div>

                <div className="ps-deposit">
                  <div className="ps-deposit-label">Direct Deposit</div>
                  <div className="ps-deposit-row">
                    <div className="ps-deposit-item">
                      <span className="ps-label">Bank Routing</span>
                      <div
                        className={`ps-value pii ${showPII ? "revealed" : ""} ${routingConfirmed ? "confirmed" : ""}`}
                      >
                        <span className="pii-text">021000021</span>
                        {showPII && !routingConfirmed && (
                          <div className="pii-actions">
                            <div className="pii-btn confirm">&check;</div>
                            <div className="pii-btn reject">&times;</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ps-deposit-item">
                      <span className="ps-label">Account No.</span>
                      <div
                        className={`ps-value pii ${showPII ? "revealed" : ""} ${accountConfirmed ? "confirmed" : ""}`}
                      >
                        <span className="pii-text">****4567</span>
                        {showPII && !accountConfirmed && (
                          <div className="pii-actions">
                            <div className="pii-btn confirm">&check;</div>
                            <div className="pii-btn reject">&times;</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAB */}
              {showFab && (
                <div className="demo-fab">
                  <div className={`demo-fab-btn ${fabClass}`}>
                    <span>{fabText}</span>
                  </div>
                </div>
              )}

              {/* Bottom Bar */}
              {showBottomBar && (
                <div className="demo-bottom-bar">
                  <span className="demo-back-btn">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                  <span className="demo-filename">paystub_jane_doe_dec2025.pdf</span>
                </div>
              )}

              {/* Analyzing Overlay */}
              {showAnalyzing && (
                <div className="demo-analyzing">
                  <div className="demo-analyzing-spinner" />
                  <div className="demo-analyzing-text">
                    Analyzing by <span>SafeRedact AI</span>
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {showSuccess && (
                <div className="demo-success">
                  <div className="demo-success-content">
                    <div className="demo-success-icon">
                      <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="demo-success-title">Safe to Share</div>
                    <div className="demo-success-text">
                      Sensitive data removed permanently.
                      <br />
                      Your document is ready.
                    </div>
                    <div className="demo-success-badge">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Redaction Successful
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
