"use client";

import { useState, type FormEvent } from "react";
import { submitWaitlist } from "@/lib/waitlist";
import type { ThemePalette } from "@tensorcraft/themes";

interface Props {
  themeSlug: string;
  themeName: string;
  palette: ThemePalette;
}

export function ThemeWaitlistForm({ themeSlug, themeName, palette }: Props) {
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
    const result = await submitWaitlist(trimmed, themeSlug, "coming-soon-stub");
    setStatus(result);
  }

  if (status === "done") {
    return (
      <div
        role="status"
        data-testid="theme-waitlist-success"
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
        htmlFor={`waitlist-${themeSlug}`}
        className="font-mono text-xs uppercase"
        style={{ color: palette.muted, letterSpacing: "0.15em" }}
      >
        Notify me when {themeName} ships
      </label>
      <div className="flex gap-2">
        <input
          id={`waitlist-${themeSlug}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          disabled={status === "submitting"}
          data-testid={`theme-waitlist-input-${themeSlug}`}
          className="flex-1 border-2 px-4 py-3 font-mono text-sm rounded-none focus:outline-none"
          style={{
            borderColor: palette.border,
            background: palette.bg,
            color: palette.text,
          }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          data-testid={`theme-waitlist-submit-${themeSlug}`}
          className="font-mono px-5 py-3 text-sm font-medium uppercase tracking-wider border-2 rounded-none disabled:opacity-60"
          style={{
            background: palette.primary,
            borderColor: palette.primary,
            color: palette.bg,
          }}
        >
          {status === "submitting" ? "..." : "Notify"}
        </button>
      </div>
      {status === "error" ? (
        <p role="alert" className="font-mono text-xs text-red-400">
          Couldn&rsquo;t submit. Check the address and try again.
        </p>
      ) : null}
    </form>
  );
}
