"use client";

import { useState } from "react";
import { submitWaitlist } from "@/lib/waitlist";

interface NotifyMeButtonProps {
  themeId: string;
  themeName: string;
  accentColor: string;
  mutedColor: string;
}

export function NotifyMeButton({
  themeId,
  themeName,
  accentColor,
  mutedColor,
}: NotifyMeButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("saving");
    const result = await submitWaitlist(email, themeId, "theme-page");
    setStatus(result);
  }

  if (status === "done") {
    return (
      <span
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium"
        style={{ color: accentColor }}
      >
        You&apos;ll be notified when {themeName} launches
      </span>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-10 px-3 rounded-full text-sm text-white outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="h-10 px-4 rounded-full text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: accentColor, color: "#000" }}
        >
          {status === "saving" ? "..." : "Notify"}
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-colors hover:bg-white/[0.03]"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        color: mutedColor,
      }}
    >
      Notify Me
    </button>
  );
}
