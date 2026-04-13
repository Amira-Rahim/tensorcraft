"use client";

import { useState } from "react";
import Link from "next/link";

interface LessonItem {
  slug: string;
  title: string;
  moduleSlug: string;
  status: "completed" | "in_progress" | "available" | "locked";
}

interface ModuleMapItem {
  slug: string;
  title: string;
  order: number;
  description: string;
  status: "completed" | "active" | "available" | "locked";
  completedLessons: number;
  totalLessons: number;
  avgScore: number | null;
  lessons: LessonItem[];
}

interface ModuleMapClientProps {
  modules: ModuleMapItem[];
  themeSlug: string;
  palette: {
    bg: string;
    primary: string;
    accent: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  continueHref: string;
  continueLabel: string;
}

export function ModuleMapClient({
  modules,
  themeSlug,
  palette,
  continueHref,
  continueLabel,
}: ModuleMapClientProps) {
  const [expanded, setExpanded] = useState<string | null>(() => {
    const active = modules.find(
      (m) => m.status === "active" || m.status === "available",
    );
    return active?.slug ?? null;
  });

  return (
    <div className="flex flex-col gap-0.5">
      {modules.map((mod, i) => {
        const isDone = mod.status === "completed";
        const isActive = mod.status === "active" || mod.status === "available";
        const isLocked = mod.status === "locked";
        const isExp = expanded === mod.slug;
        const dotColor = isDone || isActive ? palette.primary : palette.muted;

        return (
          <div key={mod.slug} className="relative">
            {/* Connector line */}
            {i < modules.length - 1 && (
              <div
                className="absolute left-[19px] top-full w-0.5 h-0.5 z-0"
                style={{
                  background: isDone ? palette.primary : palette.border,
                }}
                aria-hidden="true"
              />
            )}

            <button
              type="button"
              onClick={() => !isLocked && setExpanded(isExp ? null : mod.slug)}
              disabled={isLocked}
              className="w-full text-left flex items-start gap-5 mb-0.5"
              style={{
                background: isActive
                  ? palette.surface
                  : `color-mix(in srgb, ${palette.surface} 60%, transparent)`,
                border: `2px solid ${isActive ? palette.primary : isExp ? dotColor : palette.border}`,
                padding: "18px 24px",
                cursor: isLocked ? "default" : "pointer",
                opacity: isLocked ? 0.45 : 1,
                transition: "border-color 0.1s ease",
              }}
              aria-expanded={isLocked ? undefined : isExp}
              aria-label={`Module ${mod.order}: ${mod.title}`}
            >
              {/* Node dot */}
              <div
                className="flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  width: 28,
                  height: 28,
                  border: `2px solid ${dotColor}`,
                  background: isDone ? palette.primary : "transparent",
                }}
              >
                {isDone && (
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: palette.bg }}
                  >
                    &#x2713;
                  </span>
                )}
                {isActive && (
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: palette.primary }}
                  >
                    {">"}
                  </span>
                )}
                {isLocked && (
                  <span
                    className="font-mono text-xs"
                    style={{ color: palette.muted }}
                  >
                    &#x25CB;
                  </span>
                )}
              </div>

              {/* Module info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-xs"
                    style={{
                      color:
                        isDone || isActive ? palette.primary : palette.muted,
                    }}
                  >
                    M{String(mod.order).padStart(2, "0")}
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: palette.text }}
                  >
                    {mod.title}
                  </span>
                  {isDone && mod.avgScore != null && (
                    <span
                      className="font-mono text-xs ml-auto"
                      style={{ color: palette.primary }}
                    >
                      {mod.avgScore}%
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="font-mono text-xs ml-auto px-2 py-0.5"
                      style={{
                        color: palette.primary,
                        background: `color-mix(in srgb, ${palette.primary} 13%, transparent)`,
                        border: `1px solid ${palette.primary}`,
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
                <div
                  className="font-mono text-xs mt-1"
                  style={{ color: palette.muted }}
                >
                  {mod.description}
                </div>

                {/* Expanded lesson list */}
                {isExp && (
                  <div className="mt-4 flex flex-col gap-px">
                    {mod.lessons.map((lesson, li) => {
                      const lessonDone =
                        lesson.status === "completed" || isDone;
                      const lessonActive =
                        lesson.status === "in_progress" ||
                        lesson.status === "available";
                      const isClickable = lessonDone || lessonActive;

                      const inner = (
                        <div
                          className="flex items-center gap-3 py-2 px-4"
                          style={{
                            background: `color-mix(in srgb, ${palette.bg} 80%, transparent)`,
                            border: `1px solid ${palette.border}`,
                          }}
                        >
                          <span
                            className="font-mono text-xs"
                            style={{
                              color: lessonDone
                                ? palette.primary
                                : lessonActive
                                  ? palette.primary
                                  : palette.muted,
                            }}
                          >
                            {lessonDone
                              ? "\u2713"
                              : lessonActive
                                ? ">"
                                : `${li + 1}`}
                          </span>
                          <span
                            className="font-mono text-xs"
                            style={{
                              color:
                                lessonDone || lessonActive
                                  ? palette.text
                                  : palette.muted,
                            }}
                          >
                            {lesson.title}
                          </span>
                        </div>
                      );

                      if (isClickable) {
                        return (
                          <Link
                            key={lesson.slug}
                            href={`/themes/${themeSlug}/${mod.slug}/${lesson.slug}`}
                            className="transition-opacity hover:opacity-80"
                          >
                            {inner}
                          </Link>
                        );
                      }

                      return (
                        <div key={lesson.slug} className="opacity-60">
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
