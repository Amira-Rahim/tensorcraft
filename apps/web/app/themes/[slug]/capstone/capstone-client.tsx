"use client";

import { useState } from "react";
import Link from "next/link";

function DashboardButton({ primary, bg }: { primary: string; bg: string }) {
  const [hov, setHov] = useState(false);

  return (
    <Link
      href="/dashboard"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="font-mono font-bold"
      style={{
        background: hov ? "transparent" : primary,
        color: hov ? primary : bg,
        border: `2px solid ${primary}`,
        fontSize: 11,
        padding: "8px 20px",
        boxShadow: hov
          ? `4px 4px 0 color-mix(in srgb, var(--tc-primary) 30%, transparent)`
          : "none",
        transform: hov ? "translate(-2px,-2px)" : "none",
        transition: "all 0.1s ease",
      }}
    >
      Dashboard &rarr;
    </Link>
  );
}

function ShareButton({ border, text }: { border: string; text: string }) {
  const [hov, setHov] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="font-mono"
      style={{
        background: "transparent",
        color: text,
        border: `2px solid ${border}`,
        fontSize: 12,
        padding: "12px 28px",
        cursor: "pointer",
        boxShadow: hov
          ? `3px 3px 0 color-mix(in srgb, var(--tc-primary) 15%, transparent)`
          : "none",
        transform: hov ? "translate(-1px,-1px)" : "none",
        transition: "all 0.1s ease",
      }}
    >
      {copied ? "Link Copied!" : "Share Certificate"}
    </button>
  );
}

function CertificateDownloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-mono font-semibold border-2 border-primary text-primary transition-all hover:bg-primary hover:text-[#1C1C1C]"
    >
      Download Certificate (PDF) ↓
    </button>
  );
}

export const CapstoneClient = {
  DashboardButton,
  ShareButton,
  CertificateDownloadButton,
};
