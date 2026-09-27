"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
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
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    // The desktop panel follows the trigger; cap it at the viewport's
    // remaining height so long lesson lists clear the consent bar.
    const updateAvailableHeight = () => {
      if (!triggerRef.current || !panelRef.current) return;
      panelRef.current.style.setProperty(
        "--lesson-panel-top",
        `${triggerRef.current.getBoundingClientRect().bottom + 8}px`,
      );
    };
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, true);
    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight, true);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      {/* Lesson navigation at every viewport width */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-3 h-11 shrink-0 text-xs font-mono"
        style={{
          background: "var(--tc-surface)",
          border: "1px solid var(--tc-border)",
          color: "var(--tc-muted)",
        }}
        aria-label="Open lesson list"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
        Lessons
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

          {/* Anchored panel on desktop, bottom sheet in compact windows */}
          <div
            ref={panelRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label={`${moduleName} lessons`}
            className="lesson-drawer-panel"
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
                        className="text-sm"
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
                    aria-current={isCurrent ? "page" : undefined}
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
                      className="text-sm"
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
    </div>
  );
}
