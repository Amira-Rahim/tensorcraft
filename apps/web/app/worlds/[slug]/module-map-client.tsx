"use client";

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
  worldSlug: string;
  terminology: {
    lesson: string;
    module: string;
  };
  continueHref: string;
  continueLabel: string;
  /**
   * Set for non-purchasers: locked rows render a clickable "Unlock →"
   * instead of a bare lock emoji (2026-07-14 UX audit: the lock emoji +
   * pointer-events-none made the post-free-module map a dead end).
   */
  unlockHref?: string;
  /**
   * Set for guests (no unlockHref): locked rows show price + free-module
   * fact instead of an unexplained lock emoji (2026-07-19 UX audit).
   */
  lockedTeaser?: { href: string; label: string };
}

const DIFFICULTY_COLOR: Record<LessonItem["difficulty"], string> = {
  beginner: "var(--tc-tier-identity)",
  intermediate: "var(--tc-tier-structural)",
  advanced: "var(--tc-tier-intuition)",
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

/**
 * Brutalist module map. Each module is a native `<details>` element
 * (keyboard-accessible, no JS state). Modules render a numbered node
 * indicator (option a from spec §11d), a lesson list with status icons,
 * and per-module stats. Colors come from CSS custom properties set by
 * `WorldSync`, this component carries no hex values.
 */
export function ModuleMapClient({
  modules,
  worldSlug,
  terminology,
  continueHref,
  continueLabel,
  unlockHref,
  lockedTeaser,
}: ModuleMapClientProps) {
  return (
    <div
      className="flex flex-col gap-2"
      data-testid="module-map"
      aria-label={`${terminology.module} list`}
    >
      {modules.map((mod, i) => {
        const isDone = mod.status === "completed";
        const isActive = mod.status === "active" || mod.status === "available";
        const isLocked = mod.status === "locked";
        const shouldOpen = isActive;
        const accentOn = isDone || isActive;

        return (
          <ModuleRow
            key={mod.slug}
            mod={mod}
            index={i}
            total={modules.length}
            isDone={isDone}
            isActive={isActive}
            isLocked={isLocked}
            shouldOpen={shouldOpen}
            accentOn={accentOn}
            worldSlug={worldSlug}
            terminology={terminology}
            unlockHref={unlockHref}
            lockedTeaser={lockedTeaser}
          />
        );
      })}

      {/* Continue CTA, primary action for returning learners */}
      <Link
        href={continueHref}
        className={`mt-6 inline-flex w-full items-center justify-between rounded-none border px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all brutalist-hover ${FOCUS_RING}`}
        style={{
          background: "var(--tc-primary)",
          color: "var(--tc-on-primary)",
          borderColor: "var(--tc-primary)",
        }}
        data-testid="continue-cta"
      >
        <span>{continueLabel}</span>
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}

interface ModuleRowProps {
  mod: ModuleMapItem;
  index: number;
  total: number;
  isDone: boolean;
  isActive: boolean;
  isLocked: boolean;
  shouldOpen: boolean;
  accentOn: boolean;
  worldSlug: string;
  terminology: { lesson: string; module: string };
  unlockHref?: string;
  lockedTeaser?: { href: string; label: string };
}

function ModuleRow({
  mod,
  index,
  total,
  isDone,
  isActive,
  isLocked,
  shouldOpen,
  accentOn,
  worldSlug,
  terminology,
  unlockHref,
  lockedTeaser,
}: ModuleRowProps) {
  const moduleLabel = `M${String(mod.order).padStart(2, "0")}`;
  const pct =
    mod.totalLessons > 0
      ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
      : 0;

  return (
    <div className="relative">
      {/* Connector line between module rows (option a: numbered circles +
          thin connector). Purely decorative. */}
      {index < total - 1 && (
        <div
          className="absolute left-[22px] top-full h-2 w-px"
          style={{
            background: isDone ? "var(--tc-primary)" : "var(--tc-border)",
          }}
          aria-hidden="true"
        />
      )}

      <details
        open={shouldOpen}
        className="group rounded-none border"
        data-module={mod.slug}
        data-status={mod.status}
        style={{
          borderColor: isActive ? "var(--tc-primary)" : "var(--tc-border)",
          background: isActive
            ? "var(--tc-surface)"
            : "color-mix(in srgb, var(--tc-surface) 60%, transparent)",
          opacity: isLocked ? 0.45 : 1,
        }}
      >
        <summary
          className={`flex cursor-pointer list-none items-start gap-4 rounded-none px-6 py-5 ${FOCUS_RING} ${isLocked ? "pointer-events-none" : ""}`}
          aria-label={`${terminology.module} ${mod.order}: ${mod.title}`}
        >
          {/* Node indicator, simple numbered square at left edge (option a) */}
          <div
            className="flex shrink-0 items-center justify-center rounded-none border-2 font-mono text-xs font-bold"
            style={{
              width: 32,
              height: 32,
              borderColor: accentOn ? "var(--tc-primary)" : "var(--tc-muted)",
              background: isDone ? "var(--tc-primary)" : "transparent",
              color: isDone
                ? "var(--tc-on-primary)"
                : accentOn
                  ? "var(--tc-primary)"
                  : "var(--tc-muted)",
            }}
            aria-hidden="true"
          >
            {isDone ? "✓" : moduleLabel.replace("M", "")}
          </div>

          {/* Module meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3">
              <span
                className="font-mono text-xs"
                style={{
                  color: accentOn ? "var(--tc-primary)" : "var(--tc-muted)",
                }}
              >
                {moduleLabel}
              </span>
              <span
                className="font-sans text-sm font-bold"
                style={{ color: "var(--tc-text)" }}
              >
                {mod.title}
              </span>
              {isDone && mod.avgScore != null && (
                <span
                  className="ml-auto font-mono text-xs"
                  style={{ color: "var(--tc-primary)" }}
                  aria-label={`Average score ${mod.avgScore} percent`}
                >
                  {mod.avgScore}%
                </span>
              )}
              {isActive && (
                <span
                  className="ml-auto rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
                  style={{
                    color: "var(--tc-primary)",
                    background: "var(--tc-primary-muted)",
                    borderColor: "var(--tc-primary)",
                  }}
                >
                  ACTIVE
                </span>
              )}
              {isLocked && !unlockHref && !lockedTeaser && (
                <span
                  className="ml-auto font-mono text-xs"
                  style={{ color: "var(--tc-muted)" }}
                  aria-hidden="true"
                >
                  &#x1F512;
                </span>
              )}
            </div>
            <p
              className="mt-1 font-sans text-xs"
              style={{ color: "var(--tc-muted)" }}
            >
              {mod.description}
            </p>

            {/* Progress pip row (brutalist segmented), one pip per lesson */}
            <div
              className="mt-3 flex gap-1"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${mod.completedLessons} of ${mod.totalLessons} ${terminology.lesson}s complete`}
            >
              {mod.lessons.map((l) => {
                const filled =
                  l.status === "completed" ||
                  isDone ||
                  l.status === "in_progress";
                return (
                  <span
                    key={l.slug}
                    className="h-1.5 w-4 rounded-none"
                    style={{
                      background: filled
                        ? "var(--tc-primary)"
                        : "var(--tc-border)",
                    }}
                    aria-hidden="true"
                  />
                );
              })}
              <span
                className="ml-2 font-mono text-[10px]"
                style={{ color: "var(--tc-muted)" }}
              >
                {mod.completedLessons}/{mod.totalLessons}
              </span>
            </div>
          </div>
        </summary>

        {/* Expanded body: lesson list */}
        {!isLocked && (
          <div
            className="border-t px-6 pb-5 pt-4"
            style={{ borderColor: "var(--tc-border)" }}
          >
            <ul className="flex flex-col gap-2" data-testid="lesson-list">
              {mod.lessons.map((lesson) => (
                <li key={lesson.slug} className="rounded-none">
                  <LessonCard
                    lesson={lesson}
                    moduleDone={isDone}
                    worldSlug={worldSlug}
                    moduleSlug={mod.slug}
                    terminology={terminology}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {/* Locked-row actions live OUTSIDE the <summary>: a link nested in an
          interactive <summary> is an axe nested-interactive violation
          (2026-07-19 audit). Absolutely positioned into the header row. */}
      {isLocked && unlockHref && (
        <Link
          href={unlockHref}
          className={`absolute right-6 top-5 rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${FOCUS_RING}`}
          style={{
            color: "var(--tc-primary)",
            borderColor: "var(--tc-primary)",
            background: "var(--tc-bg)",
          }}
          aria-label={`Unlock ${terminology.module} ${mod.order}: ${mod.title}`}
        >
          Unlock →
        </Link>
      )}
      {isLocked && !unlockHref && lockedTeaser && (
        <Link
          href={lockedTeaser.href}
          className={`absolute right-6 top-5 whitespace-nowrap rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${FOCUS_RING}`}
          style={{
            color: "var(--tc-primary)",
            borderColor: "var(--tc-primary)",
            background: "var(--tc-bg)",
          }}
          aria-label={`${terminology.module} ${mod.order} is paid content: ${lockedTeaser.label}`}
          data-testid="locked-teaser"
        >
          {lockedTeaser.label}
        </Link>
      )}
    </div>
  );
}

interface LessonCardProps {
  lesson: LessonItem;
  moduleDone: boolean;
  worldSlug: string;
  moduleSlug: string;
  terminology: { lesson: string; module: string };
}

/**
 * Single lesson card. Renders status icon, numbered ordinal, title, meta.
 * Clickable when done/active; rendered as a non-link div when locked.
 */
function LessonCard({
  lesson,
  moduleDone,
  worldSlug,
  moduleSlug,
  terminology,
}: LessonCardProps) {
  const done = lesson.status === "completed" || moduleDone;
  const current = lesson.status === "in_progress";
  const available = lesson.status === "available";
  const locked = lesson.status === "locked" && !moduleDone;
  const clickable = done || current || available;

  // Status icon, ✓ done, ● current (in-progress), ○ available, 🔒 locked
  let icon = "○"; // ○
  let iconLabel = "Not started";
  if (done) {
    icon = "✓"; // ✓
    iconLabel = "Completed";
  } else if (current) {
    icon = "●"; // ●
    iconLabel = "In progress";
  } else if (locked) {
    icon = "🔒";
    iconLabel = "Locked";
  }

  const locationLabel = lesson.sceneLocation
    ? `${lesson.sceneLocation} · ${lesson.estimatedMinutes} min`
    : `${terminology.lesson} ${String(lesson.order).padStart(2, "0")} · ${lesson.estimatedMinutes} min`;
  const bridgeCount = lesson.bridgeFe && lesson.bridgeMl ? 1 : 0;

  const card = (
    <div
      className={`flex items-stretch rounded-none border transition-all ${clickable ? "brutalist-hover" : ""}`}
      style={{
        background: locked ? "var(--tc-bg)" : "var(--tc-surface)",
        borderColor:
          done || current
            ? "var(--tc-primary)"
            : available
              ? "var(--tc-border-active)"
              : "var(--tc-border)",
        opacity: locked ? 0.5 : 1,
      }}
      data-lesson-status={lesson.status}
    >
      {/* Side panel: ordinal + status icon */}
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-none border-r py-3"
        style={{
          background: done
            ? "color-mix(in srgb, var(--tc-primary) 6%, transparent)"
            : current
              ? "var(--tc-primary-muted)"
              : "var(--tc-bg)",
          borderColor:
            done || current ? "var(--tc-border-active)" : "var(--tc-border)",
        }}
      >
        <span
          className="font-mono text-base font-bold"
          style={{
            color: done || current ? "var(--tc-primary)" : "var(--tc-muted)",
          }}
          aria-hidden="true"
        >
          {String(lesson.order).padStart(2, "0")}
        </span>
        <span
          className="font-mono text-xs leading-none"
          style={{
            color: done
              ? "var(--tc-primary)"
              : current
                ? "var(--tc-primary)"
                : locked
                  ? "var(--tc-muted)"
                  : "var(--tc-muted)",
          }}
          role="img"
          aria-label={iconLabel}
          data-testid={`lesson-icon-${lesson.status}`}
        >
          {locked ? "🔒" : icon}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] uppercase"
              style={{
                color:
                  current || available
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                letterSpacing: "0.1em",
              }}
            >
              {locationLabel}
            </div>
            <div
              className="mt-0.5 truncate font-sans text-sm font-semibold"
              style={{
                color: locked ? "var(--tc-muted)" : "var(--tc-text)",
              }}
            >
              {lesson.title}
            </div>
          </div>
          {done && (
            <span
              className="shrink-0 rounded-none px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
              style={{
                background: "var(--tc-primary)",
                color: "var(--tc-on-primary)",
              }}
            >
              &#x2713; Complete
            </span>
          )}
          {current && (
            <span
              className="shrink-0 rounded-none border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
              style={{
                borderColor: "var(--tc-primary)",
                color: "var(--tc-primary)",
              }}
            >
              &#x25B6; Continue
            </span>
          )}
        </div>

        {!locked && lesson.narrative && (
          <p
            className="mt-1.5 line-clamp-2 font-sans text-xs italic leading-relaxed"
            style={{ color: "var(--tc-muted)" }}
          >
            &ldquo;
            {lesson.narrative.slice(0, 120)}
            {lesson.narrative.length > 120 ? "…" : ""}
            &rdquo;
          </p>
        )}

        {!locked && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {lesson.bridgeFe && lesson.bridgeMl && (
              <span
                className="rounded-none px-1.5 py-0.5 font-mono text-[9px]"
                style={{
                  color: "var(--tc-primary)",
                  background: "var(--tc-primary-muted)",
                }}
                data-testid="bridge-count"
              >
                {lesson.bridgeFe} &rarr; {lesson.bridgeMl}
              </span>
            )}
            <span
              className="rounded-none px-1.5 py-0.5 font-mono text-[9px] uppercase"
              style={{
                color: DIFFICULTY_COLOR[lesson.difficulty],
                background: `color-mix(in srgb, ${DIFFICULTY_COLOR[lesson.difficulty]} 8%, transparent)`,
                letterSpacing: "0.1em",
              }}
            >
              {lesson.difficulty}
            </span>
            {bridgeCount > 0 && (
              <span
                className="font-mono text-[9px]"
                style={{ color: "var(--tc-muted)" }}
              >
                {bridgeCount} bridge
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chevron */}
      {clickable && (
        <div
          className="flex shrink-0 items-center px-3 font-mono text-base"
          style={{ color: "var(--tc-muted)" }}
          aria-hidden="true"
        >
          &rarr;
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link
        href={`/worlds/${worldSlug}/${moduleSlug}/${lesson.slug}`}
        className={`block rounded-none ${FOCUS_RING}`}
        aria-label={`${lesson.title}, ${iconLabel}`}
      >
        {card}
      </Link>
    );
  }

  return <div aria-label={`${lesson.title}, ${iconLabel}`}>{card}</div>;
}
