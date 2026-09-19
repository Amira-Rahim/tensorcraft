"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FocusTrap } from "@tensorcraft/ui/a11y";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const REPORT_EVENT = "tc-open-report";

/** Support access in lesson chrome, without covering the reading surface. */
export function ReportIssueTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={
        className ??
        "min-h-11 px-3 text-xs font-mono text-text-muted hover:text-text-primary"
      }
      aria-label="Report Issue"
      aria-haspopup="dialog"
      aria-controls="report-issue-panel"
      onClick={() => window.dispatchEvent(new Event(REPORT_EVENT))}
    >
      Report issue
    </button>
  );
}

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "content_issue", label: "Content Issue" },
  { value: "payment_problem", label: "Payment Problem" },
  { value: "other", label: "Other" },
] as const;

const SEVERITIES = ["low", "medium", "high", "critical"] as const;
type Severity = (typeof SEVERITIES)[number];

export function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("bug");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hovSubmit, setHovSubmit] = useState(false);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setAccessToken(session?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(REPORT_EVENT, show);
    return () => window.removeEventListener(REPORT_EVENT, show);
  }, []);

  const resetForm = useCallback(() => {
    setCategory("bug");
    setDescription("");
    setSeverity("medium");
    setScreenshot(null);
    setEmail("");
    setStatus("idle");
    setErrorMessage("");
  }, []);

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Screenshot must be under 5MB");
      setStatus("error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are accepted");
      setStatus("error");
      return;
    }
    setScreenshot(file);
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  async function handleSubmit() {
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters");
      setStatus("error");
      return;
    }
    if (description.length > 2000) {
      setErrorMessage("Description must be under 2000 characters");
      setStatus("error");
      return;
    }
    if (
      isAuthenticated === false &&
      (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    ) {
      setErrorMessage("A valid email is required");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("category", category);
    formData.append("description", description.trim());
    formData.append("severity", severity);

    if (!isAuthenticated && email) {
      formData.append("email", email);
    }

    if (screenshot) {
      formData.append("screenshot", screenshot);
    }

    const context = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    formData.append("context", JSON.stringify(context));

    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const { getApiUrl } = await import("@/lib/api-url");
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/issues`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        let msg = "Failed to submit issue";
        try {
          const data = await response.json();
          msg = data.error || msg;
        } catch {
          // not JSON
        }
        setErrorMessage(msg);
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 3000);
    } catch {
      setErrorMessage("Network error. Please check your connection.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

  return (
    // `display: contents` keeps the wrapper out of the box layout while
    // letting the `data-ri-root` selector in the <style> block scope the
    // reduced-motion override to this widget only.
    <div data-ri-root style={{ display: "contents" }}>
      <style>{`
        @keyframes ri-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ri-field-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ri-glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes ri-scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(calc(80vh)); }
        }
        @keyframes ri-success-pop {
          0% { opacity: 0; transform: scale(0.6); }
          60% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ri-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-3px); }
          40%, 80% { transform: translateX(3px); }
        }

        /* Reduced-motion users: kill every animation in this widget. The
           drawer, scan line, glow pulse, success pop, and shake are pure
           decoration, the form remains usable without them. WCAG 2.3.3. */
        @media (prefers-reduced-motion: reduce) {
          [data-ri-root] *,
          [data-ri-root] *::before,
          [data-ri-root] *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <FocusTrap active={open} onEscape={() => setOpen(false)}>
        {open && (
          <div
            className="fixed inset-0 z-50 bg-black/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
        )}
        <div
          id="report-issue-panel"
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: "max(16px, env(safe-area-inset-bottom))",
            right: 16,
            zIndex: 50,
            width: "min(400px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 32px)",
            overscrollBehavior: "contain",
            overflowY: open ? "auto" : "hidden",
            overflowX: "hidden",
            background:
              "color-mix(in srgb, var(--tc-surface) 85%, transparent)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--tc-border)",
            borderRadius: 8,
            boxShadow: open
              ? `4px 4px 0 color-mix(in srgb, var(--tc-primary) 35%, transparent), 0 24px 48px rgba(0,0,0,0.4)`
              : "none",
            animation: open ? "ri-slide-up 0.25s ease-out both" : "none",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transform: open ? undefined : "translateY(16px) scale(0.98)",
            transition: open
              ? "none"
              : "opacity 0.15s ease, transform 0.15s ease",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Report an issue"
          // Keep form state across closes while removing the closed panel
          // from layout, keyboard navigation and the accessibility tree.
          hidden={!open}
          inert={!open}
        >
          {/* Grid overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              pointerEvents: "none",
              backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 39px,
                color-mix(in srgb, var(--tc-primary) 3%, transparent) 39px,
                color-mix(in srgb, var(--tc-primary) 3%, transparent) 40px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 39px,
                color-mix(in srgb, var(--tc-primary) 3%, transparent) 39px,
                color-mix(in srgb, var(--tc-primary) 3%, transparent) 40px
              )
            `,
              opacity: 0.5,
              zIndex: 0,
            }}
          />

          {/* Scan line effect */}
          {open && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 1,
                  background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--tc-primary) 20%, transparent), transparent)`,
                  animation: "ri-scan 3s linear infinite",
                }}
              />
            </div>
          )}

          {/* Top neon accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: 1,
              background: `linear-gradient(90deg, transparent, var(--tc-primary), transparent)`,
              animation: "ri-glow-pulse 2s ease-in-out infinite",
              zIndex: 1,
            }}
          />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: 24 }}>
            <button
              type="button"
              className="mb-4 ml-auto block min-h-11 px-3 text-sm font-mono text-text-muted"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            {/* Header */}
            <div
              className="font-mono"
              style={{
                fontSize: 12,
                color: "var(--tc-primary)",
                letterSpacing: "0.15em",
                marginBottom: 20,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 1,
                  background: "var(--tc-primary)",
                }}
              />
              Report Issue
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--tc-primary) 30%, transparent), transparent)",
                }}
              />
            </div>

            {status === "success" ? (
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: "var(--tc-primary)",
                  padding: "32px 0",
                  textAlign: "center",
                  animation: "ri-success-pop 0.3s ease-out both",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "2px solid var(--tc-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <span style={{ fontSize: 16 }}>&#10003;</span>
                </div>
                Thanks! We&apos;ll look into it.
                <div
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--tc-muted)",
                    marginTop: 6,
                  }}
                >
                  Closing in 3s...
                </div>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 16 }}>
                {/* Category */}
                <div
                  style={{
                    animation: open
                      ? "ri-field-in 0.3s ease-out 0.05s both"
                      : "none",
                  }}
                >
                  <div
                    className="font-mono mb-1.5"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    <label htmlFor="report-category">Category</label>
                  </div>
                  <select
                    id="report-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isLoading}
                    className="w-full font-mono focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    style={{
                      background:
                        "color-mix(in srgb, var(--tc-bg) 60%, transparent)",
                      border: "1px solid var(--tc-border-interactive)",
                      color: "var(--tc-text)",
                      fontSize: 16,
                      padding: "8px 12px",
                      borderRadius: 0,
                      WebkitAppearance: "none",
                      appearance: "none" as const,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238a8a8a'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      cursor: "pointer",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div
                  style={{
                    animation: open
                      ? "ri-field-in 0.3s ease-out 0.1s both"
                      : "none",
                  }}
                >
                  <div
                    className="font-mono mb-1.5"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    <label htmlFor="report-description">Description</label>
                  </div>
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={10}
                    maxLength={2000}
                    placeholder="Describe the issue..."
                    rows={4}
                    className="w-full font-mono resize-y focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    style={{
                      background:
                        "color-mix(in srgb, var(--tc-bg) 60%, transparent)",
                      border: "1px solid var(--tc-border-interactive)",
                      color: "var(--tc-text)",
                      fontSize: 16,
                      padding: "8px 12px",
                    }}
                  />
                  <div
                    className="font-mono text-right"
                    style={{
                      fontSize: 12,
                      color:
                        description.length > 1900
                          ? "var(--tc-primary)"
                          : "var(--tc-muted)",
                      marginTop: 2,
                    }}
                  >
                    {description.length}/2000
                  </div>
                </div>

                {/* Severity */}
                <div
                  style={{
                    animation: open
                      ? "ri-field-in 0.3s ease-out 0.15s both"
                      : "none",
                  }}
                >
                  <div
                    className="font-mono mb-1.5"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Severity
                  </div>
                  <div className="flex gap-1.5">
                    {SEVERITIES.map((s) => {
                      const selected = severity === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSeverity(s)}
                          disabled={isLoading}
                          className="font-mono flex-1"
                          style={{
                            borderRadius: 999,
                            border: `1px solid ${selected ? "var(--tc-primary)" : "var(--tc-border-interactive)"}`,
                            background: selected
                              ? "color-mix(in srgb, var(--tc-primary) 10%, transparent)"
                              : "transparent",
                            color: selected
                              ? "var(--tc-primary)"
                              : "var(--tc-muted)",
                            fontSize: 12,
                            padding: "5px 0",
                            cursor: "pointer",
                            textTransform: "capitalize",
                            letterSpacing: "0.05em",
                            transition: "all 0.1s ease",
                            boxShadow: selected
                              ? "2px 2px 0 color-mix(in srgb, var(--tc-primary) 35%, transparent)"
                              : "none",
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Screenshot */}
                <div
                  style={{
                    animation: open
                      ? "ri-field-in 0.3s ease-out 0.2s both"
                      : "none",
                  }}
                >
                  <div
                    className="font-mono mb-1.5"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Screenshot
                  </div>
                  <button
                    type="button"
                    disabled={isLoading}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleFileChange(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="font-mono text-center w-full"
                    style={{
                      border: `1px dashed ${dragging ? "var(--tc-primary)" : "var(--tc-border-interactive)"}`,
                      background: dragging
                        ? "color-mix(in srgb, var(--tc-primary) 5%, transparent)"
                        : "transparent",
                      padding: "14px 12px",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      transition: "all 0.15s ease",
                      borderRadius: 2,
                    }}
                  >
                    {screenshot ? (
                      <span style={{ color: "var(--tc-text)" }}>
                        {screenshot.name}
                      </span>
                    ) : (
                      <>
                        <span style={{ opacity: 0.5 }}>+</span> Attach
                        screenshot (optional)
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    tabIndex={-1}
                    data-focus-trap-ignore
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    disabled={isLoading}
                    style={{ display: "none" }}
                  />
                  {screenshot && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshot(null);
                      }}
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--tc-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginTop: 4,
                        letterSpacing: "0.05em",
                      }}
                    >
                      [remove]
                    </button>
                  )}
                </div>

                {/* Email (anonymous only) */}
                {isAuthenticated === false && (
                  <div
                    style={{
                      animation: open
                        ? "ri-field-in 0.3s ease-out 0.25s both"
                        : "none",
                    }}
                  >
                    <div
                      className="font-mono mb-1.5"
                      style={{
                        fontSize: 12,
                        color: "var(--tc-muted)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      <label htmlFor="report-email">
                        Email (for follow-up)
                      </label>
                    </div>
                    <input
                      id="report-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      placeholder="your@email.com"
                      className="w-full font-mono focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      style={{
                        background:
                          "color-mix(in srgb, var(--tc-bg) 60%, transparent)",
                        border: "1px solid var(--tc-border-interactive)",
                        color: "var(--tc-text)",
                        fontSize: 16,
                        padding: "8px 12px",
                      }}
                    />
                  </div>
                )}

                {/* Error */}
                {status === "error" && errorMessage && (
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-primary)",
                      background:
                        "color-mix(in srgb, var(--tc-primary) 6%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)",
                      padding: "8px 12px",
                      borderRadius: 2,
                      animation: "ri-shake 0.3s ease-out",
                    }}
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  onMouseEnter={() => setHovSubmit(true)}
                  onMouseLeave={() => setHovSubmit(false)}
                  disabled={isLoading || !description.trim()}
                  className="font-mono font-bold disabled:opacity-40"
                  style={{
                    marginTop: 4,
                    background: hovSubmit ? "transparent" : "var(--tc-primary)",
                    color: hovSubmit
                      ? "var(--tc-primary)"
                      : "var(--tc-on-primary)",
                    border: "1px solid var(--tc-primary)",
                    fontSize: 12,
                    padding: "10px 24px",
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: hovSubmit
                      ? `4px 4px 0 color-mix(in srgb, var(--tc-primary) 35%, transparent)`
                      : "none",
                    transform: hovSubmit ? "translate(-2px, -2px)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  {isLoading ? "Transmitting..." : "Submit Report"}
                </button>

                {/* Auto-context note */}
                <div
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--tc-muted)",
                    letterSpacing: "0.05em",
                    textAlign: "center",
                  }}
                >
                  page url + browser info captured automatically
                </div>
              </div>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
