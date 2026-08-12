"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/api-url";
import { EVENTS, track } from "@/lib/analytics-events";

function DashboardButton({ primary, bg }: { primary: string; bg: string }) {
  const [hov, setHov] = useState(false);

  return (
    <Link
      href="/dashboard"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      style={{
        background: hov ? "transparent" : primary,
        color: hov ? primary : "var(--tc-on-primary)",
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

function ShareButton({
  border,
  text,
  worldSlug,
  shareUrl,
}: {
  border: string;
  text: string;
  worldSlug?: string;
  /** Public URL to copy. Without it this button copied the capstone
   *  page's own URL, which is auth-gated: recipients got a login wall
   *  (2026-07-14 UX audit). */
  shareUrl?: string;
}) {
  const [hov, setHov] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl ?? window.location.href);
      setCopied(true);
      track(EVENTS.PROGRESS_SHARED, {
        platform: "copy",
        ...(worldSlug ? { worldId: worldSlug } : {}),
      });
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
      className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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

/**
 * Certificate body for the brutalist certificate card.
 *
 * Fetches the user's certificate (or issues one idempotently via
 * `POST /api/certificates`) after mount. Issuing is server-gated, the
 * API refuses to insert until the user has actually completed the world.
 *
 * The server component already pre-filters the page to only render when
 * the world is complete, so the POST here is effectively a "claim my
 * cert" step.
 */
type CertStatus = "loading" | "ready" | "error";

interface CertificateCardProps {
  worldSlug: string;
  worldDisplayName: string;
  worldSpecialization: string;
  displayName: string;
  initialCertificate: {
    id: string;
    issued_at: string;
    cert_hash: string;
    pdf_url: string | null;
  } | null;
  primary: string;
  text: string;
  muted: string;
  surface: string;
  bg: string;
  stats: Array<{ value: string; label: string }>;
}

function CertificateCard({
  worldSlug,
  worldDisplayName,
  worldSpecialization,
  displayName,
  initialCertificate,
  primary,
  text,
  muted,
  surface,
  bg,
  stats,
}: CertificateCardProps) {
  const [cert, setCert] = useState(initialCertificate);
  const [status, setStatus] = useState<CertStatus>(
    initialCertificate ? "ready" : "loading",
  );
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (cert) {
      setStatus("ready");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setStatus("error");
          return;
        }

        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/certificates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ worldId: worldSlug }),
        });

        if (!res.ok) {
          if (!cancelled) setStatus("error");
          return;
        }

        const data = (await res.json()) as {
          id: string;
          world_id: string;
          issued_at: string;
          cert_hash: string;
          pdf_url?: string | null;
        };

        if (!cancelled) {
          setCert({
            id: data.id,
            issued_at: data.issued_at,
            cert_hash: data.cert_hash,
            pdf_url: data.pdf_url ?? null,
          });
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cert, worldSlug]);

  async function handleCopyShare() {
    if (!cert) return;
    try {
      const shareUrl = `${window.location.origin}/certificates/${cert.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      // Fire progress_shared, user copied a certificate share link.
      track(EVENTS.PROGRESS_SHARED, {
        platform: "copy",
        worldId: worldSlug,
      });
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // noop
    }
  }

  function handleDownload() {
    // V0.5 stub, pdf_url not yet generated server-side. Use the browser's
    // print dialog on the `.print-certificate` section. Falls back to the
    // hosted URL once backend generation lands.
    if (cert?.pdf_url) {
      window.open(cert.pdf_url, "_blank", "noopener,noreferrer");
      return;
    }
    window.print();
  }

  const issuedLabel = cert
    ? new Date(cert.issued_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const certNumber = cert
    ? `TC-${cert.id.slice(0, 8).toUpperCase()}`
    : "TC-XXXXXXXX";
  const hashPreview = cert ? cert.cert_hash.slice(0, 8).toUpperCase() : "";

  return (
    <div
      data-testid="certificate-card"
      className="relative overflow-hidden print-certificate brutalist-shadow rounded-none"
      style={{
        border: `2px solid ${primary}`,
        background: surface,
        padding: "40px 48px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          background: `color-mix(in srgb, ${primary} 4%, transparent)`,
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />
      <div
        className="font-mono mb-5 cert-accent"
        style={{
          fontSize: 9,
          color: primary,
          letterSpacing: "0.15em",
        }}
      >
        CERTIFICATE OF COMPLETION
      </div>

      <div
        className="font-mono font-bold mb-1.5"
        style={{ fontSize: 20, color: text }}
      >
        {worldDisplayName}: {worldSpecialization}
      </div>
      <div className="font-mono mb-6" style={{ fontSize: 12, color: muted }}>
        Issued to: {displayName}
        {issuedLabel && <> &middot; {issuedLabel}</>} &middot; Tensorcraft
      </div>

      {/* Cert metadata: square-bordered mono values (brutalist) */}
      <div className="flex flex-wrap gap-3 mb-6" data-testid="cert-meta">
        <div
          className="font-mono rounded-none"
          style={{
            border: `1px solid ${primary}`,
            padding: "6px 12px",
            fontSize: 10,
            color: primary,
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ color: muted }}>NO. </span>
          <span data-testid="cert-number">{certNumber}</span>
        </div>
        <div
          className="font-mono rounded-none"
          style={{
            border: `1px solid ${primary}`,
            padding: "6px 12px",
            fontSize: 10,
            color: primary,
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ color: muted }}>HASH </span>
          <span data-testid="cert-hash-preview">
            {hashPreview || "--------"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div
              className="font-mono font-bold"
              style={{ fontSize: 18, color: primary }}
            >
              {value}
            </div>
            <div
              className="font-mono mt-0.5"
              style={{ fontSize: 9, color: muted }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions, hidden when printing */}
      <div className="flex flex-wrap gap-3 mt-8 no-print">
        <button
          type="button"
          onClick={handleDownload}
          disabled={status !== "ready"}
          data-testid="download-pdf-button"
          className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          style={{
            background:
              status === "ready"
                ? primary
                : `color-mix(in srgb, ${primary} 33%, transparent)`,
            color: "var(--tc-on-primary)",
            border: `2px solid ${primary}`,
            fontSize: 11,
            padding: "10px 20px",
            cursor: status === "ready" ? "pointer" : "not-allowed",
          }}
        >
          {cert?.pdf_url ? <>Download PDF &darr;</> : "Print Certificate"}
        </button>
        <button
          type="button"
          onClick={handleCopyShare}
          disabled={status !== "ready"}
          data-testid="share-link-button"
          className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          style={{
            background: "transparent",
            color: text,
            border: `2px solid ${primary}`,
            fontSize: 11,
            padding: "10px 20px",
            cursor: status === "ready" ? "pointer" : "not-allowed",
          }}
        >
          {shareCopied ? "Link Copied!" : "Share Link"}
        </button>
      </div>

      {status === "loading" && !cert && (
        <div
          className="font-mono mt-4 no-print"
          style={{ fontSize: 10, color: muted }}
          data-testid="cert-loading"
        >
          issuing certificate...
        </div>
      )}
      {status === "error" && (
        <div
          className="font-mono mt-4 no-print"
          style={{ fontSize: 10, color: muted }}
          data-testid="cert-error"
        >
          could not load certificate; refresh to retry
        </div>
      )}
    </div>
  );
}

/**
 * Kept for backward compat with earlier renders; new UI uses the buttons
 * inside `CertificateCard` directly. This version still uses the browser
 * print dialog as the V0.5 PDF export path.
 */
function CertificateDownloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-mono font-semibold border-2 border-primary text-primary transition-all hover:bg-primary hover:text-on-primary rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      Print Certificate ↓
    </button>
  );
}

export const CapstoneClient = {
  DashboardButton,
  ShareButton,
  CertificateDownloadButton,
  CertificateCard,
};
