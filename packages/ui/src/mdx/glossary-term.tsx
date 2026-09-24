"use client";

import { useLayoutEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface GlossaryTermProps {
  term: string;
  definition?: string;
  children: React.ReactNode;
}

/** A definition shown under the term when it is activated (click, Enter or Space). */
export function GlossaryTerm({
  term,
  definition,
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
      setPosition({
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: Math.max(
          16,
          Math.min(rect.bottom + 8, window.innerHeight - height - 16),
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
    };
    place();
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
          </div>,
          document.body,
        )}
    </>
  );
}
