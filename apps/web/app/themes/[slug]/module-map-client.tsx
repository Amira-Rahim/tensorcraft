"use client";

import { useState } from "react";
import Link from "next/link";

interface LessonItem {
  slug: string;
  title: string;
  moduleSlug: string;
  order: number;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "completed" | "in_progress" | "available" | "locked";
  sceneLocation?: string;
  narrative?: string;
  bridgeFe?: string;
  bridgeMl?: string;
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
  terminology: {
    lesson: string;
    module: string;
  };
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
  terminology,
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

                {/* Expanded: stats row + lesson list */}
                {isExp &&
                  (() => {
                    const totalMin = mod.lessons.reduce(
                      (s, l) => s + l.estimatedMinutes,
                      0,
                    );
                    const doneMin = mod.lessons
                      .filter((l) => l.status === "completed" || isDone)
                      .reduce((s, l) => s + l.estimatedMinutes, 0);
                    const leftMin = totalMin - doneMin;
                    const diffs = mod.lessons.map((l) => l.difficulty);
                    const diffOrd = {
                      beginner: 0,
                      intermediate: 1,
                      advanced: 2,
                    } as const;
                    const minD = diffs.reduce((a, b) =>
                      diffOrd[a] <= diffOrd[b] ? a : b,
                    );
                    const maxD = diffs.reduce((a, b) =>
                      diffOrd[a] >= diffOrd[b] ? a : b,
                    );
                    const cap = (s: string) =>
                      s.charAt(0).toUpperCase() + s.slice(1);
                    const diffRange =
                      minD === maxD ? cap(minD) : `${cap(minD)} → ${cap(maxD)}`;
                    const pct =
                      mod.totalLessons > 0
                        ? Math.round(
                            (mod.completedLessons / mod.totalLessons) * 100,
                          )
                        : 0;

                    return (
                      <>
                        {/* Per-module stats */}
                        <div
                          className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 font-mono"
                          style={{ borderTop: `1px solid ${palette.border}` }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 8,
                                color: palette.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              {terminology.lesson}s
                            </div>
                            <div style={{ fontSize: 13, color: palette.text }}>
                              {mod.completedLessons}{" "}
                              <span style={{ color: palette.muted }}>
                                / {mod.totalLessons}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 8,
                                color: palette.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              Time Left
                            </div>
                            <div style={{ fontSize: 13, color: palette.text }}>
                              ~{leftMin} min
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 8,
                                color: palette.muted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              Difficulty
                            </div>
                            <div style={{ fontSize: 13, color: palette.text }}>
                              {diffRange}
                            </div>
                          </div>
                          <div
                            style={{
                              marginLeft: "auto",
                              height: 3,
                              width: 100,
                              background: palette.border,
                            }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${mod.completedLessons} of ${mod.totalLessons} ${terminology.lesson}s complete`}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: palette.primary,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>

                        {/* Lesson dossier cards */}
                        <div className="mt-4 flex flex-col gap-2">
                          {mod.lessons.map((lesson) => {
                            const lessonDone =
                              lesson.status === "completed" || isDone;
                            const lessonActive =
                              lesson.status === "in_progress" ||
                              lesson.status === "available";
                            const lessonLocked =
                              lesson.status === "locked" && !isDone;
                            const isClickable = lessonDone || lessonActive;

                            const locationLabel = lesson.sceneLocation
                              ? `${lesson.sceneLocation} · ${lesson.estimatedMinutes} min`
                              : `${terminology.lesson} ${String(lesson.order).padStart(2, "0")} · ${lesson.estimatedMinutes} min`;

                            const difficultyColorMap: Record<string, string> = {
                              beginner: "var(--tc-tier-identity)",
                              intermediate: "var(--tc-tier-structural)",
                              advanced: "var(--tc-tier-intuition)",
                            };

                            const cardContent = (
                              <div
                                className="flex transition-all"
                                style={{
                                  background: lessonLocked
                                    ? palette.bg
                                    : palette.surface,
                                  border: `1px solid ${
                                    lessonDone || lessonActive
                                      ? `color-mix(in srgb, ${palette.primary} ${lessonActive ? "30" : "20"}%, transparent)`
                                      : palette.border
                                  }`,
                                  opacity: lessonLocked ? 0.45 : 1,
                                  boxShadow: lessonActive
                                    ? `0 0 20px color-mix(in srgb, ${palette.primary} 5%, transparent)`
                                    : "none",
                                }}
                              >
                                {/* Side panel */}
                                <div
                                  className="w-14 shrink-0 flex flex-col items-center justify-center gap-1 py-3 border-r"
                                  style={{
                                    background: lessonDone
                                      ? `color-mix(in srgb, ${palette.primary} 6%, transparent)`
                                      : lessonActive
                                        ? `color-mix(in srgb, ${palette.primary} 10%, transparent)`
                                        : palette.bg,
                                    borderRightColor:
                                      lessonDone || lessonActive
                                        ? `color-mix(in srgb, ${palette.primary} 15%, transparent)`
                                        : palette.border,
                                  }}
                                >
                                  <span
                                    className="font-mono text-base font-bold"
                                    style={{
                                      color:
                                        lessonDone || lessonActive
                                          ? palette.primary
                                          : palette.muted,
                                    }}
                                  >
                                    {String(lesson.order).padStart(2, "0")}
                                  </span>
                                  <span
                                    className="flex items-center justify-center"
                                    style={{
                                      width: 12,
                                      height: 12,
                                      background: lessonDone
                                        ? palette.primary
                                        : lessonActive
                                          ? "transparent"
                                          : palette.border,
                                      border: lessonActive
                                        ? `2px solid ${palette.primary}`
                                        : "none",
                                    }}
                                  >
                                    {lessonDone && (
                                      <span
                                        style={{
                                          color: palette.bg,
                                          fontSize: 8,
                                        }}
                                      >
                                        ✓
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0 px-4 py-3">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                      <div
                                        className="font-mono uppercase tracking-wider"
                                        style={{
                                          fontSize: 9,
                                          color: lessonActive
                                            ? palette.primary
                                            : palette.muted,
                                          letterSpacing: "0.1em",
                                        }}
                                      >
                                        {locationLabel}
                                      </div>
                                      <div
                                        className="font-mono font-bold mt-0.5 truncate"
                                        style={{
                                          fontSize: 14,
                                          color: lessonLocked
                                            ? palette.muted
                                            : palette.text,
                                        }}
                                      >
                                        {lesson.title}
                                      </div>
                                    </div>
                                    {lessonDone && (
                                      <span
                                        className="shrink-0 font-mono uppercase tracking-wider"
                                        style={{
                                          fontSize: 8,
                                          background: palette.primary,
                                          color: palette.bg,
                                          padding: "2px 8px",
                                        }}
                                      >
                                        ✓ Complete
                                      </span>
                                    )}
                                    {lessonActive &&
                                      lesson.status === "in_progress" && (
                                        <span
                                          className="shrink-0 font-mono uppercase tracking-wider"
                                          style={{
                                            fontSize: 8,
                                            border: `1px solid ${palette.primary}`,
                                            color: palette.primary,
                                            padding: "2px 8px",
                                          }}
                                        >
                                          ▶ Continue
                                        </span>
                                      )}
                                  </div>

                                  {/* Narrative — only on done + active */}
                                  {!lessonLocked && lesson.narrative && (
                                    <p
                                      className="mt-1.5 italic leading-relaxed line-clamp-2"
                                      style={{
                                        fontSize: 11,
                                        color: palette.muted,
                                      }}
                                    >
                                      &ldquo;{lesson.narrative.slice(0, 120)}
                                      {lesson.narrative.length > 120
                                        ? "..."
                                        : ""}
                                      &rdquo;
                                    </p>
                                  )}

                                  {/* Meta — only on done + active */}
                                  {!lessonLocked && (
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {lesson.bridgeFe && lesson.bridgeMl && (
                                        <span
                                          className="font-mono"
                                          style={{
                                            fontSize: 9,
                                            color: palette.primary,
                                            background: `color-mix(in srgb, ${palette.primary} 8%, transparent)`,
                                            padding: "1px 6px",
                                          }}
                                        >
                                          {lesson.bridgeFe} → {lesson.bridgeMl}
                                        </span>
                                      )}
                                      <span
                                        className="font-mono uppercase tracking-wider"
                                        style={{
                                          fontSize: 9,
                                          color:
                                            difficultyColorMap[
                                              lesson.difficulty
                                            ],
                                          background: `color-mix(in srgb, ${difficultyColorMap[lesson.difficulty]} 8%, transparent)`,
                                          padding: "1px 6px",
                                        }}
                                      >
                                        {lesson.difficulty}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Arrow */}
                                {isClickable && (
                                  <div
                                    className="shrink-0 flex items-center px-3 font-mono"
                                    style={{
                                      color: palette.muted,
                                      fontSize: 14,
                                    }}
                                  >
                                    →
                                  </div>
                                )}
                              </div>
                            );

                            if (isClickable) {
                              return (
                                <Link
                                  key={lesson.slug}
                                  href={`/themes/${themeSlug}/${mod.slug}/${lesson.slug}`}
                                  className="block brutalist-hover"
                                >
                                  {cardContent}
                                </Link>
                              );
                            }

                            return <div key={lesson.slug}>{cardContent}</div>;
                          })}
                        </div>
                      </>
                    );
                  })()}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
