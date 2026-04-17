> **Status: COMPLETED & MERGED** — Design was merged into `module-map-client.tsx`. Standalone page deleted 2026-04-15.

# Module Overview Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the module overview page with a narrative banner header, mission dossier lesson cards, and fix the hardcoded brutalist-hover shadow.

**Architecture:** Single-page rewrite of `page.tsx` JSX (server component, no new client components needed). The data layer and imports stay the same — only the template changes. Plus a one-line CSS fix in `globals.css`.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, CSS custom properties, server components

**Spec:** `docs/superpowers/specs/2026-04-15-module-overview-redesign.md`

---

### Task 1: Fix brutalist-hover Hardcoded Shadow

**Files:**
- Modify: `apps/web/app/globals.css:80-83`

This is a standalone CSS fix that affects all pages using `brutalist-hover`. Do it first so the module overview benefits immediately.

- [ ] **Step 1: Replace the hardcoded shadow color**

In `apps/web/app/globals.css`, line 82, replace:

```css
box-shadow: 6px 6px 0 rgba(107, 170, 138, 0.35);
```

With:

```css
box-shadow: 6px 6px 0 color-mix(in srgb, var(--tc-primary) 35%, transparent);
```

- [ ] **Step 2: Verify in browser**

Check hover shadows on:
- Theme selection cards (`/themes`) — should show theme-appropriate color
- Bridge cards (`/bridges`) — should show theme-appropriate color
- Switch between themes — shadow color should change

- [ ] **Step 3: Do NOT commit** (per CLAUDE.md rules)

---

### Task 2: Rewrite Module Overview — Narrative Banner

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/page.tsx:53-110`

Replace the current module header section (breadcrumb through progress bar) with the narrative banner. Keep the imports, metadata generation, and data fetching unchanged.

- [ ] **Step 1: Add computed stats after the existing data fetching**

After line 51 (`}.length;`), add:

```tsx
  // Compute stats for banner
  const totalMinutes = lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const completedMinutes = lessons
    .filter((l) => progressMap.get(l.slug) === "completed")
    .reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const remainingMinutes = totalMinutes - completedMinutes;

  const difficulties = lessons.map((l) => l.difficulty);
  const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  const minDiff = difficulties.reduce((a, b) =>
    difficultyOrder[a] <= difficultyOrder[b] ? a : b,
  );
  const maxDiff = difficulties.reduce((a, b) =>
    difficultyOrder[a] >= difficultyOrder[b] ? a : b,
  );
  const difficultyRange =
    minDiff === maxDiff
      ? minDiff.charAt(0).toUpperCase() + minDiff.slice(1)
      : `${minDiff.charAt(0).toUpperCase() + minDiff.slice(1)} → ${maxDiff.charAt(0).toUpperCase() + maxDiff.slice(1)}`;
```

- [ ] **Step 2: Replace the breadcrumb + module header section**

Replace lines 57-110 (from `{/* Breadcrumb */}` through the closing `</div>` of the module header) with:

```tsx
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm pt-5 text-text-muted font-mono">
          <Link href="/themes" className="hover:underline">
            Themes
          </Link>
          <span>/</span>
          <Link href={`/themes/${slug}`} className="hover:underline">
            {theme.displayName}
          </Link>
          <span>/</span>
          <span className="text-text-primary">{mod.title}</span>
        </div>

        {/* Narrative Banner */}
        <div className="relative mt-4 pt-8 pb-6 border-b border-border-active">
          {/* Gradient wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 4%, transparent) 0%, transparent 60%)",
            }}
          />
          {/* Bottom glow */}
          <div
            className="absolute -bottom-[6px] left-0 right-0 h-[6px] pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--tc-primary) 8%, transparent), transparent)",
            }}
          />
          <div className="relative">
            <div className="font-mono text-[11px] text-primary uppercase tracking-[0.12em] mb-2">
              // {theme.terminology.module} {String(mod.order).padStart(2, "0")} · {lessons.length} {theme.terminology.lesson}s
            </div>
            <h1 className="font-mono text-[28px] font-bold text-text-primary leading-tight mb-3">
              {mod.title}
            </h1>
            <p
              className="text-[13px] text-text-muted italic leading-relaxed max-w-[680px] pl-3.5 mb-5"
              style={{
                borderLeft:
                  "2px solid color-mix(in srgb, var(--tc-primary) 30%, transparent)",
              }}
            >
              &ldquo;{mod.description}&rdquo;
            </p>
            <div className="flex items-center gap-8 pt-4 border-t border-border font-mono">
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  {theme.terminology.lesson}s
                </div>
                <div className="text-[15px] text-text-primary">
                  {completedCount}{" "}
                  <span className="text-text-muted">/ {lessons.length} complete</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  Time Left
                </div>
                <div className="text-[15px] text-text-primary">
                  ~{remainingMinutes} min
                </div>
              </div>
              <div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">
                  Difficulty
                </div>
                <div className="text-[15px] text-text-primary">
                  {difficultyRange}
                </div>
              </div>
              <div
                className="ml-auto h-[3px] w-[140px] bg-border"
                role="progressbar"
                aria-valuenow={
                  lessons.length > 0
                    ? Math.round((completedCount / lessons.length) * 100)
                    : 0
                }
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Module progress: ${completedCount} of ${lessons.length} completed`}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 3: Verify the banner renders**

Start dev server and navigate to any module page. Check:
- Label shows theme terminology (e.g., "// Sequence 01 · 5 Scenes" for Nova Canvas)
- Title and blockquote render correctly
- Stats row shows computed values
- Bottom border and glow are visible with theme color
- Gradient wash is subtle but present

- [ ] **Step 4: Do NOT commit**

---

### Task 3: Rewrite Module Overview — Dossier Cards

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/page.tsx:112-188`

