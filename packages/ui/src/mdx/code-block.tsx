"use client";

import { useState, useEffect, type ReactNode } from "react";

interface CodeBlockProps {
  language?: string;
  title?: string;
  children: ReactNode;
}

// Lazy-loaded Shiki highlighter
let highlighterPromise: Promise<{
  codeToHtml: (code: string, opts: { lang: string; theme: string }) => string;
}> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: ["github-dark-default"],
        langs: [
          "typescript",
          "javascript",
          "tsx",
          "jsx",
          "python",
          "json",
          "bash",
          "html",
          "css",
          "yaml",
          "markdown",
        ],
      }),
    );
  }
  return highlighterPromise;
}

export function CodeBlock({
  language = "typescript",
  title,
  children,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const code =
    typeof children === "string" ? children.trim() : String(children).trim();

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const html = highlighter.codeToHtml(code, {
          lang: language,
          theme: "github-dark-default",
        });
        setHighlightedHtml(html);
      })
      .catch(() => {
        // Fallback: leave unhighlighted
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

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
          type="button"
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

      {/* Code — highlighted or fallback */}
      {highlightedHtml ? (
        <div
          className="overflow-x-auto [&_pre]:p-4 [&_pre]:m-0 [&_pre]:bg-transparent [&_code]:text-sm [&_code]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto p-4">
          <code
            className="text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}
