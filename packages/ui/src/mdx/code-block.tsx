"use client";

import { useState, type ReactNode } from "react";

interface CodeBlockProps {
  language?: string;
  title?: string;
  children: ReactNode;
}

export function CodeBlock({
  language = "typescript",
  title,
  children,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const code =
    typeof children === "string" ? children.trim() : String(children).trim();

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-xl overflow-hidden my-6"
      style={{
        background: "var(--tc-bg, #0D1117)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          {title && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              {title}
            </span>
          )}
          <span
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: "var(--tc-accent, #00D4FF)",
              background: "rgba(0,212,255,0.1)",
            }}
          >
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{
            color: copied
              ? "var(--tc-accent, #00D4FF)"
              : "var(--tc-muted, #8B92A5)",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4">
        <code
          className="text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
