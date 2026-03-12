"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface LessonNavItem {
  slug: string;
  title: string;
  order: number;
}

interface MobileLessonNavProps {
  lessons: LessonNavItem[];
  currentLessonSlug: string;
  themeSlug: string;
  moduleSlug: string;
  accentColor: string;
  mutedColor: string;
  backHref: string;
}

export function MobileLessonNav({
  lessons,
  currentLessonSlug,
  themeSlug,
  moduleSlug,
  accentColor,
  mutedColor,
  backHref,
}: MobileLessonNavProps) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Floating menu button — only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: accentColor,
          color: "#080B16",
        }}
        aria-label="Open lesson navigation"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={handleClose}
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          {/* Drawer */}
          <nav
            className="absolute right-0 top-0 h-full w-72 overflow-y-auto p-5"
            style={{
              background: "var(--tc-surface, #0F1320)",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between mb-6">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: mutedColor }}
              >
                Lessons
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: mutedColor }}
                aria-label="Close navigation"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>

            {/* Back link */}
            <Link
              href={backHref}
              className="text-xs mb-4 inline-flex items-center gap-1 block"
              style={{ color: mutedColor }}
              onClick={handleClose}
            >
              ← Back to module
            </Link>

            {/* Lesson list */}
            <div className="flex flex-col gap-1 mt-4">
              {lessons.map((l) => {
                const isActive = l.slug === currentLessonSlug;
                return (
                  <Link
                    key={l.slug}
                    href={`/themes/${themeSlug}/${moduleSlug}/${l.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                      color: isActive ? "#fff" : mutedColor,
                    }}
                    onClick={handleClose}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                      style={{
                        background: isActive
                          ? accentColor
                          : "rgba(255,255,255,0.06)",
                        color: isActive ? "#000" : mutedColor,
                      }}
                    >
                      {l.order}
                    </span>
                    <span className="leading-snug">{l.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
