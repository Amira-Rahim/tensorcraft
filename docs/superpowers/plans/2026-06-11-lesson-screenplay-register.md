# Lesson Screenplay Register + Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give lesson pages a distinct screenplay register for story content, a single quiet meta line, an honest exit chip, and focus mode (no marketing nav).

**Architecture:** Typography-only register shift carried by shared `Dialogue`/`SceneHeading` components plus CSS `:has()` positional rules scoped under a `data-story-register` attribute set by the Briefing step. No MDX content edits, no render reordering.

**Tech Stack:** Next.js App Router, React 19, Tailwind v4 + CSS custom properties (`--tc-*` set per theme by `packages/themes/src/css/themes.css`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-11-lesson-screenplay-register-design.md`

**Repo rule override:** Do NOT run `git add`/`git commit` - CLAUDE.md forbids commits on the user's behalf. Skip every "commit" step convention; the user commits after review.

---

## Task 1: Focus mode - hide Nav on lesson routes

**Files:**
- Modify: `apps/web/app/components/nav.tsx`
- Test: `apps/web/app/components/nav.test.tsx`

- [ ] **Step 1: Make the `usePathname` mock controllable in `nav.test.tsx`**

Replace the existing `vi.mock("next/navigation", ...)` block (lines 32-40) with:

```tsx
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname,
}));
```

Add `mockPathname = "/";` inside the existing `beforeEach` (or add a `beforeEach` if the reset isn't there) so prior tests keep the default.

- [ ] **Step 2: Write the failing tests** (append inside `describe("Nav")`)

```tsx
it("hides itself on lesson viewer routes (focus mode)", () => {
  mockPathname = "/themes/deep-orbit/foundations/introduction-to-tensors";
  const { container } = render(<Nav />);
  expect(container.querySelector("[data-testid='site-nav']")).toBeNull();
});