Replace the current lesson list with mission dossier cards. This is the largest change.

- [ ] **Step 1: Replace the lesson list section**

Replace lines 112-188 (from `{/* Lesson list */}` through the end of the lessons map) with:

```tsx
        {/* Dossier List */}
        <div className="flex flex-col gap-3 mt-8">
          {lessons.map((lesson) => {
            const status = progressMap.get(lesson.slug);
            const isComplete = status === "completed";
            const isActive = status === "in_progress";
            const isUpcoming = !isComplete && !isActive;

            const locationLabel = lesson.scene?.location
              ? `${lesson.scene.location} · ${lesson.estimatedMinutes} min`
              : `${theme.terminology.lesson} ${String(lesson.order).padStart(2, "0")} · ${lesson.estimatedMinutes} min`;

            return (
              <Link
                key={lesson.slug}
                href={`/themes/${slug}/${moduleSlug}/${lesson.slug}`}
                className={`flex text-left transition-all ${
                  isUpcoming
                    ? "opacity-45 hover:opacity-65 bg-page border border-border/60"
                    : "brutalist-hover bg-surface"
                } ${
                  isComplete
                    ? "border border-border-active"
                    : isActive
                      ? "border border-border-active shadow-[0_0_20px_color-mix(in_srgb,var(--tc-primary)_5%,transparent)]"
                      : ""
                }`}
              >
                {/* Side panel */}
                <div
                  className={`w-16 shrink-0 flex flex-col items-center justify-center gap-1.5 py-4 border-r ${
                    isComplete
                      ? "bg-primary-muted border-r-border-subtle"
                      : isActive
                        ? "border-r-border-subtle"
                        : "bg-page border-r-border/60"
                  }`}
                  style={
                    isActive
                      ? {
                          background:
                            "color-mix(in srgb, var(--tc-primary) 10%, transparent)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`font-mono text-[20px] font-bold ${
                      isComplete || isActive
                        ? "text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <span
                    className="w-3.5 h-3.5 flex items-center justify-center"
                    style={
                      isComplete
                        ? {
                            background: "var(--tc-primary)",
                          }
                        : isActive
                          ? {
                              background: "transparent",
                              border: "2px solid var(--tc-primary)",
                            }
                          : {
                              background: "var(--tc-border)",
                            }
                    }
                  >
                    {isComplete && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--tc-bg)"
                        strokeWidth="4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 px-6 py-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                          isActive ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        {locationLabel}
                      </div>
                      <h3 className="font-mono text-[16px] font-bold text-text-primary mt-1 truncate">
                        {lesson.title}
                      </h3>
                    </div>
                    {isComplete && (
                      <span className="shrink-0 font-mono text-[9px] bg-primary text-page px-2.5 py-[3px] uppercase tracking-wider">
                        ✓ Complete
                      </span>
                    )}
                    {isActive && (
                      <span className="shrink-0 font-mono text-[9px] border border-primary text-primary px-2.5 py-[3px] uppercase tracking-wider">
                        ▶ Continue
                      </span>
                    )}
                  </div>

                  {/* Narrative excerpt — only on complete + active */}
                  {!isUpcoming && lesson.context?.narrative && (
                    <p className="text-[12px] text-text-muted italic leading-relaxed mt-2 line-clamp-2">
                      &ldquo;{lesson.context.narrative.slice(0, 150)}
                      {lesson.context.narrative.length > 150 ? "..." : ""}
                      &rdquo;
                    </p>
                  )}

                  {/* Meta row — only on complete + active */}
                  {!isUpcoming && (
                    <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                      {lesson.concept?.bridge && (
                        <span className="font-mono text-[10px] text-primary bg-primary-muted px-2 py-0.5">
                          {lesson.concept.bridge.feTitle} →{" "}
                          {lesson.concept.bridge.mlTitle}
                        </span>
                      )}
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5"
                        style={{
                          color: difficultyColors[lesson.difficulty],
                          background: `color-mix(in srgb, ${difficultyColors[lesson.difficulty]} 8%, transparent)`,
                        }}
                      >
                        {lesson.difficulty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="shrink-0 flex items-center px-4 font-mono text-base text-text-muted">
                  →
                </div>
              </Link>
            );
          })}
        </div>
