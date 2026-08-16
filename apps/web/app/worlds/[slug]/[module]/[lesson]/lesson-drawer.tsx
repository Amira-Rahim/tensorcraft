"use client";

import { useState } from "react";
import Link from "next/link";
import { FocusTrap } from "@tensorcraft/ui/a11y";

interface LessonDrawerProps {
  lessons: Array<{
    slug: string;
    title: string;
    order: number;
    locked: boolean;
    completed: boolean;
  }>;
  currentLessonSlug: string;
  worldSlug: string;
  moduleSlug: string;
  moduleName: string;
}

export function LessonDrawer({
  lessons,
  currentLessonSlug,
  worldSlug,
  moduleSlug,
  moduleName,
}: LessonDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger, only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-11 h-11 shrink-0"
        style={{
          background: "var(--tc-surface)",
          border: "1px solid var(--tc-border)",
          color: "var(--tc-muted)",
        }}
        aria-label="Open lesson list"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {/* Backdrop + Drawer */}
      {open && (
        <FocusTrap active={open} onEscape={() => setOpen(false)}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${moduleName} lessons`}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto animate-slide-up"
            style={{
              background: "var(--tc-surface)",
              borderTop: "1px solid var(--tc-border)",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4"
              style={{
                background: "var(--tc-surface)",
                borderBottom: "1px solid var(--tc-border)",
              }}
            >
              <div>
                <div
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: "var(--tc-muted)" }}
                >
                  {moduleName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11 text-sm font-mono px-3 py-1"
                style={{ color: "var(--tc-muted)" }}
              >
                Close
              </button>
            </div>

            {/* Lesson list */}
            <div className="px-3 py-2">
              {lessons.map((l) => {
                const isCurrent = l.slug === currentLessonSlug;
                const statusIcon = l.completed
                  ? "\u2713"
                  : isCurrent
                    ? "\u25CF"
                    : l.locked
                      ? "\uD83D\uDD12"
                      : "\u25CB";
                const statusColor =
                  l.completed || isCurrent
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)";

                if (l.locked) {
                  return (
                    <div
                      key={l.slug}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        className="text-xs shrink-0"
                        style={{ color: statusColor }}
                      >
                        {statusIcon}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={{ color: "var(--tc-muted)" }}
                      >
                        {l.order}. {l.title}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={l.slug}
                    href={`/worlds/${worldSlug}/${moduleSlug}/${l.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      background: isCurrent
                        ? "color-mix(in srgb, var(--tc-primary) 6%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span
                      className="text-xs shrink-0"
                      style={{ color: statusColor }}
                    >
                      {statusIcon}
                    </span>
                    <span
                      className="text-sm truncate"
                      style={{
                        color: isCurrent
                          ? "var(--tc-primary)"
                          : "var(--tc-text)",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {l.order}. {l.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
}