it("stays visible on theme and capstone routes", () => {
  mockPathname = "/themes/deep-orbit";
  const first = render(<Nav />);
  expect(first.getByTestId("site-nav")).toBeInTheDocument();
  first.unmount();

  mockPathname = "/themes/deep-orbit/capstone";
  const second = render(<Nav />);
  expect(second.getByTestId("site-nav")).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests, verify the new ones fail**

Run: `npx vitest run apps/web/app/components/nav.test.tsx`
Expected: 2 new tests FAIL (nav renders on lesson route), existing tests PASS.

- [ ] **Step 4: Implement in `nav.tsx`**

In `Nav()` (line 34), after the existing `useEffect` block (after line 48) - NOT before the hooks, React hook order must stay stable:

```tsx
const pathname = usePathname();
// Focus mode: lesson viewer routes get no marketing nav. Lesson routes are
// exactly /themes/{slug}/{module}/{lesson}; the capstone page is 3 segments
// (/themes/{slug}/capstone) so it never matches - the endsWith guard is
// only defensive against a lesson slug literally named "capstone".
const isLessonRoute =
  /^\/themes\/[^/]+\/[^/]+\/[^/]+$/.test(pathname) &&
  !pathname.endsWith("/capstone");
if (isLessonRoute) return null;
```

Move the `const pathname = usePathname();` call up beside `useState` (hooks first, conditional return after all hooks).

- [ ] **Step 5: Run tests, verify all pass**

Run: `npx vitest run apps/web/app/components/nav.test.tsx apps/web/app/components/nav.snapshot.test.tsx`
Expected: all PASS.

---

## Task 2: Exit chip - quiet, honest label

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (top-bar `Link`, currently labeled `← {moduleName}`)
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.test.tsx`

- [ ] **Step 1: Write the failing test** (append to existing describe, or a new one)

```tsx
describe("LessonSteps, exit chip", () => {
  it("labels the exit link Mission Map and points at the theme page", () => {
    renderSteps();
    const exit = screen.getByRole("link", { name: /mission map/i });
    expect(exit).toHaveAttribute("href", "/themes/deep-orbit");
  });
});
```

- [ ] **Step 2: Run, verify it fails** (link is currently named "Foundations: Tensors & Data")

Run: `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.test.tsx"`

- [ ] **Step 3: Implement** - replace the exit `Link` block in the top bar:

```tsx
<Link
  href={`/themes/${themeSlug}`}
  className="text-sm font-mono flex items-center gap-2 shrink-0 px-3 py-2 border border-transparent opacity-70 transition-all hover:opacity-100 hover:border-current"
  style={{ color: theme.palette.text }}
>
  &larr; Mission Map
</Link>
```

(Drops the `background`/`border` inline styles - transparent at rest, border on hover.)

- [ ] **Step 4: Run, verify pass.** Note: the e2e back-link test (`e2e/themes.spec.ts` "shows a link back to the module map") matches `/back|module|foundations/i` - "Mission Map" does NOT match. Update that matcher to `/mission map|module|foundations/i` in the same change.

---

## Task 3: Meta line replaces pills

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (`StepBriefing` pills block, `Pill` component, `tierLabel`)
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
describe("LessonSteps, briefing meta line", () => {
  it("shows minutes only when there are no exercises, no bridge tier", () => {
    renderSteps();
    expect(screen.getByText(/10 min/i)).toBeInTheDocument();
    expect(screen.queryByText(/exercise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bridge/i)).not.toBeInTheDocument();
  });

  it("appends pluralized exercise count when exercises exist", () => {
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[{ slug: "a" }, { slug: "b" }] as never}
        theme={theme}
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    expect(screen.getByText(/10 min · 2 exercises/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify both fail** (pills render "10 min" inside a pill with `●`, "concept bridge" pill exists, no `·` join).

- [ ] **Step 3: Implement in `StepBriefing`** - replace the pills `div` (the `flex flex-wrap gap-3` block) with:

```tsx
<div
  className="font-mono text-xs uppercase tracking-wider mb-8 pt-5"
  style={{
    color: theme.palette.muted,
    borderTop: `1px solid ${theme.palette.border}`,
  }}
>
  {lesson.estimatedMinutes} min
  {exercises.length > 0 &&
    ` · ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}`}
</div>
```

Delete the now-unused `tierLabel` const and the `Pill` helper component (only consumer).

- [ ] **Step 4: Run lesson-steps suite, verify all pass (including the 7 segmented-bar tests).**

---

## Task 4: Dialogue - screenplay treatment + CUT-TO element

**Files:**
- Modify: `packages/ui/src/mdx/dialogue.tsx`
- Test: `packages/ui/src/mdx/dialogue.test.tsx`

- [ ] **Step 1: Write the failing tests** (append to existing describe)

```tsx
it("marks its root with data-dialogue for positional CSS", () => {
  const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
  expect(container.querySelector("[data-dialogue='true']")).toBeInTheDocument();
});

it("colors the speaker with the theme primary variable", () => {
  render(<Dialogue speaker="ARIA">Test</Dialogue>);
  expect(screen.getByText("ARIA")).toHaveAttribute(
    "style",
    expect.stringContaining("--tc-primary"),
  );
});

it("renders a hidden, decorative CUT-TO divider", () => {
  const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
  const cut = container.querySelector(".tc-cut-to");
  expect(cut).toBeInTheDocument();
  expect(cut).toHaveClass("hidden");
  expect(cut).toHaveAttribute("aria-hidden", "true");
});
```

- [ ] **Step 2: Run, verify the 3 new tests fail**

Run: `npx vitest run packages/ui/src/mdx/dialogue.test.tsx`

- [ ] **Step 3: Implement**

```tsx
export function Dialogue({ speaker, direction, children }: DialogueProps) {
  return (
    <div className="mb-7 pl-6" data-dialogue="true">
      <div
        className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1.5"
        style={{ color: "var(--tc-primary, #E0E0E0)" }}
      >
        {speaker}
      </div>
      {direction && (
        <div
          className="text-[13px] italic mb-1"
          style={{ color: "var(--tc-muted, #A0A0A0)" }}
          data-testid="direction"
        >
          ({direction})
        </div>
      )}
      <div
        className="text-[15px] leading-relaxed max-w-[560px]"
        style={{ color: "var(--tc-text, #c8c8c8)" }}
      >
        {children}
      </div>
      {/* Shown only on the last dialogue of a Briefing story zone; the web
          app's lesson CSS opts it in under [data-story-register]. Hidden by
          default so other consumers of @tensorcraft/ui never see it. */}
      <div className="tc-cut-to hidden items-center gap-3 mt-8" aria-hidden="true">
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
        <span
          className="font-mono text-[9px] uppercase tracking-[3px]"
          style={{ color: "var(--tc-muted, #777777)" }}
        >
          Cut to: Briefing
        </span>
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run dialogue tests (including the axe test), verify all pass.**

---

## Task 5: SceneHeading - primary-colored prefix

**Files:**
- Modify: `packages/ui/src/mdx/scene-heading.tsx`
- Test: `packages/ui/src/mdx/scene-heading.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("renders the prefix in the theme primary color", () => {
  render(<SceneHeading location="Lab" prefix="Int." />);
  const prefix = screen.getByText(/INT\./);
  expect(prefix).toHaveAttribute(
    "style",
    expect.stringContaining("--tc-primary"),
  );
});
```

- [ ] **Step 2: Run, verify it fails** (prefix is part of one flat text node today).

- [ ] **Step 3: Implement** - text output must stay byte-identical for the three existing tests (`LAB`, `SERVER ROOM - MORNING`, no stray `" - "` without time/prefix):

```tsx
export function SceneHeading({ location, time, prefix }: SceneHeadingProps) {
  const rest = [location, ...(time ? [time] : [])].join(" - ").toUpperCase();

  return (
    <div
      className="font-mono text-[10px] uppercase tracking-[2.5px] pb-3 mb-7"
      style={{
        color: "var(--tc-muted, #555555)",
        borderBottom: "1px solid var(--tc-border, #2a2a2a)",
      }}
    >
      {prefix && (
        <span style={{ color: "var(--tc-primary, #6baa8a)" }}>
          {`${prefix.toUpperCase()} - `}
        </span>
      )}
      {rest}
    </div>
  );
}
```

Heads-up: the existing test "omits time separator when no time" asserts `textContent` does NOT contain `" - "` - it renders `<SceneHeading location="Lab" />` with no prefix, so it still passes. Do not add a separator outside the `prefix &&` guard.

- [ ] **Step 4: Run scene-heading tests, verify all pass.**

---

## Task 6: Story-register plumbing (LessonContent + StepBriefing)

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx`
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (`StepBriefing`)
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.test.tsx`
- Test: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.test.tsx`

- [ ] **Step 1: Write the failing LessonContent test** (uses the real component)

```tsx
describe("LessonContent, story register", () => {
  it("sets data-story-register only when the flag is passed", () => {
    const { container, rerender } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
        storyRegister
      />,
    );
    expect(
      container.querySelector("[data-story-register='true']"),
    ).toBeInTheDocument();

    rerender(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
      />,
    );
    expect(
      container.querySelector("[data-story-register]"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write the failing LessonSteps test.** Update the `./lesson-content` mock so the flag is observable:

```tsx
vi.mock("./lesson-content", () => ({
  LessonContent: ({ storyRegister }: { storyRegister?: boolean }) => (
    <div
      data-testid="lesson-content"
      data-story-register={storyRegister ? "true" : undefined}
    />
  ),
}));
```

```tsx
describe("LessonSteps, story register", () => {
  it("flags Briefing content as story register, Concept step not", () => {
    renderSteps();
    expect(
      document.querySelector("[data-story-register='true']"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelector("[data-story-register='true']"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run both suites, verify the 2 new tests fail.**

- [ ] **Step 4: Implement.**

`lesson-content.tsx`:
- Add `storyRegister?: boolean;` to `LessonContentProps`.
- Destructure it in the component signature.
- On the wrapper div (`className="max-w-none lesson-prose lesson-step-content"`), add:
  `data-story-register={storyRegister ? "true" : undefined}`

`lesson-steps.tsx`, in `StepBriefing`:
- Pass `storyRegister` to the `LessonContent` call (the one with `visibleComponents={new Set(["Dialogue", "prose"])}`).
- Change the narrative paragraph classes from `max-w-[520px]` to `pl-6 max-w-[52ch]` (keeps italic + muted):

```tsx
<p
  className="text-sm italic leading-[1.85] mb-7 pl-6 max-w-[52ch]"
  style={{ color: theme.palette.muted }}
>
  {lesson.context.narrative}
</p>
```

- [ ] **Step 5: Run both suites, verify all pass.**

---

## Task 7: Positional CSS (story-zone prose + CUT-TO opt-in)

**Files:**
- Modify: `apps/web/app/globals.css` (lesson-prose section, after the `data-show-prose` rules around line 188)

No unit test - jsdom doesn't apply `:has()` styling; the DOM contract (attributes, classes) is covered by Tasks 4 and 6. Verified visually in Step 2.

- [ ] **Step 1: Add the rules**

```css
/* Screenplay register (Briefing step). Story-zone prose = any paragraph
   that still has a Dialogue after it; the CUT-TO divider surfaces only on
   the final dialogue of the opening scene. Without :has() support these
   rules no-op: no divider, prose stays plain - register shift still
   carried by Dialogue/SceneHeading styling. */
.lesson-step-content[data-story-register="true"] > p:has(~ [data-dialogue]) {
  font-style: italic;
  color: var(--tc-muted);
  padding-left: 1.5rem;
  max-width: 52ch;
}

.lesson-step-content[data-story-register="true"]
  > [data-dialogue]:not(:has(~ [data-dialogue]))
  .tc-cut-to {
  display: flex;
}
```

(The rules are unlayered author CSS, which beats Tailwind v4's layered `hidden` utility regardless of source order or specificity.)

- [ ] **Step 2: Visual check**

Run: `npm run dev`, open `http://localhost:3000/themes/deep-orbit/foundations/introduction-to-tensors` (clear `tc_step_*` keys or use incognito to land on 1/6).
Expected: no marketing nav; quiet `← Mission Map` chip; `10/12 min` meta line without pills; indented italic narration; primary-colored speakers; one `CUT TO: BRIEFING` rule after the last opening dialogue; plain full-width prose below it. Step 6 (Consequence): epilogue dialogues styled, NO cut-to divider.
Check a second lesson whose opening starts with prose (e.g. `/themes/deep-orbit/browser-runtimes/tensorflow-js-setup`) - leading prose should read as stage direction.
Contrast: verify `--tc-muted` (#b0b0b0 on Deep Orbit) italic stage directions against the page background meets WCAG AA 4.5:1 (DevTools color picker shows the ratio); bump the tone if it fails.

---

## Task 8: e2e updates

**Files:**
- Modify: `e2e/themes.spec.ts`

- [ ] **Step 1: Add focus-mode tests to the "Lesson Viewer Page" describe**

```ts
test("hides marketing nav in focus mode", async ({ page }) => {
  await page.goto("/themes/deep-orbit/foundations/introduction-to-tensors");
  await expect(page.getByTestId("site-nav")).toHaveCount(0);
});

test("marketing nav still renders on the theme page", async ({ page }) => {
  await page.goto("/themes/deep-orbit");
  await expect(page.getByTestId("site-nav")).toBeVisible();
});
```

- [ ] **Step 2: Fix the back-link matcher** (if not already done in Task 2): in "shows a link back to the module map", change the name regex to `/mission map|module|foundations/i`.

- [ ] **Step 3: Optionally run e2e if a dev server is available**

Run: `npx playwright test e2e/themes.spec.ts`
If no server/playwright setup in this environment, note it as not-run in the final report.

---

## Task 9: Full verification + docs

- [ ] **Step 1: Full unit suite**

Run: `npx vitest run`
Expected: all green (290+ tests incl. new ones).

- [ ] **Step 2: Typecheck (forced, turbo caches aggressively)**

Run: `npx turbo typecheck --force`
Expected: 9/9 tasks pass.

- [ ] **Step 3: Update `docs/architecture.md`**

- Lesson viewer route row: append "; screenplay register for story content; marketing nav hidden (focus mode)".
- `lesson-steps.tsx` component row: mention meta line + story-register flag.
- Accessibility section: note the CUT-TO divider is `aria-hidden` decorative.

- [ ] **Step 4: Report** - list changed files, test counts, e2e status. Do NOT commit.
