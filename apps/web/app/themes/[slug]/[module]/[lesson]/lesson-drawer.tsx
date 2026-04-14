"use client";

import { useState } from "react";
import Link from "next/link";

interface LessonDrawerProps {
  lessons: Array<{
    slug: string;
    title: string;
    order: number;
    locked: boolean;
    completed: boolean;
  }>;
  currentLessonSlug: string;
  themeSlug: string;
  moduleSlug: string;
  moduleName: string;
  theme: {
    palette: {
      primary: string;
      text: string;
      muted: string;
      surface: string;
      border: string;
      bg: string;
    };
  };
}

export function LessonDrawer({
  lessons,
  currentLessonSlug,
  themeSlug,
  moduleSlug,
  moduleName,
  theme,
}: LessonDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger — only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 shrink-0"
        style={{
          background: theme.palette.surface,
          border: `1px solid ${theme.palette.border}`,
          color: theme.palette.muted,
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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Bottom sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto animate-slide-up"
            style={{
              background: theme.palette.surface,
              borderTop: `1px solid ${theme.palette.border}`,
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4"
              style={{
                background: theme.palette.surface,
                borderBottom: `1px solid ${theme.palette.border}`,
              }}
            >
              <div>
                <div
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: theme.palette.muted }}
                >
                  // {moduleName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-mono px-3 py-1"
                style={{ color: theme.palette.muted }}
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
                    ? theme.palette.primary
                    : theme.palette.muted;

                if (l.locked) {
                  return (
                    <div
                      key={l.slug}
                      className="flex items-center gap-3 px-4 py-3 opacity-40"
                    >
                      <span
                        className="text-xs shrink-0"
                        style={{ color: statusColor }}
                      >
                        {statusIcon}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={{ color: theme.palette.muted }}
                      >
                        {l.order}. {l.title}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={l.slug}
                    href={`/themes/${themeSlug}/${moduleSlug}/${l.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      background: isCurrent
                        ? `${theme.palette.primary}10`
                        : "transparent",
                      borderLeft: isCurrent
                        ? `2px solid ${theme.palette.primary}`
                        : "2px solid transparent",
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
                          ? theme.palette.primary
                          : theme.palette.text,
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
        </>
      )}
    </>
  );
}
