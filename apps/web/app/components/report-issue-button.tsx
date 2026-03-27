"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
  const [hovButton, setHovButton] = useState(false);
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAccessToken(session?.access_token ?? null);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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
    if (status === "error") setStatus("idle");
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

      const response = await fetch("/api/issues", {
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
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (status === "success") resetForm();
        }}
        onMouseEnter={() => setHovButton(true)}
        onMouseLeave={() => setHovButton(false)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          borderRadius: 999,
          background: "var(--tc-surface)",
          border: "2px solid var(--tc-border)",
          color: "var(--tc-muted)",
          fontFamily: "monospace",
          fontSize: 12,
          padding: "10px 18px",
          cursor: "pointer",
          boxShadow: `0 0 12px var(--tc-glow, rgba(0,212,255,0.15))`,
          transform: hovButton ? "translate(-2px,-2px)" : "none",
          transition: "all 0.1s ease",
        }}
        aria-label="Report Issue"
      >
        <span style={{ marginRight: 6 }}>&#9888;</span>
        Report Issue
      </button>

      {/* Slide-Up Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          bottom: 72,
          right: 24,
          zIndex: 50,
          width: 340,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "var(--tc-surface)",
          border: "2px solid var(--tc-border)",
          padding: 24,
          transform: open ? "translateY(0)" : "translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 300ms ease, opacity 300ms ease",
        }}
        role="dialog"
        aria-label="Report an issue"
      >
        {/* Header */}
        <div
          className="font-mono"
          style={{
            fontSize: 9,
            color: "var(--tc-primary)",
            letterSpacing: "0.12em",
            marginBottom: 20,
          }}
        >
          // REPORT ISSUE
        </div>

        {status === "success" ? (
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--tc-primary)",
              padding: "24px 0",
              textAlign: "center",
            }}
          >
            Thanks! We&apos;ll look into it.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Category */}
            <div>
              <div
                className="font-mono mb-1.5"
                style={{ fontSize: 10, color: "var(--tc-muted)" }}
              >
                <label htmlFor="report-category">Category</label>
              </div>
              <select
                id="report-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="w-full font-mono outline-none"
                style={{
                  background: "var(--tc-surface-overlay)",
                  border: "2px solid var(--tc-border)",
                  color: "var(--tc-text)",
                  fontSize: 12,
                  padding: "10px 14px",
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
            <div>
              <div
                className="font-mono mb-1.5"
                style={{ fontSize: 10, color: "var(--tc-muted)" }}
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
                className="w-full font-mono outline-none resize-y"
                style={{
                  background: "var(--tc-surface-overlay)",
                  border: "2px solid var(--tc-border)",
                  color: "var(--tc-text)",
                  fontSize: 12,
                  padding: "10px 14px",
                }}
              />
              <div
                className="font-mono text-right"
                style={{
                  fontSize: 9,
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
            <div>
              <div
                className="font-mono mb-1.5"
                style={{ fontSize: 10, color: "var(--tc-muted)" }}
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
                      onClick={() => setSeverity(s)}
                      disabled={isLoading}
                      className="font-mono flex-1"
                      style={{
                        borderRadius: 999,
                        border: `2px solid ${selected ? "var(--tc-primary)" : "var(--tc-border)"}`,
                        background: "transparent",
                        color: selected
                          ? "var(--tc-primary)"
                          : "var(--tc-muted)",
                        fontSize: 10,
                        padding: "6px 0",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        transition: "all 0.1s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screenshot */}
            <div>
              <div
                className="font-mono mb-1.5"
                style={{ fontSize: 10, color: "var(--tc-muted)" }}
              >
                Screenshot
              </div>
              <div
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
                className="font-mono text-center"
                style={{
                  border: `2px dashed ${dragging ? "var(--tc-primary)" : "var(--tc-border)"}`,
                  padding: "16px 12px",
                  cursor: "pointer",
                  fontSize: 10,
                  color: "var(--tc-muted)",
                  transition: "border-color 0.15s ease",
                }}
              >
                {screenshot ? (
                  <span style={{ color: "var(--tc-text)" }}>
                    {screenshot.name}
                  </span>
                ) : (
                  "Attach screenshot (optional)"
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
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
                    fontSize: 9,
                    color: "var(--tc-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: 4,
                    textDecoration: "underline",
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Email (anonymous only) */}
            {isAuthenticated === false && (
              <div>
                <div
                  className="font-mono mb-1.5"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  <label htmlFor="report-email">Email (optional)</label>
                </div>
                <input
                  id="report-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="your@email.com"
                  className="w-full font-mono outline-none"
                  style={{
                    background: "var(--tc-surface-overlay)",
                    border: "2px solid var(--tc-border)",
                    color: "var(--tc-text)",
                    fontSize: 12,
                    padding: "10px 14px",
                  }}
                />
              </div>
            )}

            {/* Error */}
            {status === "error" && errorMessage && (
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "#f87171",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  padding: "10px 14px",
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
              className="font-mono font-bold disabled:opacity-50"
              style={{
                background: hovSubmit ? "transparent" : "var(--tc-primary)",
                color: hovSubmit ? "var(--tc-primary)" : "var(--tc-bg)",
                border: "2px solid var(--tc-primary)",
                fontSize: 11,
                padding: "12px 28px",
                cursor: "pointer",
                boxShadow: hovSubmit
                  ? "4px 4px 0 var(--tc-primary, #6BAA8A)"
                  : "none",
                transform: hovSubmit ? "translate(-2px,-2px)" : "none",
                transition: "all 0.1s ease",
              }}
            >
              {isLoading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
