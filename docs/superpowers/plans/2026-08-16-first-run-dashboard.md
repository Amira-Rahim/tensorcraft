# First-Run Dashboard (Mission Dispatch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the zeroed-out analytics dashboard with a full-bleed mission-dispatch view for accounts that have no completed lessons and no exercise attempts, and fix the three dashboard grid-scaling defects for every account.

**Architecture:** A new server component `first-run-view.tsx` renders under the same route; `page.tsx` branches to it from data it already fetches. The full `DashboardView` gets fixed-size heatmap cells, fixed-size bridge tiles, and the missing 40px gutters. Spec: `docs/superpowers/specs/2026-08-16-first-run-dashboard-design.md`.

**Tech Stack:** Next.js App Router (RSC), Tailwind v4 + inline style tokens, vitest + @testing-library/react + vitest-axe.

**Repo rules that override skill defaults:** NO git commits at any step (CLAUDE.md: never commit on behalf of the owner). No em dash character anywhere. No colored left accent bars. All copy per `docs/writing-quality-rubric.md`.

---

### Task 1: FirstRunView component (TDD)

**Files:**
- Create: `apps/web/app/dashboard/first-run-view.tsx`
- Test: `apps/web/app/dashboard/__tests__/first-run-view.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { FirstRunView, type FirstRunProps } from "../first-run-view";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function baseProps(overrides: Partial<FirstRunProps> = {}): FirstRunProps {
  return {
    displayName: "Amira",
    worldName: "Deep Orbit",
    worldSlug: "deep-orbit",
    plateSrc: "/locations/deep-orbit/dashboard-station.webp",
    briefing: {
      number: 1,
      name: "Foundations: Tensors & Data",
      lessonNumber: 1,
      totalLessons: 5,
      estimatedMinutes: 12,
      topic: "Introduction to Tensors",
    },
    resumeUrl: "/worlds/deep-orbit/foundations/introduction-to-tensors",
    firstPatchLessonCount: 5,
    totalWorldLessons: 56,
    ...overrides,
  };
}

describe("FirstRunView", () => {
  it("renders the transmission header, operator line, and briefing", () => {
    render(<FirstRunView {...baseProps()} />);
    expect(
      screen.getByText(/ARCHIMEDES · MONITORING STATION/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/SIGNAL: SECTOR 7-G · 64 CHANNELS · LIVE/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/OPERATOR: Amira/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Module 1: Foundations: Tensors & Data/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lesson 1 of 5 · ~12 min · Introduction to Tensors/i),
    ).toBeInTheDocument();
  });

  it("links the CTA to the first lesson using world terminology", () => {
    render(<FirstRunView {...baseProps()} />);
    const cta = screen.getByRole("link", { name: /Start First Mission/i });
    expect(cta).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/introduction-to-tensors",
    );
  });

  it("renders the stat strip and instruments line", () => {
    render(<FirstRunView {...baseProps()} />);
    expect(screen.getByText(/starts today/i)).toBeInTheDocument();
    expect(screen.getByText(/after 5 lessons/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 56 lessons/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Activity, skill genome, bridges, and patches switch on after your first completed lesson\./i,
      ),
    ).toBeInTheDocument();
  });

  it("omits the first-patch stat when no patch art exists", () => {
    render(
      <FirstRunView {...baseProps({ firstPatchLessonCount: undefined })} />,
    );
    expect(screen.queryByText(/after 5 lessons/i)).not.toBeInTheDocument();
  });

  it("renders no art and no status line for a world without them", () => {
    render(
      <FirstRunView
        {...baseProps({
          worldSlug: "neon-protocol",
          worldName: "Neon Protocol",
          plateSrc: undefined,
        })}
      />,
    );
    expect(screen.queryByTestId("art-plate")).not.toBeInTheDocument();
    expect(screen.queryByText(/SECTOR 7-G/i)).not.toBeInTheDocument();
    // Kicker falls back to the world name.
    expect(screen.getByText("NEON PROTOCOL")).toBeInTheDocument();
    // CTA consumes the world's own terminology (neon-protocol's lesson
    // term is "Protocol"; the "Lesson" fallback only fires for slugs
    // absent from the worlds record).
    expect(
      screen.getByRole("link", { name: /Start First Protocol/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the world page when there is no resume URL", () => {
    render(
      <FirstRunView {...baseProps({ resumeUrl: null, briefing: null })} />,
    );
    const cta = screen.getByRole("link", { name: /Start Learning/i });
    expect(cta).toHaveAttribute("href", "/worlds/deep-orbit");
    // Briefing falls back to the world name as the heading.
    expect(
      screen.getByRole("heading", { level: 1, name: /Deep Orbit/i }),
    ).toBeInTheDocument();
  });

  it("renders none of the analytics panels", () => {
    render(<FirstRunView {...baseProps()} />);
    expect(screen.queryByText(/SKILL GENOME/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ACTIVITY · 30 DAYS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bridges Collected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mission Patches/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LEARNING TREND/i)).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<FirstRunView {...baseProps()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/app/dashboard/__tests__/first-run-view.test.tsx`
