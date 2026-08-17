"use client";

import { useState } from "react";
import { NewsletterModal } from "@/app/worlds/newsletter-modal";

/**
 * Client island for the dashboard's inert coming-soon world cards: the one
 * interactive element on the card. Opens the shared newsletter modal, which
 * renders null until opened, so per-card instances stay cheap. The parent
 * grid is a server component and cannot hold the modal state itself.
 */
export function NotifyMeButton({
  style,
  children,
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", ...style }}
      >
        {children}
      </button>
      <NewsletterModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