```

- [ ] **Step 2: Remove the now-unused `difficultyColors` constant if it was at the top**

Actually — `difficultyColors` is still used in the meta row inside the cards. Keep it at lines 25-29.

- [ ] **Step 3: Verify the dossier cards render**

Check on a module page:
- Cards show three distinct states (complete, active, upcoming)
- Side panel shows ordinal number and progress node
- Location label shows scene location (or terminology fallback)
- Narrative excerpt appears only on complete + active cards
- Bridge tags appear with theme primary color
- Upcoming cards are dimmed to ~45% opacity
- Hover effect works on complete + active cards (brutalist-hover with theme-colored shadow)
- Upcoming cards fade to 65% on hover but don't transform

- [ ] **Step 4: Test with different progress states**

Navigate to modules with:
- 0 lessons completed → all cards upcoming
- 1+ completed → first cards complete, one active, rest upcoming
- All completed → all cards in complete state, no active

- [ ] **Step 5: Check all 5 themes**

Switch between Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid:
- Side panel tints change color
- Border colors change
- Bridge tags change color
- Location labels show correct theme terminology

- [ ] **Step 6: Do NOT commit**

---

### Task 4: Responsive Adjustments

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/page.tsx`

- [ ] **Step 1: Add responsive classes to the banner stats row**

The stats row (`flex items-center gap-8`) should wrap on mobile. Update it to:

```tsx
<div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 border-t border-border font-mono">
```

And the progress bar should go full-width on mobile:

```tsx
<div
  className="ml-auto h-[3px] w-[140px] max-md:ml-0 max-md:w-full max-md:mt-2 bg-border"
```

- [ ] **Step 2: Add responsive classes to dossier cards**

The side panel should narrow on mobile. Update the side panel div:

```tsx
<div
  className={`w-16 max-md:w-12 shrink-0 flex flex-col items-center justify-center gap-1.5 py-4 border-r ${...}`}
```

And the ordinal should be smaller:

```tsx
<span
  className={`font-mono text-[20px] max-md:text-[16px] font-bold ${...}`}
>
```

Hide narrative excerpts on mobile by adding `max-md:hidden`:

```tsx
{!isUpcoming && lesson.context?.narrative && (
  <p className="text-[12px] text-text-muted italic leading-relaxed mt-2 line-clamp-2 max-md:hidden">
```

- [ ] **Step 3: Test at mobile viewport**

Resize to <768px and verify:
- Stats row wraps cleanly
- Progress bar goes full-width
- Side panel narrows
- Narrative excerpts hide
- Cards remain readable and tappable

- [ ] **Step 4: Do NOT commit**

---

### Task 5: Build Verification

- [ ] **Step 1: Run the build**

Run: `pnpm build --filter=@tensorcraft/web 2>&1 | tail -20`

Expected: All tasks successful, no TypeScript errors.

- [ ] **Step 2: Final visual check across themes**

Start the dev server and check the module overview page on each theme:
- Deep Orbit (teal)
- Neon Protocol (blue)
- Signal Ward (green)
- Nova Canvas (red)
- Terra Grid (orange)

For each: banner renders, cards show correct states, hover shadows match theme color, terminology is correct.

- [ ] **Step 3: Do NOT commit**