Expected: FAIL (module `../first-run-view` not found).

- [ ] **Step 3: Write the implementation**

`apps/web/app/dashboard/first-run-view.tsx`. Server component (no
"use client"; ArtPlate is its own client island). Follows
dashboard-view.tsx token constants and the /worlds hero plate pattern
(ArtPlate bleed + tc-art-scrim + tc-on-art; see
apps/web/app/worlds/world-cards-grid.tsx:170-203).

```tsx
import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { worlds } from "@tensorcraft/worlds";

/* Design tokens, same set dashboard-view.tsx uses. */
const LIME = "var(--tc-primary)";
const BG = "var(--tc-bg)";
const WHITE = "var(--tc-text)";
const MUTED = "var(--tc-muted)";
const BORDER_VAR = "var(--tc-border)";
const ON_PRIMARY = "var(--tc-on-primary)";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

/* System-voice transmission header, per world. Canon facts from
   docs/story-style-bible.md (the Archimedes, Sector 7-G, 64 channels).
   A world without an entry keeps a plain world-name kicker and no
   status line; the cast never addresses the learner here (operator-of-
   record rule), so the header is ship UI, not dialogue. */
const TRANSMISSION: Record<string, { kicker: string; status: string }> = {
  "deep-orbit": {
    kicker: "ARCHIMEDES · MONITORING STATION",
    status: "SIGNAL: SECTOR 7-G · 64 CHANNELS · LIVE",
  },
};

/** Same shape as page.tsx's currentModuleInfo (spec: "reuses the
 *  currentModule shape"), so the page can pass it through untouched. */
export interface FirstRunBriefing {
  number: number;
  name: string;
  lessonNumber: number;
  totalLessons: number;
  estimatedMinutes: number;
  topic: string;
}

export interface FirstRunProps {
  displayName: string;
  worldName: string;
  worldSlug: string;
  plateSrc?: string;
  briefing: FirstRunBriefing | null;
  resumeUrl: string | null;
  /** Module 1 lesson count, present only when module 1 resolves patch
   *  art. Absent hides the first-patch stat rather than promising an
   *  emblem that does not exist. */
  firstPatchLessonCount?: number;
  totalWorldLessons: number;
}

export function FirstRunView({
  displayName,
  worldName,
  worldSlug,
  plateSrc,
  briefing,
  resumeUrl,
  firstPatchLessonCount,
  totalWorldLessons,
}: FirstRunProps) {
  const lessonTerm = worlds[worldSlug]?.terminology.lesson ?? "Lesson";
  const tx = TRANSMISSION[worldSlug];

  const stats: Array<{ label: string; value: string }> = [
    { label: "Streak", value: "starts today" },
    ...(firstPatchLessonCount
      ? [
          {
            label: "First patch",
            value: `after ${firstPatchLessonCount} lessons`,
          },
        ]
      : []),
    { label: "World", value: `0 / ${totalWorldLessons} lessons` },
  ];

  return (
    <div
      style={{
        background: BG,
        color: WHITE,
        WebkitFontSmoothing: "antialiased",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* The dispatch is a lit viewport over dark art, so the section is
          dark in both schemes (tc-on-art). If the plate fails to load,
          ArtPlate renders nothing and the dark surface + grid remain. */}
      <main
        data-testid="first-run-dispatch"
        className="tc-on-art grid-bg"
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
          display: "flex",
          overflow: "hidden",
          background: "#181818",
        }}
      >
        {plateSrc && (
          <ArtPlate
            src={plateSrc}
            bleed
            className="absolute inset-0 pointer-events-none"
          />
        )}
        {plateSrc && <div aria-hidden="true" className="tc-art-scrim" />}

        <section
          aria-labelledby="dispatch-heading"
          style={{
            position: "relative",
            zIndex: 10,
            margin: "auto",
            width: "100%",
            maxWidth: 760,
            padding: "72px 40px",
          }}
        >
          {/* Transmission header */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 28,
            }}
          >
            <span style={{ color: LIME, fontWeight: 700 }}>
              {tx?.kicker ?? worldName.toUpperCase()}
            </span>
            {tx && <span style={{ color: MUTED }}>{tx.status}</span>}
            <span style={{ color: MUTED }}>OPERATOR: {displayName}</span>
          </div>

          {/* Briefing */}
          <h1
            id="dispatch-heading"
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {briefing
              ? `Module ${briefing.number}: ${briefing.name}`
              : worldName}
          </h1>
          {briefing && (
            <p
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: MUTED,
                marginBottom: 32,
              }}
            >
              Lesson {briefing.lessonNumber} of {briefing.totalLessons} · ~
              {briefing.estimatedMinutes} min · {briefing.topic}
            </p>
          )}

          {/* CTA. Static button on purpose: no arbitrary-value hover
              class precedent exists in apps/web (grep "text-(--tc"
              returns nothing) and a JS hover would force "use client";
              the offset shadow carries the affordance. */}
          <Link
            href={resumeUrl ?? `/worlds/${worldSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 32px",
              background: LIME,
              color: ON_PRIMARY,
              fontSize: 15,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              border: `2px solid ${LIME}`,
              boxShadow:
                "3px 3px 0 color-mix(in srgb, var(--tc-primary) 20%, transparent)",
              textDecoration: "none",
              marginBottom: 40,
            }}
          >
            {resumeUrl ? `Start First ${lessonTerm} →` : "Start Learning →"}
          </Link>

          {/* Stat strip: neutral hairline dividers (structure, not accent
              bars). */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              border: `1px solid ${BORDER_VAR}`,
              marginBottom: 20,
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: "1 1 140px",
                  padding: "14px 18px",
                  borderRight:
                    i < stats.length - 1
                      ? `1px solid ${BORDER_VAR}`
                      : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: MUTED,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{ fontFamily: MONO, fontSize: 13, color: WHITE }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
            Activity, skill genome, bridges, and patches switch on after
            your first completed lesson.
          </p>
        </section>
      </main>
    </div>
  );
}
```

CTA hover: resolved to a static button (no hover class). The reviewer
confirmed no arbitrary-value hover precedent exists in apps/web, and a
JS hover would force the component client-side for a decoration.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/app/dashboard/__tests__/first-run-view.test.tsx`
Expected: PASS (8 tests).

