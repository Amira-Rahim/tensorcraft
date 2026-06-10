"use client";

import { useState, useEffect, type ReactNode } from "react";

interface CodeBlockProps {
  language?: string;
  title?: string;
  children: ReactNode;
}

import { tensorcraftTheme } from "./tensorcraft-theme";

// Lazy-loaded Shiki highlighter with custom Tensorcraft theme
let highlighterPromise: Promise<{
  codeToHtml: (code: string, opts: { lang: string; theme: string }) => string;
}> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: [tensorcraftTheme],
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
          theme: "tensorcraft-dark",
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
    <div className="overflow-hidden my-8 brutalist-shadow bg-surface border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-xs font-medium text-text-muted">{title}</span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider px-1.5 py-0.5 text-primary bg-primary/10">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`text-xs font-mono px-2 py-1 transition-colors brutalist-hover ${
            copied ? "text-primary" : "text-text-muted"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code - highlighted or fallback */}
      {highlightedHtml ? (
        <div
          className="overflow-x-auto [&_pre]:p-5 [&_pre]:m-0 [&_pre]:bg-transparent [&_code]:text-sm [&_code]:leading-loose"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto p-5">
          <code className="text-sm leading-loose text-text-primary/85">
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}
