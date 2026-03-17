"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface LessonNavItem {
  slug: string;
  title: string;
  order: number;
  locked?: boolean;
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
        className="fixed bottom-6 right-6 z-40 lg:hidden w-12 h-12 flex items-center justify-center brutalist-shadow"
        style={{
          background: accentColor,
          color: "var(--tc-bg)",
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
          className="fixed inset-0 z-50 lg:hidden bg-black/60"
          onClick={handleClose}
        >
          {/* Drawer */}
          <nav
            className="absolute right-0 top-0 h-full w-72 overflow-y-auto p-5 bg-surface-raised border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold font-mono uppercase tracking-widest text-text-muted">
                Lessons
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
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
              className="text-xs mb-4 inline-flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
              onClick={handleClose}
            >
              ← Back to module
            </Link>

            {/* Lesson list */}
            <div className="flex flex-col gap-1 mt-4">
              {lessons.map((l) => {
                const isActive = l.slug === currentLessonSlug;
                if (l.locked) {
                  return (
                    <div
                      key={l.slug}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-not-allowed opacity-40"
                    >
                      <span
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-medium shrink-0"
                        style={{
                          background: "var(--tc-border)",
                          color: mutedColor,
                        }}
                      >
                        &#x1F512;
                      </span>
                      <span
                        className="leading-snug"
                        style={{ color: mutedColor }}
                      >
                        {l.title}
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={l.slug}
                    href={`/themes/${themeSlug}/${moduleSlug}/${l.slug}`}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-text-primary"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                    onClick={handleClose}
                  >
                    <span
                      className="w-5 h-5 flex items-center justify-center text-[10px] font-medium shrink-0"
                      style={{
                        background: isActive ? accentColor : "var(--tc-border)",
                        color: isActive ? "var(--tc-bg)" : mutedColor,
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