If the axe test flags the `<main>` landmark or heading order, fix the
markup, not the test. Do NOT commit.

### Task 2: page.tsx branch (TDD)

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Create: `apps/web/app/dashboard/__tests__/page-first-run.test.tsx`
- Modify: `apps/web/app/dashboard/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing test**

`page-first-run.test.tsx`: copy the mock scaffolding from
`page.test.tsx` (RedirectError, supabase mock with `tableData`,
world-cards stub) but give the content mock one real module so the
briefing can build, and mock both views to named nulls:

```tsx
vi.mock("@tensorcraft/content", () => {
  const lessons = [
    { slug: "introduction-to-tensors", title: "Introduction to Tensors" },
    { slug: "understanding-tensor-shapes", title: "Understanding Tensor Shapes" },
  ];
  return {
    getModules: () => [
      {
        slug: "foundations",
        title: "Foundations: Tensors & Data",
        description: "Build your first net",
      },
    ],
    getModule: () => null,
    getModuleLessons: () => lessons,
    getLesson: () => null,
    getLessonTotalMinutes: () => 12,
    getWorldLessons: () => lessons,
    getLessonsWithBridges: () => [],
  };
});

vi.mock("../first-run-view", () => ({
  FirstRunView: function FirstRunViewMock() {
    return null;
  },
}));
vi.mock("../dashboard-view", () => ({
  DashboardView: function DashboardViewMock() {
    return null;
  },
}));
```

(`getLessonTotalMinutes` must be added to this mock; page.tsx imports
it. Check page.test.tsx's existing content mock: it omits it because
the mocked module list is empty there; this file's mock cannot.)

Tests (read `element.type.name` to see which view the page chose):

1. `renders FirstRunView for an account with no completed lessons and no attempts`:
   empty `world_progress` and `exercise_attempts` tables. Assert
   `element.type.name === "FirstRunViewMock"`, and props:
   `briefing.number === 1`, `briefing.lessonNumber === 1`,
   `resumeUrl === "/worlds/deep-orbit/foundations/introduction-to-tensors"`,
   `totalWorldLessons === 2`, and `firstPatchLessonCount === 2`
   (deep-orbit resolves patch art; the mocked module has 2 lessons).
2. `renders FirstRunView when lessons were started but never completed`:
   `tableData.world_progress = [{ world_id: "deep-orbit", module_id: "foundations", lesson_id: "introduction-to-tensors", status: "in_progress", updated_at: "2026-08-16T10:00:00Z" }]`.
   Assert FirstRunViewMock.
3. `renders the full DashboardView once a lesson is completed`: same row
   with `status: "completed"`. Assert DashboardViewMock.
4. `renders the full DashboardView once any exercise attempt exists`:
   empty progress, `tableData.exercise_attempts = [{ score: null, attempted_at: "2026-08-16T10:00:00Z", lesson_id: "introduction-to-tensors", world_id: "deep-orbit", hints_used: 0 }]`.
   Assert DashboardViewMock (a recorded attempt exits first-run even
   with a null score).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/app/dashboard/__tests__/page-first-run.test.tsx`
