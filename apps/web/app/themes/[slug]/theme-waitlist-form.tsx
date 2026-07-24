"use client";

import { useState, type FormEvent } from "react";
import { submitWaitlist } from "@/lib/waitlist";
import type { ThemePalette } from "@tensorcraft/themes";

interface Props {
  themeSlug: string;
  themeName: string;
  palette: ThemePalette;
  /** Distinguishes multiple forms on one page; appended to ids/testids */
  idSuffix?: string;
  /** Analytics source recorded in the waitlist table */
  source?: string;
  /** Submit button label */
  ctaLabel?: string;
}

export function ThemeWaitlistForm({
  themeSlug,
  themeName,
  palette,
  idSuffix,
  source = "coming-soon-stub",
  ctaLabel = "Notify",
}: Props) {
  const suffix = idSuffix ? `-${idSuffix}` : "";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const result = await submitWaitlist(trimmed, themeSlug, source);
    setStatus(result);
  }

  if (status === "done") {
    return (
      <div
        role="status"
        data-testid={`theme-waitlist-success${suffix}`}
        className="border-2 px-4 py-3 font-mono text-sm rounded-none"
        style={{
          borderColor: palette.primary,
          background: `color-mix(in srgb, ${palette.primary} 12%, transparent)`,
          color: palette.primary,
        }}
      >
        You&rsquo;re on the {themeName} waitlist. We&rsquo;ll email you the
        moment it ships.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label
        htmlFor={`waitlist-${themeSlug}${suffix}`}
        className="font-mono text-xs uppercase"
        style={{ color: "var(--tc-muted)", letterSpacing: "0.15em" }}
      >
        Notify me when {themeName} ships
      </label>
      <div className="flex gap-2">
        <input
          id={`waitlist-${themeSlug}${suffix}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          disabled={status === "submitting"}
          data-testid={`theme-waitlist-input-${themeSlug}${suffix}`}
          // `focus:outline-none` was removed here. It suppressed the global
          // *:focus-visible outline, and because `borderColor` is set as an
          // INLINE style, no focus:border-* class could have substituted for
          // it either — inline styles beat stylesheet rules regardless of
          // specificity. The result was a form field with NO focus indicator
          // at all, on the waitlist capture that appears on all four
          // coming-soon theme pages. WCAG 2.4.7.
          //
          // `outlineColor` is set inline so the restored ring matches the
          // per-theme palette: the global rule uses the `outline` shorthand,
          // and an inline longhand still wins over it.
          className="flex-1 border-2 px-4 py-3 font-mono text-sm rounded-none"
          style={{
            borderColor: "var(--tc-border-interactive)",
            background: "var(--tc-bg)",
            color: "var(--tc-text)",
            outlineColor: palette.primary,
          }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          data-testid={`theme-waitlist-submit-${themeSlug}${suffix}`}
          className="font-mono px-5 py-3 text-sm font-medium uppercase tracking-wider border-2 rounded-none disabled:opacity-60"
          style={{
            background: palette.primary,
            borderColor: palette.primary,
            // Ink paired to the fixed brand-green fill; must not follow
            // scheme. This label sits on `palette.primary` (the literal
            // brand-green hex, unaffected by light/dark), not on the page
            // background — `var(--tc-bg)` flips to near-white in light
            // scheme, which against the same green fill drops to ~2.5:1
            // (AA fail). The dark neutral is the correct fixed pairing in
            // both schemes.
            color: "#181818",
          }}
        >
          {status === "submitting" ? "..." : ctaLabel}
        </button>
      </div>
      {status === "error" ? (
        <p role="alert" className="font-mono text-xs text-error">
          Couldn&rsquo;t submit. Check the address and try again.
        </p>
      ) : null}
    </form>
  );
}
