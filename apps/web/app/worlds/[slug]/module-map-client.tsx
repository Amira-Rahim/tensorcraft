"use client";

import Link from "next/link";
import { ModulePatch } from "@tensorcraft/ui/module-patch";

interface LessonItem {
  slug: string;
  title: string;
  moduleSlug: string;
  order: number;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
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
  /** Mission-patch emblem, earned on completion (lib/patch-art.ts).
   *  Rendered only when status is "completed"; the node box is the
   *  fallback. */
  patchSrc?: string;
}

interface ModuleMapClientProps {
  modules: ModuleMapItem[];
  worldSlug: string;
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
 * Brutalist module map. Each unlocked module is a native `<details>`
 * element (keyboard-accessible, no JS state) with a numbered node
 * indicator (option a from spec §11d), a lesson list with status icons,
 * and per-module stats. Locked modules are plain cards, fully wrapped in
 * their unlock/pricing link when one applies (see ModuleRow). Colors come
 * from CSS custom properties set by `WorldSync`, this component carries
 * no hex values.
 */
export function ModuleMapClient({
  modules,
  worldSlug,
  continueHref,
  continueLabel,
  unlockHref,
  lockedTeaser,
}: ModuleMapClientProps) {
  return (
    <div
      className="flex flex-col gap-2"
      data-testid="module-map"
      aria-label="Module list"
    >
      {modules.map((mod, i) => {
        const isDone = mod.status === "completed";
        const isActive = mod.status === "active" || mod.status === "available";
        const isLocked = mod.status === "locked";
        const shouldOpen = isActive;
        const accentOn = isDone || isActive;
        // The price fact renders once, on the first locked row; stating it
        // on all ten reads as a wall of price chips (2026-08-29 design
        // audit). Every locked row stays clickable regardless.
        const firstLockedIndex = modules.findIndex(
          (m) => m.status === "locked",
        );

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
            unlockHref={unlockHref}
            lockedTeaser={lockedTeaser}
            teaserShowsPrice={i === firstLockedIndex}
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
  unlockHref?: string;
  lockedTeaser?: { href: string; label: string };
  /** True on the first locked row only: the one that states the price. */
  teaserShowsPrice?: boolean;
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
  unlockHref,
  lockedTeaser,
  teaserShowsPrice,
}: ModuleRowProps) {
  const moduleLabel = `M${String(mod.order).padStart(2, "0")}`;
  const pct =
    mod.totalLessons > 0
      ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
      : 0;

  // Connector line between module rows (option a: numbered circles + thin
  // connector). Purely decorative.
  const connector = index < total - 1 && (
    <div
      className="absolute left-[22px] top-full h-2 w-px"
      style={{
        background: isDone ? "var(--tc-primary)" : "var(--tc-border)",
      }}
      aria-hidden="true"
    />
  );

  // Locked rows are plain cards, not <details>: they have no expanded body,
  // and a disclosure widget that never discloses is noise to a screen
  // reader. It also lets the unlock/pricing link wrap the WHOLE row in
  // normal flow. The link used to be a chip absolutely positioned into the
  // title row (kept outside the <summary> for axe's nested-interactive
  // rule), and at phone widths that chip sat on top of the module title
  // (2026-08-29 design audit).
  if (isLocked) {
    const href = unlockHref ?? lockedTeaser?.href;
    const chipClass =
      "ml-auto shrink-0 whitespace-nowrap rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest";
    const rowBody = (
      <div className="flex items-start gap-4 px-6 py-5">
        <div
          className="flex shrink-0 items-center justify-center rounded-none border-2 font-mono text-xs font-bold"
          style={{
            width: 32,
            height: 32,
            borderColor: "var(--tc-muted)",
            color: "var(--tc-muted)",
            opacity: 0.45,
          }}
          aria-hidden="true"
          data-decorative="true"
        >
          {moduleLabel.replace("M", "")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <span
              className="font-mono text-xs"
              style={{ color: "var(--tc-muted)" }}
            >
              {moduleLabel}
            </span>
            <span
              className="font-sans text-sm md:text-lg font-bold"
              style={{ color: "var(--tc-muted)" }}
            >
              {mod.title}
            </span>
            {unlockHref ? (
              <span
                className={chipClass}
                style={{
                  color: "var(--tc-primary)",
                  borderColor: "var(--tc-primary)",
                  background: "var(--tc-bg)",
                }}
              >
                Unlock →
              </span>
            ) : lockedTeaser && teaserShowsPrice ? (
              <span
                className={chipClass}
                style={{
                  color: "var(--tc-primary)",
                  borderColor: "var(--tc-primary)",
                  background: "var(--tc-bg)",
                }}
              >
                {lockedTeaser.label}
              </span>
            ) : (
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
            className="mt-1 font-sans text-xs md:text-sm"
            style={{ color: "var(--tc-muted)" }}
          >
            {mod.description}
          </p>
        </div>
      </div>
    );

    return (
      <div className="relative">
        {connector}
        <div
          className={`rounded-none border ${href ? "transition-all brutalist-hover" : ""}`}
          data-module={mod.slug}
          data-status={mod.status}
          style={{
            borderColor: "var(--tc-border)",
            background:
              "color-mix(in srgb, var(--tc-surface) 60%, transparent)",
          }}
        >
          {href ? (
            <Link
              href={href}
              className={`block rounded-none ${FOCUS_RING}`}
              aria-label={
                unlockHref
                  ? `Unlock module ${mod.order}: ${mod.title}`
                  : `Module ${mod.order}: ${mod.title}. Paid content: ${lockedTeaser?.label}`
              }
              data-testid={unlockHref ? undefined : "locked-teaser"}
            >
              {rowBody}
            </Link>
          ) : (
            rowBody
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {connector}

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
        }}
      >
        <summary
          className={`flex cursor-pointer list-none items-start gap-4 rounded-none px-6 py-5 ${FOCUS_RING}`}
          aria-label={`Module ${mod.order}: ${mod.title}`}
        >
          {/* Node indicator, simple numbered square at left edge (option a).
              A completed module trades the ✓ box for its earned mission
              patch; the box returns if the art fails (docs/patch-bible.md). */}
          {(() => {
            const nodeBox = (
              <div
                className="flex shrink-0 items-center justify-center rounded-none border-2 font-mono text-xs font-bold"
                style={{
                  width: 32,
                  height: 32,
                  borderColor: accentOn
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                  background: isDone ? "var(--tc-primary)" : "transparent",
                  color: isDone
                    ? "var(--tc-on-primary)"
                    : accentOn
                      ? "var(--tc-primary)"
                      : "var(--tc-muted)",
                }}
                aria-hidden="true"
                data-decorative="true"
              >
                {isDone ? "✓" : moduleLabel.replace("M", "")}
              </div>
            );
            return isDone && mod.patchSrc ? (
              <ModulePatch src={mod.patchSrc} size={32} fallback={nodeBox} />
            ) : (
              nodeBox
            );
          })()}

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
                className="font-sans text-sm md:text-lg font-bold"
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
            </div>
            <p
              className="mt-1 font-sans text-xs md:text-sm"
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
              aria-label={`${mod.completedLessons} of ${mod.totalLessons} lessons complete`}
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
                />
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}

interface LessonCardProps {
  lesson: LessonItem;
  moduleDone: boolean;
  worldSlug: string;
  moduleSlug: string;
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

  const locationLabel = `Lesson ${String(lesson.order).padStart(2, "0")} · ${lesson.estimatedMinutes} min`;

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
        {/* Same no-container-opacity constraint as the module row above:
            locked lessons dim only this decorative ordinal (duplicated by
            the "Lesson NN" label beside it), the visible text stays in AA
            tokens at full opacity. */}
        <span
          className="font-mono text-base md:text-xl font-bold"
          style={{
            color: done || current ? "var(--tc-primary)" : "var(--tc-muted)",
            opacity: locked ? 0.5 : 1,
          }}
          aria-hidden="true"
          data-decorative="true"
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
              className="mt-0.5 truncate font-sans text-sm md:text-base font-semibold"
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

        {!locked && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