Expected: FAIL (`../first-run-view` unresolved from page.tsx / all
cases render DashboardViewMock).

- [ ] **Step 3: Implement the branch in page.tsx**

1. Add imports: `FirstRunView` from `./first-run-view`.
2. MOVE (not copy) the `displayName` / `avatarUrl` computation from the
   bottom of the function (lines ~362-364) to just after the
   `streaks/records/attempts` constants so both branches can use it. A
   duplicate `const displayName` is a compile error.
3. After the `totalLessons` / `completedLessonsCount` /
   `worldProgressPercent` block, insert:

```tsx
// First-run: no completed lesson and no recorded attempt anywhere.
// One completed lesson or one attempt exits this branch permanently
// (spec: docs/superpowers/specs/2026-08-16-first-run-dashboard-design.md).
const isFirstRun =
  attempts.length === 0 &&
  records.every((r) => r.status !== "completed");

if (isFirstRun) {
  const firstModule = contentModules[0];
  const firstModuleLessons = firstModule
    ? getModuleLessons(activeWorld.slug, firstModule.slug)
    : [];
  return (
    <FirstRunView
      displayName={displayName}
      worldName={activeWorld.displayName}
      worldSlug={activeWorld.slug}
      plateSrc={surfacePlateSrc(activeWorld.slug, "dashboard")}
      briefing={currentModuleInfo}
      resumeUrl={resumeUrl}
      firstPatchLessonCount={
        firstModule && patchSrc(activeWorld.slug, firstModule.slug)
          ? firstModuleLessons.length
          : undefined
      }
      totalWorldLessons={totalLessons}
    />
  );
}
```

