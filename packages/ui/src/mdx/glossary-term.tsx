"use client";

import { useLayoutEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DocumentationLink,
  type DocumentationLinkTarget,
} from "./documentation-link";

interface GlossaryTermProps {
  term: string;
  definition?: string;
  documentation?: DocumentationLinkTarget;
  children: React.ReactNode;
}

/** A definition shown under the term when it is activated (click, Enter or Space). */
export function GlossaryTerm({
  term,
  definition,
  documentation,
  children,
}: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(360, window.innerWidth - 32);
      const height = popup.current?.offsetHeight ?? 160;
      // The consent bar publishes its height on <html> while it shows
      // (apps/web/app/components/cookie-consent.tsx): keep the popover
      // above it. It reads 0 once a choice is made, and in jsdom.
      const reserved =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tc-consent-h",
          ),
        ) || 0;
      setPosition({
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: Math.max(
          16,
          Math.min(
            rect.bottom + 8,
            window.innerHeight - height - 16 - reserved,
          ),
        ),
      });
    };
    const dismiss = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }
      // The note is portaled to the end of the document. Keep its controls
      // in the term's keyboard sequence, then return to the reading flow.
      if (
        event.key === "Tab" &&
        popup.current?.contains(document.activeElement)
      ) {
        const controls =
          popup.current.querySelectorAll<HTMLElement>("button, a[href]");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }
      }
    };
    place();
    popup.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-glossary-term={term}
        aria-label={term}
        aria-expanded={definition ? open : undefined}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? `${id}-definition` : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline cursor-help bg-transparent p-0 border-0 text-left"
        style={{
          color: "var(--tc-text)",
          borderBottom: "2px dotted var(--tc-accent)",
          background: open
            ? "color-mix(in srgb, var(--tc-accent) 16%, transparent)"
            : "transparent",
        }}
      >
        {children}
      </button>
      {open &&
        definition &&
        createPortal(
          <div
            ref={popup}
            id={id}
            role="note"
            aria-label={`${term} definition`}
            className="fixed z-50 border border-border bg-surface p-4 text-sm leading-relaxed text-text-primary shadow-xl"
            style={{
              ...position,
              width: "min(360px, calc(100vw - 32px))",
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <strong>{children}</strong>
              <button
                type="button"
                aria-label="Close definition"
                className="min-h-8 min-w-8 px-2 text-text-muted"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus({ preventScroll: true });
                }}
              >
                ×
              </button>
            </div>
            <p id={`${id}-definition`}>{definition}</p>
            {documentation && (
              <div className="mt-3 border-t border-border pt-3 text-xs leading-relaxed">
                {documentation.kind === "related-api" && (
                  <p className="mb-1 text-text-muted">Related API</p>
                )}
                <DocumentationLink
                  reference={documentation}
                  className="inline-block py-1"
                />
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