Everything below (streak stats, bridges, heatmap, recent activity,
world cards) is unreachable for first-run accounts and stays unchanged
for everyone else.

- [ ] **Step 4: Update page.test.tsx for the new branch**

Two edits, both required because empty tables now mean first-run:

1. Add `vi.mock("../first-run-view", () => ({ FirstRunView: () => null }))`
   beside the existing dashboard-view mock.
2. The test `yields 12 null-avgHints buckets when exercise_attempts is
   empty` asserts on DashboardView props, so its account must exit
   first-run without attempts: add
   `tableData.world_progress = [{ world_id: "deep-orbit", module_id: "m", lesson_id: "l", status: "completed", updated_at: "2026-08-01T00:00:00Z" }];`
   before importing the page.

- [ ] **Step 5: Run both page test files**

Run: `pnpm vitest run apps/web/app/dashboard/__tests__/page-first-run.test.tsx apps/web/app/dashboard/__tests__/page.test.tsx`
Expected: PASS. Do NOT commit.

### Task 3: Grid hardening (full dashboard)

**Files:**
- Modify: `apps/web/app/dashboard/dashboard-view.tsx:677` (heatmap), `:746-761` (gutters)
- Modify: `apps/web/app/dashboard/bridge-collection.tsx:77`
- Tests: existing suites cover behavior; sizing is style-only. Verify via
  the visual check in Task 4.

- [ ] **Step 1: Fix the heatmap cell size**

In dashboard-view.tsx, the heatmap grid (currently
`gridTemplateColumns: "repeat(10, 1fr)"`) becomes fixed-size cells:

```tsx
gridTemplateColumns: "repeat(10, 18px)",
```

(`gap: 6` is already the current value; leave it.) Cells keep
`aspectRatio: "1"`, so the whole heatmap is now 234px wide at every
viewport instead of scaling with the page.

- [ ] **Step 2: Fix the bridge tile size**

In bridge-collection.tsx, replace the token grid classes:

```tsx
<div className="grid grid-cols-[repeat(auto-fill,2.75rem)] gap-0.5">
```

Tiles keep `aspect-square`, so every tile is 44px at every viewport.

- [ ] **Step 3: Restore the gutters**

In dashboard-view.tsx, wrap the three flush panels in the main column's
horizontal padding:

```tsx
<div style={{ padding: "0 40px" }}>
  <SkillGenome data={genomeData} />
  <BridgeCollection bridges={bridges} />
  <PatchCollection modules={modules} />
</div>
```

(The existing comments above each component stay with them inside the
wrapper.)

- [ ] **Step 4: Run the dashboard suites**

Run: `pnpm vitest run apps/web/app/dashboard`
Expected: PASS (no dashboard test asserts on the old grid classes; if
one does, update the assertion to the new fixed-size classes). Do NOT
commit.

### Task 4: Verification and docs

**Files:**
- Modify: `docs/post-launch-backlog.md` (one deferred-work line)

- [ ] **Step 1: Full battery**

Run: `pnpm test`
Expected: all green, including `packages/content` gates (em-dash ban
sweeps the new files; slop lexicon covers prose).

- [ ] **Step 2: Format check**

Run: `pnpm exec prettier --check apps/web/app/dashboard docs/superpowers`
Expected: clean; run `--write` on any flagged file.

- [ ] **Step 3: Visual check (best effort)**

Use the `run` skill to start the dev server and view /dashboard in both
schemes at desktop and mobile widths via CDP. The route needs an authed
session with a zero-progress account; if no such session is available
locally, state that in the final report instead of faking it.

- [ ] **Step 4: Document the deferred boundary**

Add one line to `docs/post-launch-backlog.md` (never a new backlog
file): per-panel progressive disclosure for partially-empty dashboards
was considered and deliberately not built (owner chose the first-run
variant; spec 2026-08-16 records the boundary).

- [ ] **Step 5: Report**

Summarize: what a new account now sees, the three grid fixes, test
counts, and the uncommitted-files list. The owner commits.
