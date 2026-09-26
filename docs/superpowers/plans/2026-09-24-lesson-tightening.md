# Lesson Page Tightening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the seven measured defects inside the lesson page's frame: a consent bar that never covers content, the recap after the recall, the exercise brief beside the editor, code that wraps on phones, labelled steps, one closing title and one forward control on the Complete step, and the accent shadow reserved for containers the learner acts in.

**Architecture:** Every change stays inside the 2026-09-23 frame. The consent region becomes a full-width bar that publishes its height through a CSS custom property the body reads as bottom padding. The Takeaways step splits its visibility set in two and renders the second half once `LessonContent` reports zero unsettled recall cards. The exercise brief moves to a Sandpack-free module rendered by the Challenge step's left instance. A media block below 1,024 px wraps code with a hanging indent. The step bar, the Complete step and the shadow rule are edits to `lesson-steps.tsx` and eleven component files.

**Tech Stack:** Next 16 app (`apps/web`), Tailwind v4 utilities plus `apps/web/app/globals.css`, React 19 components in `packages/ui`, Sandpack editor, Shiki 4, vitest with jsdom (root config), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-lesson-tightening-design.md` (approved 2026-09-24). Read it first; every task cites the section it implements.

**Repo rules that bind every task:** never run `git commit` (the owner commits at each checkpoint); no em dash character anywhere, including comments, test names and this plan's own edits; no coloured left accent bars; keep `docs/post-launch-backlog.md` the only task doc; every user-visible string follows `docs/writing-quality-rubric.md`. Tool parameters decode backslash-u escapes into glyphs, so never type such an escape into a file through a tool: the existing `PhaseChip` icon lines in `lesson-steps.tsx` carry escapes and this plan never rewrites them.

---

## Commands used throughout

| Purpose | Command (from the repo root) |
| --- | --- |
| One unit test file | `pnpm exec vitest run "<path>"` (quote paths with brackets) |
| The whole unit suite | `pnpm exec vitest run` |
| Typecheck | `pnpm typecheck` (nine turbo tasks; report "no errors", never a count) |
| Lint | `pnpm lint` |
| Content build (before any test that reads the velite build) | `cd packages/content && pnpm run build:content && cd ../..` |
| Production build for e2e | `source /tmp/tc-e2e-env.sh && rm -rf apps/web/.next && pnpm turbo build --filter @tensorcraft/web && git checkout -- apps/web/next-env.d.ts` (turbo runs the content build first) |
| One e2e spec against that build | `source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/<spec> --project=chromium --reporter=line > /tmp/e2e.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e.log` (never pipe Playwright through `tail`; it hides failures) |
| Mint one visual spec against that build | `source /tmp/tc-e2e-env.sh && RUN_VISUAL=1 CI=1 PW_PORT=3111 npx playwright test e2e/visual/<spec> --project=chromium --update-snapshots=all > /tmp/visual.log 2>&1` |

Shell state does not persist between commands, and `next start` refuses to boot without the Supabase variables (placeholders are enough). Write them to a file once and source it at the head of every build and every Playwright command:

```bash
cat > /tmp/tc-e2e-env.sh <<'ENV'
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_placeholder_anon_key
export NEXT_PUBLIC_API_URL=http://localhost:3998
export SUPABASE_URL=https://placeholder.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_placeholder_service_role_key
ENV
```

`CI=1` is what makes Playwright serve the production build with `next start`. Without it Playwright starts `next dev`, and `next dev` over a production `.next` serves unstyled pages that still pass axe and a fresh baseline. Never run a Playwright command in this plan without `CI=1`.

Ports 3000 and 3001 belong to the owner's other project; never point Playwright at them and never kill what listens there. Identify a `next-server` you started by its working directory before stopping it (`lsof -a -p <pid> -d cwd -Fn`).

## Shared contracts

| Name | Meaning |
| --- | --- |
| `--tc-consent-h` | Custom property on `<html>`, set by the consent bar to its own height while it shows; `body` reads it as bottom padding; four bottom-fixed elements add it to their offset |
| `data-testid="cookie-consent-card"` | Now on the consent region root (the bar) |
| `TAKEAWAYS_RECALL` / `TAKEAWAYS_AFTER` | The Takeaways step's two visibility sets, `{"RecallPrompt"}` and `{"ProjectMilestone", "LessonRecap", "NextLesson"}` |
| `onRecallPending(n)` | `LessonContent` prop: the number of recall cards in the instance still in their prompt state, reported after the first commit and after every settle |
| `tc_recall_<world>_<lesson>[:account:<owner>]` | The per-lesson "recall done" flag, derived like `tc_step_` |
| `data-testid="takeaways-recall"` / `"takeaways-prose"` | The recall wrapper and the after-recall wrapper on the Takeaways step |
| `"ExerciseBrief"` | Pseudo-name in `CHALLENGE_LEFT`; the left instance renders the brief where the MDX places `<Exercise>` |
| `Exercise brief="external" titled` | The pane without its brief; `titled` adds the exercise title to the eyebrow row when the lesson has more than one exercise |
| `data-testid="exercise-brief"` | The brief's root |
| `STEP_EVENT_NAMES` | The analytics step names; `STEP_NAMES[5]` becomes `"Epilogue"`, `STEP_EVENT_NAMES[5]` stays `"Consequence"` |
| `data-testid="step-label"` | The label under each step segment |
| `data-testid="next-lesson-card"` | Moves onto the nav row's next-mission control on the Complete step |

Step numbers in prose are 1-based (1 Briefing to 6 Complete); `currentStep` is 0-based.

## File structure

| File | Responsibility after this plan |
| --- | --- |
| `apps/web/app/components/cookie-consent.tsx` | The consent bar; publishes `--tc-consent-h` |
| `apps/web/app/components/report-issue-button.tsx`, `session-toast.tsx`, `github-nudge-toast.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-drawer.tsx` | Bottom offsets add `--tc-consent-h` |
| `apps/web/app/globals.css` | `body` bottom padding; the phone code-wrap media block |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | Sets, recall state and key, chrome labels and title rule, `STEP_EVENT_NAMES`, Complete step, nav control |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `onRecallPending` with a registrar; the Exercise bindings render brief or external-brief pane by set |
| `packages/ui/src/mdx/exercise-data.tsx` (new) | Context, provider, chip configs, not-found card; no Sandpack import |
| `packages/ui/src/mdx/exercise-brief.tsx` (new) | The brief |
| `packages/ui/src/mdx/exercise.tsx` | `brief` and `titled`; header row wraps between chips; `wrapContent` on the editor; nested panels lose the shadow; imports from `exercise-data` |
| `packages/ui/src/mdx/index.ts`, `packages/ui/src/index.ts` | Export `ExerciseBrief` |
| Eleven component files (Task 1) | `brutalist-shadow` removed |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts` | Gains the shadow rule, the consent property and the code-wrap block |
| `e2e/lesson-layout.spec.ts`, `e2e/consent-bar.spec.ts` (new), `e2e/end-of-lesson.spec.ts`, `e2e/worlds.spec.ts`, four specs naming step 6 | Page-level proof |
| `e2e/visual/key-pages.spec.ts`, `responsive.spec.ts`, `worlds.spec.ts` | Store a declined consent; baselines re-minted |
| `docs/post-launch-backlog.md`, `docs/visual-regression.md` | The audit record; the re-mint record |

---

### Task 0: Branch, then measure the visual drift before any change (spec, Tests: Visual)

The committed key-pages, responsive and worlds baselines drifted on clean main before this work (pricing at 1,440 and the deep-orbit world page, noted 2026-09-15). Task 8 re-mints all 30 of them, and this measurement keeps that re-mint from absorbing the drift unrecorded. It runs first, on the untouched tree, because every later task changes what those pages render, and a measurement of `main` taken later would include any checkpoint commits that landed there.

**Files:**
- Modify: `docs/visual-regression.md` (a note under the "Baseline record" table)

- [ ] **Step 1: Work on a branch**

The spec's rollout is one branch reviewed as one diff. In this checkout run `git switch -c feature/lesson-tightening` (the untracked spec and plan come along), and do not move the work to a new worktree: the visual steps in this task and in Task 8 compare against baselines captured here, and this checkout's `apps/web` holds local env files that a new worktree lacks (never open them; they may hold credentials). Then `git status --short` must show nothing outside `docs/superpowers/`.

- [ ] **Step 2: Build the untouched tree**

Write the env file from "Commands used throughout" if `/tmp/tc-e2e-env.sh` does not exist, then run the production build command from the table.

- [ ] **Step 3: Compare the three specs against their committed baselines**

```bash
source /tmp/tc-e2e-env.sh && RUN_VISUAL=1 CI=1 PW_PORT=3119 npx playwright test e2e/visual/key-pages.spec.ts e2e/visual/responsive.spec.ts e2e/visual/worlds.spec.ts --project=chromium --update-snapshots=none --reporter=line > /tmp/visual-cold.log 2>&1; grep -E "failed|passed|flaky|pixels|ratio|Expected an image" /tmp/visual-cold.log
```

Nothing is minted here. With `CI=1` Playwright retries once, so a capture reported as flaky failed once: record it as drift. If the call could pass the 10-minute tool limit, run it in the background and wait for its completion notification.

- [ ] **Step 4: Record what drifted**

Append after the "Baseline record" table in `docs/visual-regression.md`:

```markdown
Drift on the untouched tree before the 2026-09-24 lesson tightening work, measured on commit `<git rev-parse --short HEAD>` against a production build (`next start`): <each failing snapshot with the diff Playwright reported, or "none, every capture matched">. The re-mint of these sets for that work keeps exactly these differences; anything else in those images comes from the work.
```

Fill both angle-bracket fields from the commands' output before saving. They are measurements, so the plan cannot carry them.

- [ ] **Step 5: Checkpoint**

Owner commits. Suggested message: `docs(visual): record the baseline drift measured before the lesson tightening work`.

---

### Task 1: The accent shadow stays only where the learner acts (spec section 7)

**Files:**
- Modify: `packages/ui/src/mdx/code-block.tsx:83`, `packages/ui/src/mdx/bridge-callout.tsx:93,156`, `packages/ui/src/mdx/learning-objectives.tsx:7`, `packages/ui/src/mdx/key-takeaways.tsx:8`, `packages/ui/src/mdx/lesson-recap.tsx:13`, `packages/ui/src/mdx/derivation-drawer.tsx:38`, `apps/web/app/components/mdx/concept.tsx:112,120`, `apps/web/app/components/mdx/math-block.tsx:30,45`, `apps/web/app/components/mdx/next-lesson.tsx:21`, `apps/web/app/components/mdx/dispatch-tease.tsx:48`, `apps/web/app/components/mdx/strategy-thread.tsx:33`, `packages/ui/src/mdx/exercise.tsx:342,457,932`, `docs/tech-spec.md:701` (section 7.4, the Shadows row)
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts` (the new describe and one bullet in the file's header comment)

- [ ] **Step 1: Write the failing contract test**

Append to `lesson-layout-contract.test.ts`, after the last `describe`:

```ts
/* The offset accent shadow marks a container the learner acts in and
   nothing else (spec 2026-09-24, section 7). Source text checks, like the
   marker tests above: jsdom applies no CSS, and the class either is or is
   not in the className string. */
describe("accent shadow rule", () => {
  const keeps = [
    "packages/ui/src/mdx/hint-panel.tsx",
    "apps/web/app/components/review-prompt-card.tsx",
    "packages/ui/src/mdx/quiz.tsx",
    "apps/web/app/components/mdx/interactive-demo.tsx",
    "apps/web/app/components/mdx/boss-beat.tsx",
  ];
  const loses = [
    "packages/ui/src/mdx/code-block.tsx",
    "packages/ui/src/mdx/bridge-callout.tsx",
    "packages/ui/src/mdx/learning-objectives.tsx",
    "packages/ui/src/mdx/key-takeaways.tsx",
    "packages/ui/src/mdx/lesson-recap.tsx",
    "packages/ui/src/mdx/derivation-drawer.tsx",
    "apps/web/app/components/mdx/concept.tsx",
    "apps/web/app/components/mdx/math-block.tsx",
    "apps/web/app/components/mdx/next-lesson.tsx",
    "apps/web/app/components/mdx/dispatch-tease.tsx",
    "apps/web/app/components/mdx/strategy-thread.tsx",
  ];

  for (const file of keeps) {
    it(`${file} keeps the shadow`, () => {
      expect(read(file)).toMatch(/\bbrutalist-shadow\b/);
    });
  }

  for (const file of loses) {
    it(`${file} sits on a hairline`, () => {
      // A hover shadow is a control affordance and may stay (next-lesson).
      // One class token only, so an unclosed bracket cannot swallow text.
      const src = read(file).replace(/hover:shadow-\[[^\]\s]*\]/g, "");
      expect(src).not.toMatch(/\bbrutalist-shadow\b/);
      // The hairline the test name promises: the border that frames the block.
      expect(src).toMatch(/\bborder border-border\b/);
    });
  }

  it("the exercise pane keeps the shadow and its nested panels lose it", () => {
    const src = read("packages/ui/src/mdx/exercise.tsx");
    const hits = src.match(/\bbrutalist-shadow\b/g) ?? [];
    expect(hits).toHaveLength(1);
    // The one carrier is the pane root, whose class string also names the
    // line-number override that only the pane has.
    expect(src).toMatch(/\[&_\.cm-lineNumbers\][^"]*brutalist-shadow/);
  });
});
```

Add one bullet to the file's header comment, after the "beat and slot rules" bullet:

```ts
  - the accent shadow rule: which lesson components keep the offset
    shadow and which sit on a hairline (spec 2026-09-24, section 7).
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts"`
Expected: FAIL, the eleven "sits on a hairline" tests and the exercise-pane test; the "keeps" tests pass.

- [ ] **Step 3: Remove the class from the eleven files**

In each file, delete the token `brutalist-shadow ` (with its trailing space) from the class string on the cited line and nothing else. `next-lesson.tsx:21` keeps `brutalist-hover` and `hover:shadow-[4px_4px_0_var(--tc-primary)]`. In `exercise.tsx` remove it from the results panel (line 342), the console panel (line 457) and the not-found card (line 932); leave the pane root (line 964). After the edit:

```bash
grep -rn "brutalist-shadow" packages/ui/src/mdx apps/web/app/components/mdx apps/web/app/components/review-prompt-card.tsx
```

Expected hits, and no others: `hint-panel.tsx`, `quiz.tsx`, `interactive-demo.tsx`, `boss-beat.tsx` (three), `review-prompt-card.tsx`, `exercise.tsx` (one, line 964).

Then bring the convention doc in line. In `docs/tech-spec.md`, section 7.4, replace the Shadows row with:

```markdown
| Shadows | Hard offset shadows only, never `shadow-lg` or blurred shadows. The utility `.brutalist-shadow` is `4px 4px 0 var(--tc-primary)`. On the lesson page it marks only containers the learner acts in (the exercise pane, the recall and warm-up cards, the hint ladder, the decision boxes, the quiz, the interactive demo); presenting blocks sit on their hairline border (spec 2026-09-24, section 7). |
```

- [ ] **Step 4: Run the contract test and the two component suites**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts" packages/ui/src/mdx/lesson-recap.test.tsx packages/ui/src/mdx/key-takeaways.test.tsx`
Expected: PASS. If `lesson-recap.test.tsx` or `key-takeaways.test.tsx` asserts the shadow class, change that assertion to expect its absence and say so in the checkpoint note.

- [ ] **Step 5: Checkpoint**

Owner commits. Suggested message: `style(lesson): keep the offset shadow on containers the learner acts in`. Do not run `git commit`.

---

### Task 2: The consent bar (spec section 1)

**Files:**
- Modify: `apps/web/app/components/cookie-consent.tsx`, `apps/web/app/globals.css:82-88`, `apps/web/app/components/report-issue-button.tsx:246`, `apps/web/app/components/session-toast.tsx:37`, `apps/web/app/components/github-nudge-toast.tsx:29`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-drawer.tsx:70`
- Test: `apps/web/app/components/cookie-consent.test.tsx`, `apps/web/app/components/cookie-consent.snapshot.test.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`, `e2e/consent-bar.spec.ts` (new)

- [ ] **Step 1: Write the failing unit tests**

In `cookie-consent.test.tsx`, replace the test `"renders a brutalist card (rounded-none + brutalist-shadow)"` with:

```tsx
  it("renders the bar square-edged on a hairline, without the offset shadow", () => {
    const { container } = render(<CookieConsent />);
    const bar = container.querySelector('[data-testid="cookie-consent-card"]');
    expect(bar).not.toBeNull();
    expect(bar?.className).toMatch(/rounded-none/);
    expect(bar?.className).toMatch(/border-t/);
    expect(bar?.className).not.toMatch(/brutalist-shadow/);
    // The bar is the region: one element carries both.
    expect(bar).toHaveAttribute("role", "region");
  });

  it("publishes its height to the root element while it shows", () => {
    const root = document.documentElement;
    render(<CookieConsent />);
    // jsdom lays nothing out, so the height reads 0; the property is still
    // written, which is what body's padding-bottom reads.
    expect(root.style.getPropertyValue("--tc-consent-h")).toBe("0px");
    fireEvent.click(screen.getByText(/essential only/i));
    expect(root.style.getPropertyValue("--tc-consent-h")).toBe("");
  });

  it("publishes nothing when consent is already stored", () => {
    mockStorage["tc-cookie-consent"] = "declined";
    render(<CookieConsent />);
    expect(
      document.documentElement.style.getPropertyValue("--tc-consent-h"),
    ).toBe("");
  });
```

Append to `lesson-layout-contract.test.ts`:

```ts
describe("consent bar reserved space", () => {
  it("body pads its bottom by the bar's published height", () => {
    const css = read("apps/web/app/globals.css");
    expect(css).toMatch(
      /body\s*\{[^}]*padding-bottom:\s*var\(--tc-consent-h,\s*0px\)/,
    );
  });

  for (const file of [
    "apps/web/app/components/report-issue-button.tsx",
    "apps/web/app/components/session-toast.tsx",
    "apps/web/app/components/github-nudge-toast.tsx",
    "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-drawer.tsx",
  ]) {
    it(`${file} lifts its bottom edge by the bar's height`, () => {
      expect(read(file)).toContain("var(--tc-consent-h,0px)");
    });
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run apps/web/app/components/cookie-consent.test.tsx "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts"`
Expected: FAIL on the three new consent tests and the five new contract tests.

- [ ] **Step 3: Rewrite the consent component**

Replace the whole of `cookie-consent.tsx` with:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { CONSENT_KEY, notifyConsentChanged } from "../../lib/consent";

/* The bar publishes its height here while it shows. body reads it as
   bottom padding (globals.css) so nothing on any page is ever covered, and
   the bottom-fixed toasts, the Report issue panel and the lesson drawer
   add it to their offsets so they sit above the bar. Body padding moves
   none of those, which is why each carries the offset itself. */
export const CONSENT_HEIGHT_PROPERTY = "--tc-consent-h";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // localStorage may be blocked (e.g. private browsing)
      setVisible(true);
    }
  }, []);

  // A plain effect, not a layout effect: the first publish lands a frame
  // after paint, which no reader can see, and the component renders null
  // on the server anyway.
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    const bar = barRef.current;
    const publish = () => {
      const height = bar ? bar.getBoundingClientRect().height : 0;
      root.style.setProperty(CONSENT_HEIGHT_PROPERTY, `${height}px`);
    };
    publish();
    // Re-publish when the text wraps differently (a resize, a font swap).
    // jsdom has no ResizeObserver; the first publish still runs there.
    let observer: ResizeObserver | undefined;
    if (bar && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(publish);
      observer.observe(bar);
    }
    return () => {
      observer?.disconnect();
      root.style.removeProperty(CONSENT_HEIGHT_PROPERTY);
    };
  }, [visible]);

  // Both paths notify in-tab listeners. Writing localStorage alone is not
  // enough: the `storage` event does not fire in the tab that wrote the
  // value, so analytics stayed uninitialized for the whole session in which
  // the visitor actually accepted.
  function accept() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "accepted");
      }
    } catch {
      // localStorage may be unavailable
    }
    notifyConsentChanged();
    setVisible(false);
  }

  function decline() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "declined");
      }
    } catch {
      // localStorage may be unavailable
    }
    notifyConsentChanged();
    setVisible(false);
  }

  if (!visible) return null;

  /* One bar on the lesson frame's width: text left, choices right from md,
     stacked below it (spec 2026-09-24, section 1). No card, no offset
     shadow: a consent bar presents, it is not something the learner acts
     in for its own sake. The copy is the privacy audit's wording and does
     not change. */
  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-consent-card"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-raised rounded-none animate-fade-up"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-2 md:flex-row md:items-center md:justify-between md:gap-6 md:px-12">
        <p className="text-xs font-mono leading-relaxed text-text-muted">
          Essential cookies keep you signed in and remember your world choice.
          Analytics (PostHog, Vercel Analytics) runs only if you accept. See our{" "}
          <Link
            href="/privacy"
            className="text-primary rounded-none underline underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={accept}
            className="min-h-11 border border-primary/30 bg-primary/8 px-5 py-2 text-sm font-mono font-medium rounded-none hover:bg-primary/25 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={decline}
            className="min-h-11 border border-border px-5 py-2 text-sm font-mono font-medium text-text-muted rounded-none hover:text-text-primary hover:border-text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Reserve the space and lift the four fixed elements**

In `globals.css`, change the `body` rule (line 82) to:

```css
body {
  background-color: var(--tc-bg);
  color: var(--tc-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* The consent bar's height while it shows (cookie-consent.tsx), so a page
     scrolled to its end shows its last row above the bar. 0 once chosen. */
  padding-bottom: var(--tc-consent-h, 0px);
}
```

In `report-issue-button.tsx` line 246, make two separate edits: the panel's `bottom` (line 246) and its `maxHeight` (line 250). The `right`, `zIndex` and `width` properties between them stay as they are. The new values:

```ts
            bottom:
              "calc(max(16px, env(safe-area-inset-bottom)) + var(--tc-consent-h,0px))",
            // The panel rises with the bar, so its height gives the bar's
            // height back: an open panel must not push its Close control
            // above a short phone's viewport.
            maxHeight: "calc(100dvh - 32px - var(--tc-consent-h,0px))",
```

In `session-toast.tsx` line 37 and `github-nudge-toast.tsx` line 29, replace the class `bottom-4` with `bottom-[calc(1rem+var(--tc-consent-h,0px))]` (Tailwind v4 arbitrary value; no spaces inside the brackets).

In `lesson-drawer.tsx` line 70, replace `bottom-0` with `bottom-[var(--tc-consent-h,0px)]` and `md:bottom-6` with `md:bottom-[calc(1.5rem+var(--tc-consent-h,0px))]`.

- [ ] **Step 5: Run the unit tests, re-mint the snapshot, typecheck**

Run: `pnpm exec vitest run apps/web/app/components/cookie-consent.test.tsx "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts" apps/web/app/layout.test.tsx apps/web/__tests__/accessibility.test.tsx`
Expected: PASS.

Run: `pnpm exec vitest run apps/web/app/components/cookie-consent.snapshot.test.tsx -u` then `git diff --stat apps/web/app/components/__snapshots__/`
Expected: the snapshot file changes once; open it and confirm the root is the region with `data-testid`, and no `brutalist-shadow` appears.

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Write the e2e proof**

Create `e2e/consent-bar.spec.ts`:

```ts
import { test, expect, type Page } from "@playwright/test";

/*
  The consent bar as a first visitor meets it (spec 2026-09-24, section 1):
  no stored consent, the scene skipped so the Briefing settles at once. The
  bar must be short, the page must reserve its height, and the nav row must
  end above it when the page is scrolled to its end.
*/
const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

async function openBriefing(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("tc-cookie-consent");
    localStorage.setItem("tc-script-skip", "1");
    localStorage.setItem("tc-briefing-variant", "text");
  });
  await page.goto(LESSON, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-script-state='done']")).toBeAttached();
  await expect(page.getByTestId("cookie-consent-card")).toBeVisible();
  // The bar fades up over 0.15 s; measure its resting box.
  await page.getByTestId("cookie-consent-card").evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished));
  });
}

function measure(page: Page) {
  return page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const bar = document
      .querySelector("[data-testid='cookie-consent-card']")!
      .getBoundingClientRect();
    const nav = document
      .querySelector("[data-testid='lesson-nav']")!
      .getBoundingClientRect();
    return {
      barHeight: bar.height,
      barTop: bar.top,
      navBottom: nav.bottom,
      bodyPadding: parseFloat(getComputedStyle(document.body).paddingBottom),
    };
  });
}

for (const [name, viewport, cap] of [
  ["desktop", { width: 1440, height: 900 }, 64],
  ["phone", { width: 390, height: 844 }, 160],
] as const) {
  test.describe(`consent bar, ${name}`, () => {
    test.use({ viewport, colorScheme: "dark" });

    test("is short, reserves its height, and never covers the nav row", async ({
      page,
    }) => {
      await openBriefing(page);
      const m = await measure(page);
      expect(m.barHeight).toBeLessThanOrEqual(cap);
      expect(Math.abs(m.bodyPadding - m.barHeight)).toBeLessThanOrEqual(1);
      expect(m.navBottom).toBeLessThanOrEqual(m.barTop + 1);
    });

    test("releases the space once a choice is made", async ({ page }) => {
      await openBriefing(page);
      await page.getByRole("button", { name: /essential only/i }).click();
      await expect(page.getByTestId("cookie-consent-card")).toHaveCount(0);
      const padding = await page.evaluate(
        () => getComputedStyle(document.body).paddingBottom,
      );
      expect(padding).toBe("0px");
    });
  });
}
```

- [ ] **Step 7: Build and run the spec**

Run the production build command from the table, then:
`source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/consent-bar.spec.ts e2e/legal.spec.ts --project=chromium --reporter=line > /tmp/e2e.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e.log`
Expected: all passed. If the desktop bar exceeds 64 px, the text wrapped to three lines: check the `md:gap-6` and `shrink-0` landed on the button row before touching the copy, which does not change.

- [ ] **Step 8: Checkpoint**

Owner commits. Suggested message: `feat(web): consent bar that reserves its height instead of covering the page`.

---
### Task 2 addendum: fixes from the quality review (applied during execution, 2026-09-25)

The review confirmed the implementation matched this task and found gaps in the task itself. Apply these to the Task 2 files, then rerun Steps 5 and 7.

1. **iOS home indicator.** `layout.tsx` sets `viewportFit: "cover"`, and `py-2` left the consent buttons 8 px from the bottom edge. In `cookie-consent.tsx`, change the inner wrapper's `py-2` to `pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]`. The height is measured, so body padding and every offset follow.
2. **Report issue panel.** Its `bottom` becomes `"max(16px, env(safe-area-inset-bottom), calc(16px + var(--tc-consent-h,0px)))"` with the comment `// With the bar showing, 16 px above it (the bar already clears the home indicator); without it, the old max(16px, inset).` Its `maxHeight` stays as Step 4 wrote it.
3. **Lesson drawer height.** In `lesson-drawer.tsx`, `max-h-[70dvh]` becomes `max-h-[min(70dvh,calc(100dvh_-_1rem_-_var(--tc-consent-h,0px)))]`, so a phone in landscape keeps the sheet's top and its Close control on screen.
4. **Two fixed layers the list missed.** In `apps/web/app/components/mobile-nav.tsx` (the menu dialog near line 77), `fixed inset-0 z-50` becomes `fixed inset-x-0 top-0 bottom-[var(--tc-consent-h,0px)] z-50`. In `packages/ui/src/mdx/glossary-term.tsx`, inside `place()`, before `setPosition`:

```ts
      // The consent bar publishes its height on <html> while it shows
      // (apps/web/app/components/cookie-consent.tsx): keep the popover
      // above it. It reads 0 once a choice is made, and in jsdom.
      const reserved =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tc-consent-h",
          ),
        ) || 0;
```

and the clamp's upper bound becomes `window.innerHeight - height - 16 - reserved`.
5. **The component's comment and export.** Drop `export` from `CONSENT_HEIGHT_PROPERTY`, which nothing imports; a server component importing it from a client module would get a client reference, not the string. Replace the comment above it with:

```ts
/* The bar publishes its height here while it shows. body reads it as
   bottom padding (globals.css), so the end of every page scrolls clear of
   the bar. The fixed layers that would otherwise sit under it (the toasts,
   the Report issue panel, the lesson drawer, the mobile menu and the
   glossary popover) read it too, because body padding moves none of them.
   The bar's own bottom padding clears the iOS home indicator (viewportFit
   is "cover"), and the measured height includes it. */
```

6. **Tests that could not fail.**
   - `cookie-consent.test.tsx`: `/border-t/` becomes `/\bborder-t\b/`. Add `act` to the Testing Library import and this test:

```tsx
  it("re-publishes its height when the bar resizes, and disconnects on a choice", () => {
    let resized: ResizeObserverCallback | undefined;
    const disconnectSpy = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          resized = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {
          disconnectSpy();
        }
      },
    );
    try {
      const root = document.documentElement;
      render(<CookieConsent />);
      const bar = screen.getByTestId("cookie-consent-card");
      vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({
        height: 60,
      } as DOMRect);
      act(() => resized?.([], {} as ResizeObserver));
      expect(root.style.getPropertyValue("--tc-consent-h")).toBe("60px");
      fireEvent.click(screen.getByText(/essential only/i));
      expect(disconnectSpy).toHaveBeenCalled();
      expect(root.style.getPropertyValue("--tc-consent-h")).toBe("");
    } finally {
      vi.unstubAllGlobals();
    }
  });
```

   - `lesson-layout-contract.test.ts`, "consent bar reserved space": anchor the body regex as `/(^|\n)body\s*\{[^}]*padding-bottom:\s*var\(--tc-consent-h,\s*0px\)/`. Add `"apps/web/app/components/mobile-nav.tsx"` to the lifted-files loop, and add:

```ts
  it("the glossary popover keeps clear of the bar", () => {
    expect(read("packages/ui/src/mdx/glossary-term.tsx")).toContain(
      '"--tc-consent-h"',
    );
  });
```

   - `e2e/consent-bar.spec.ts`: in `openBriefing`, after the animation wait, add `await page.evaluate(async () => { await document.fonts.ready; });`. In `measure`, return `footerBottom: document.querySelector("footer")!.getBoundingClientRect().bottom`, and in the first test add `expect(m.footerBottom).toBeLessThanOrEqual(m.barTop + 1);`. The nav row sits above the footer, so its check alone held even without the padding. Append:

```ts
for (const [name, viewport] of [
  ["phone portrait", { width: 390, height: 844 }],
  ["phone landscape", { width: 667, height: 375 }],
] as const) {
  test.describe(`lesson drawer with the consent bar, ${name}`, () => {
    test.use({ viewport, colorScheme: "dark" });

    test("the open sheet sits above the bar and inside the viewport", async ({
      page,
    }) => {
      await openBriefing(page);
      await page.getByRole("button", { name: "Open lesson list" }).click();
      const sheet = page.getByRole("dialog", { name: /lessons$/ });
      await expect(sheet).toBeVisible();
      await sheet.evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((a) => a.finished));
      });
      const box = await sheet.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      const barTop = await page
        .getByTestId("cookie-consent-card")
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(box.bottom).toBeLessThanOrEqual(barTop + 1);
      expect(box.top).toBeGreaterThanOrEqual(0);
    });
  });
}
```

7. **Verify.** Run Step 5's unit command plus `packages/ui/src/mdx/glossary-term.test.tsx`, re-mint the consent snapshot with `-u` (the wrapper class changed), run `pnpm typecheck` and `pnpm lint`, rebuild, and run Step 7's Playwright command. Then grep the built CSS under `apps/web/.next/static` for the new `max-height` rule and the `padding-bottom:max(` rule, and quote both.
8. **From the re-review.** Run `pnpm exec prettier --write e2e/consent-bar.spec.ts` (CI runs `pnpm format:check`, and the new `footerBottom` line broke it). In `lesson-drawer.tsx`, add `md:max-h-[min(70dvh,calc(100dvh_-_2.5rem_-_var(--tc-consent-h,0px)))]` after the phone cap: from `md` the sheet floats 1.5rem up, so its cap must reserve 2.5rem. In the `cookie-consent.tsx` comment, "The fixed layers that would otherwise sit under it" becomes "The fixed layers that share its bottom edge". In `apps/web/app/components/mobile-nav.test.tsx`, the docblock's "The overlay is `fixed inset-0`" becomes "The overlay is fixed to the viewport and ends at the consent bar's top edge while the bar shows".

### Task 3: Step labels and the Epilogue rename (spec section 5)

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx:262-270` (names), `:677` (analytics), `:1367-1400` (the segment buttons)
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx`, `e2e/channel-experiment.spec.ts:114`, `e2e/editor-drafts.spec.ts:109`, `e2e/learning-routes.spec.ts:102`, `e2e/normalization-experiment.spec.ts:57`

- [ ] **Step 1: Write the failing unit tests**

In `lesson-steps.test.tsx`, change the group name in the test "leaves no bottom padding under the Consequence step's last block" (line 554) from `"Step 6 of 6: Consequence"` to `"Step 6 of 6: Epilogue"`. Then add, inside the describe that holds "shows the lesson title in the chrome on every step but the Briefing":

```tsx
  it("labels every segment with its step name and names the last step Epilogue", () => {
    renderSteps();
    const labels = screen.getAllByTestId("step-label");
    expect(labels.map((l) => l.textContent)).toEqual([
      "Briefing",
      "Concept",
      "Code",
      "Challenge",
      "Takeaways",
      "Epilogue",
    ]);
    // Hidden below lg, shown from it: the class pair is the contract, jsdom
    // applies no breakpoints.
    for (const label of labels) {
      expect(label).toHaveClass("hidden", "lg:block", "truncate");
    }
    // The visible label is part of the accessible name (WCAG 2.5.3).
    expect(
      screen.getByRole("button", { name: "Step 6: Epilogue" }),
    ).toBeDisabled();
    expect(screen.queryByText("6 / 6")).toBeNull();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("keeps the analytics step name for the last step", () => {
    localStorage.setItem(STEP_KEY, "5");
    localStorage.setItem(MAX_KEY, "5");
    renderSteps();
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      "lesson_step_viewed",
      expect.objectContaining({ step: 5, stepName: "Consequence" }),
    );
  });
```

Add `track` to the analytics import at the top of the file: `import { trackLessonCompleted, track } from "@/lib/analytics";` (the mock factory already exports `track`).

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx" -t "Epilogue|analytics step name|bottom padding"`
Expected: FAIL: no `step-label` test ids, "Step 6: Epilogue" not found, the padding test's group name not found; the analytics test passes already (it pins today's value and must keep passing).

- [ ] **Step 3: Rename the last step and split the analytics names**

In `lesson-steps.tsx`, replace lines 262 to 270:

```ts
/* Learner-facing step names: the bar's labels, the badge and every
   accessible name. The last step is the story's epilogue on screen; the
   pedagogy's name for it, "Consequence", stays in the analytics array below
   so PostHog queries and scripts/analytics/module1-baseline.mjs keep
   reading the same stepName. */
const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Code",
  "Challenge",
  "Takeaways",
  "Epilogue",
] as const;
const STEP_EVENT_NAMES = [
  "Briefing",
  "Concept",
  "Code",
  "Challenge",
  "Takeaways",
  "Consequence",
] as const;
```

At line 677 change `stepName: STEP_NAMES[currentStep],` to `stepName: STEP_EVENT_NAMES[currentStep],`. Confirm with `grep -n "STEP_NAMES\[" ...lesson-steps.tsx` that the remaining uses are the group aria-label, the bar's map and the badge only.

- [ ] **Step 4: Put the label under each segment**

Replace the segment button (the `STEP_NAMES.map` block in `ChromeBar`) with:

```tsx
          {STEP_NAMES.map((name, i) => {
            const visited = i <= maxStepReached;
            const filled = i <= currentStep;
            const current = i === currentStep;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentStep(i)}
                disabled={!visited}
                aria-label={`Step ${i + 1}: ${name}`}
                aria-current={current ? "step" : undefined}
                title={visited ? name : `${name} (locked)`}
                // h-6 (24px), not h-4: these are documented navigation
                // affordances, so they must meet the WCAG 2.5.8 AA minimum
                // target of 24x24. The visible bar stays 6px. From lg the
                // step name sits under the bar and the button grows to h-8;
                // min-w-0 lets `truncate` on the label act on a flex-1 item.
                className="flex-1 min-w-0 h-6 lg:h-8 flex flex-col justify-center gap-1 p-0 border-0 bg-transparent transition-opacity hover:opacity-80 disabled:hover:opacity-100"
                style={{ cursor: visited ? "pointer" : "not-allowed" }}
              >
                <span
                  className="h-1.5 w-full transition-all duration-300"
                  style={{
                    background: filled
                      ? "var(--tc-primary)"
                      : "var(--tc-border)",
                    opacity: !visited ? 0.45 : 1,
                    borderRadius: 2,
                  }}
                />
                <span
                  data-testid="step-label"
                  className="hidden lg:block text-[11px] font-mono uppercase tracking-wider truncate text-left"
                  style={{
                    color: current ? "var(--tc-primary)" : "var(--tc-muted)",
                    opacity: !visited ? 0.45 : 1,
                  }}
                >
                  {name}
                </span>
              </button>
            );
          })}
```

- [ ] **Step 5: Rename the four e2e pins**

In `e2e/channel-experiment.spec.ts:114`, `e2e/editor-drafts.spec.ts:109`, `e2e/learning-routes.spec.ts:102` and `e2e/normalization-experiment.spec.ts:57`, change `"Step 6: Consequence"` to `"Step 6: Epilogue"`. Then `grep -rn "Consequence" e2e/ apps/web --include='*.spec.ts' --include='*.test.tsx' | grep -v -E "^\S+:\s*//|describe|it\("` and confirm no other accessible-name pin remains (test titles may keep the word).

Then add the page-level proof the spec asks for. In `e2e/lesson-layout.spec.ts`, inside the desktop describe:

```ts
  test("six step labels sit under their segments, the current one in the accent colour", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const m = await page.evaluate(() => {
      // Continue is filled with the accent colour on the Briefing, so its
      // background is the token's computed value.
      const accent = getComputedStyle(
        document.querySelector("[data-step-continue]")!,
      ).backgroundColor;
      return Array.from(
        document.querySelectorAll<HTMLButtonElement>("button[aria-label^='Step ']"),
      ).map((b) => {
        const label = b.querySelector<HTMLElement>("[data-testid='step-label']")!;
        const bb = b.getBoundingClientRect();
        const lb = label.getBoundingClientRect();
        return {
          text: label.textContent,
          visible: lb.width > 0 && lb.height > 0,
          inside:
            lb.left >= bb.left - 1 &&
            lb.right <= bb.right + 1 &&
            lb.top >= bb.top - 1 &&
            lb.bottom <= bb.bottom + 1,
          hit: bb.height,
          current: b.getAttribute("aria-current") === "step",
          accent: getComputedStyle(label).color === accent,
        };
      });
    });
    expect(m.map((s) => s.text)).toEqual([
      "Briefing",
      "Concept",
      "Code",
      "Challenge",
      "Takeaways",
      "Epilogue",
    ]);
    for (const s of m) {
      expect(s.visible).toBe(true);
      expect(s.inside).toBe(true);
      expect(s.hit).toBeGreaterThanOrEqual(24);
      expect(s.accent).toBe(s.current);
    }
  });
```

and inside the phone describe:

```ts
  test("no step label shows on a phone and every segment keeps a 24 px hit box", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const m = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>("button[aria-label^='Step ']"),
      ).map((b) => {
        const label = b.querySelector<HTMLElement>("[data-testid='step-label']");
        return {
          hidden: !label || label.getClientRects().length === 0,
          hit: b.getBoundingClientRect().height,
        };
      }),
    );
    expect(m).toHaveLength(6);
    for (const s of m) {
      expect(s.hidden).toBe(true);
      expect(s.hit).toBeGreaterThanOrEqual(24);
    }
  });
```

These run at Task 5's checkpoint with the rest of the layout spec.

- [ ] **Step 6: Run the unit suite for the lesson directory and typecheck**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]"` then `pnpm typecheck`
Expected: PASS; no errors.

- [ ] **Step 7: Checkpoint**

Owner commits. Suggested message: `feat(lesson): label the step bar; the last step reads Epilogue on screen`. The four e2e specs run at Task 5's checkpoint with the rest.

---

### Task 3 addendum: fixes from the quality review (applied during execution, 2026-09-25)

The review confirmed the implementation matched this task. It found that the button's `hover:opacity-80` now dims the label too, which takes it below AA in the light scheme (current 3.91:1, visited 4.22:1). It also found four test gaps. Apply these, then rerun Step 6 and the Prettier check.

1. **Hover dims the bar only.** In `ChromeBar`'s segment map, the button's class string becomes `"group flex-1 min-w-0 h-6 lg:h-8 flex flex-col justify-center gap-1 p-0 border-0 bg-transparent"` (no `transition-opacity`, no `hover:opacity-80`, no `disabled:hover:opacity-100`). Add this line to the end of the comment above it: `// Hover dims the bar only: dimming the whole button took the label below AA.` The locked dimming moves from inline styles to whole class strings, because an inline opacity beats any class. The bar span becomes:

```tsx
                <span
                  className={
                    visited
                      ? "h-1.5 w-full transition-all duration-300 group-hover:opacity-80"
                      : "h-1.5 w-full transition-all duration-300 opacity-45"
                  }
                  style={{
                    background: filled
                      ? "var(--tc-primary)"
                      : "var(--tc-border)",
                    borderRadius: 2,
                  }}
                />
```

and the label span:

```tsx
                <span
                  data-testid="step-label"
                  className={
                    visited
                      ? "hidden lg:block text-[11px] font-mono uppercase tracking-wider truncate text-left"
                      : "hidden lg:block text-[11px] font-mono uppercase tracking-wider truncate text-left opacity-45"
                  }
                  style={{
                    color: current ? "var(--tc-primary)" : "var(--tc-muted)",
                  }}
                >
                  {name}
                </span>
```

2. **Unit test hardening** in `lesson-steps.test.tsx`:
   - In "labels every segment...", inside the loop over `labels`, add `expect(label.parentElement).toHaveClass("group", "min-w-0", "h-6", "lg:h-8");` and `expect(label.className).not.toMatch(/hover:/);`. After the loop add `expect(labels[0].previousElementSibling).toHaveClass("group-hover:opacity-80");`, since the first step is visited on arrival.
   - In "keeps the analytics step name for the last step", add `vi.mocked(track).mockClear();` as its first line, so earlier tests' calls cannot satisfy it. After `renderSteps();` add `expect(screen.getByText("6 / 6").parentElement).toHaveTextContent("6 / 6 · Epilogue");`.
3. **No clipped label at the narrowest desktop width.** In `e2e/lesson-layout.spec.ts`, inside the existing "lesson layout, narrow desktop" describe (confirm its viewport is 1,024 wide), add:

```ts
  test("no step label is clipped at the narrowest desktop width", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 0);
    const clipped = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-testid='step-label']"),
      )
        .filter((label) => label.scrollWidth > label.clientWidth)
        .map((label) => label.textContent),
    );
    expect(clipped).toEqual([]);
  });
```

4. **Docs.** In `docs/architecture.md`, in the `lesson-steps.tsx` row of the lesson page table, change "renders segmented step bar (visited steps clickable for direct jumps;" to "renders segmented step bar (each segment labelled with its step name from `lg`, the sixth reading "Epilogue" while `lesson_step_viewed` keeps "Consequence"; visited steps clickable for direct jumps;".

### Task 4: The Complete step (spec section 6)

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` (`ChromeBar` `showTitle` near line 1307; `bottomNav` next-lesson branch near lines 1059-1068; `StepConsequence` lines 2147-2154, 2209-2214 and 2239-2265)
- Test: `lesson-steps.test.tsx`, `e2e/lesson-layout.spec.ts:610-631`

- [ ] **Step 1: Write the failing unit tests**

In `lesson-steps.test.tsx`, rename the test "shows the lesson title in the chrome on every step but the Briefing" to "shows the lesson title in the chrome on every step but the Briefing and the Epilogue" and append to its body:

```tsx
    // A second mount in the same test: unmount the first, and clear the
    // #step-2 hash its Continue pushed. jsdom keeps the location, and a
    // leftover hash reads as a deep link that wins over the stored step.
    cleanup();
    window.history.replaceState(null, "", window.location.pathname);
    localStorage.setItem(STEP_KEY, "5");
    localStorage.setItem(MAX_KEY, "5");
    renderSteps();
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(
      document.querySelector("[data-testid='lesson-chrome'] h1"),
    ).toBeNull();
```

Import `cleanup` from `@testing-library/react` at the top. Then add a new test in the same describe:

```tsx
  it("puts one next-mission control in the nav row on the last step and no card in the body", () => {
    localStorage.setItem(STEP_KEY, "5");
    localStorage.setItem(MAX_KEY, "5");
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={{ slug: "tensor-shapes", title: "Understanding Tensor Shapes" }}
      />,
    );
    const nav = screen.getByTestId("lesson-nav");
    const control = screen.getByTestId("next-lesson-card");
    expect(nav.contains(control)).toBe(true);
    expect(control).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/tensor-shapes",
    );
    expect(control).toHaveTextContent("Next Mission");
    expect(control).toHaveTextContent("Understanding Tensor Shapes");
    expect(screen.queryByRole("link", { name: /^Next Lesson/ })).toBeNull();
    // The closing card is the step's one H1.
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(lesson.title);
    // The fade-out marker is atmosphere for sighted readers only: hidden
    // from the tree, no longer exempt from the contrast rule.
    const fade = screen.getByText(/fade out/i);
    expect(fade).toHaveAttribute("aria-hidden", "true");
    expect(fade).not.toHaveAttribute("data-decorative");
  });
```

The `terms()` helper maps Deep Orbit's lesson term to "Mission", which is why the control reads "Next Mission"; the test renders with `worldSlug="deep-orbit"` for that reason.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx" -t "Epilogue|next-mission"`
Expected: FAIL: the chrome still renders an h1 on step 6; the next-lesson card is outside the nav; `Next Lesson` link exists; two H1s.

- [ ] **Step 3: Hide the chrome title on the last step**

In `ChromeBar`, change `const showTitle = currentStep !== 0;` to:

```ts
  // The Briefing's title card is that step's H1 and the Complete step's
  // closing card is that step's (spec 2026-09-24, section 6); on steps 2
  // to 5 the chrome title is the page's only H1 and stays.
  const showTitle = currentStep !== 0 && currentStep !== TOTAL_STEPS - 1;
```

- [ ] **Step 4: One forward control in the nav row**

In `bottomNav`, replace the `nextLesson` branch (the `Link` whose text is `Next Lesson &rarr;`) with:

```tsx
      ) : nextLesson ? (
        <Link
          href={`/worlds/${worldSlug}/${moduleSlug}/${nextLesson.slug}`}
          data-testid="next-lesson-card"
          className="inline-flex min-h-11 items-center gap-4 px-6 py-3 text-left transition-opacity hover:opacity-90"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
          }}
        >
          <span className="flex-1">
            <span className="block text-[9px] font-mono uppercase tracking-[1.5px] mb-0.5">
              Next {terms(worldSlug).lesson}
            </span>
            <span className="block text-[15px] font-semibold">
              {nextLesson.title}
            </span>
          </span>
          <span aria-hidden="true" className="text-base shrink-0">
            &rarr;
          </span>
        </Link>
      ) : (
```

The Map fallback branch after it is unchanged.

- [ ] **Step 5: The closing card is the H1; the body card and the exemption go**

In `StepConsequence`:

1. Replace the "Fade Out" block (the `div` with `data-decorative="true"`, lines 2147 to 2154) with:

```tsx
      {/* FADE OUT marker. Screenplay atmosphere, hidden from the tree, and
          now readable by sighted readers: the Cut to label's colour, one
          size up. No contrast exemption. */}
      <div
        aria-hidden="true"
        className="font-mono text-[10px] uppercase tracking-[3px] mb-8"
        style={{ color: "var(--tc-muted)" }}
      >
        Fade Out
      </div>
```

2. Change the centred title's tag from `h2` to `h1` (both the opening and closing tags), keeping its classes and style.

3. Delete the next-lesson card block: from the comment `{/* Next lesson card */}` through the closing `)}` of `{nextLesson && (...)}`.

- [ ] **Step 6: Replace the e2e geometry test**

In `e2e/lesson-layout.spec.ts`, replace the test "the nav sits 40 px below the Complete step's next-lesson card" (lines 610 to 631) with:

```ts
  test("the Complete step's forward control sits in the nav row at the frame's right edge", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 5);
    const m = await page.evaluate(() => {
      const one = (s: string) => {
        const found = document.querySelectorAll(s);
        if (found.length !== 1)
          throw new Error(`${s}: ${found.length} matches`);
        return found[0];
      };
      const nav = one("[data-testid='lesson-nav']").getBoundingClientRect();
      const control = one("[data-testid='next-lesson-card']");
      const box = control.getBoundingClientRect();
      const frame = one("[data-testid='lesson-frame']").getBoundingClientRect();
      const frameRight =
        frame.right -
        parseFloat(getComputedStyle(one("[data-testid='lesson-frame']")).paddingRight);
      const nextLessonLinks = document.querySelectorAll(
        "a[href$='/tensor-shapes']",
      ).length;
      return {
        inside: box.top >= nav.top && box.bottom <= nav.bottom,
        right: box.right,
        frameRight,
        text: control.textContent ?? "",
        nextLessonLinks,
      };
    });
    expect(m.inside).toBe(true);
    expect(Math.abs(m.right - m.frameRight)).toBeLessThanOrEqual(1);
    expect(m.text).toMatch(/Next Mission/i);
    // One control for one action: no body card links to the next lesson.
    expect(m.nextLessonLinks).toBe(1);
  });
```

- [ ] **Step 7: Run the unit suite for the lesson directory and typecheck**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]"` then `pnpm typecheck`
Expected: PASS; no errors. The "keeps one H1, the lesson title, on every step" test passes unchanged because the centred h1 carries the title.

- [ ] **Step 8: Checkpoint**

Owner commits. Suggested message: `feat(lesson): one closing title and one next-mission control on the Complete step`.

---
### Task 4 addendum: applied during execution (2026-09-25)

1. **Drop the prop the card was the only user of.** Removing the body's next-lesson card leaves `StepConsequence`'s `nextLesson` prop unused, and ESLint warns. Remove `nextLesson` from `StepConsequence`'s destructured props and from its props type, and remove `nextLesson={nextLesson}` from the `<StepConsequence ... />` call in `LessonStepsInner`. The nav row's control reads `nextLesson` from `LessonStepsInner`'s own props, which are unchanged.
2. **The old comment above `showTitle` goes.** It said every step but the Briefing shows the chrome title, which Step 3 makes false. The new comment replaces it; the two must not stack.

3. **From the quality review.**
   - **Phones:** at 390 px the control often wraps onto its own row, and `justify-between` sends a lone item to the start. Add `ml-auto` to the next-mission Link's className so a wrapped control stays flush right; desktop is unchanged.
   - **Name:** at the end of the eyebrow span, add `<span className="sr-only">: </span>`, so the name reads "Next Mission: Understanding Tensor Shapes".
   - **Stale comments:** in `e2e/accessibility.spec.ts`, the comment near line 30 that calls the epilogue's FADE OUT slug the only `data-decorative` element should say instead that the remaining `data-decorative` elements are on the landing page and the module map. In `lesson-steps.test.tsx`, the comment in "keeps one H1, the lesson title, on every step" should say the chrome title is the H1 on steps 2 to 5, and the closing card on step 6.
   - **Unit test:** in the renamed chrome-title test, after its second mount (which passes `nextLesson={null}`), add `expect(screen.queryByTestId("next-lesson-card")).toBeNull();` and `expect(screen.getByRole("link", { name: /Back to Mission Map/ })).toBeInTheDocument();`.
   - **Forward-control test:** in `e2e/lesson-layout.spec.ts`, count only rendered links to the control's own address. Replace the `nextLessonLinks` line with `const href = control.getAttribute("href"); const nextLessonLinks = Array.from(document.querySelectorAll("a")).filter((a) => a.getAttribute("href") === href && a.getClientRects().length > 0).length;`.
   - **New phone test:** in the phone describe, add a test that opens step 6 of `LESSONS.paragraphLed` and asserts the control's right edge is within 1 px of the frame's content right edge, with the same measurement as the desktop test.

### Task 5: Takeaways, the recall before the recap (spec section 2)

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` (imports line 3; props after `onHintRevealed` near line 104; the body of `LessonContent` after `handleHintRevealed`; the `RecallPrompt` binding near line 481; a new module-level component)
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` (sets lines 175-176 and 238-243, `STEP_VISIBILITY`; a key helper after `getMaxStorageKey`; state in `LessonStepsInner`; the restore effect; the `StepTakeaways` render site near line 1197; `StepTakeaways` itself lines 2082-2116)
- Test: `lesson-content.test.tsx`, `lesson-steps.test.tsx`, `e2e/lesson-layout.spec.ts`, `e2e/end-of-lesson.spec.ts`, `e2e/worlds.spec.ts`

- [ ] **Step 1: Write the failing content test**

In `lesson-content.test.tsx`, change the `RecallPrompt` stub in the `@/app/components/mdx` mock from `RecallPrompt: () => null,` to:

```tsx
  RecallPrompt: ({
    question,
    onAnswer,
  }: {
    question: string;
    onAnswer?: (result: "attempted" | "bailed") => void;
  }) => (
    <button type="button" onClick={() => onAnswer?.("attempted")}>
      Reveal {question}
    </button>
  ),
```

Add a body after `COMPILED_BODY`:

```ts
// Two recall cards, as 24 of the 56 lessons carry (spec 2026-09-24, section 2).
const RECALL_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const RecallPrompt = _components.RecallPrompt;
  return jsxs(Fragment, {children: [
    jsx(RecallPrompt, {question: "one", answer: "a"}),
    jsx(RecallPrompt, {question: "two", answer: "b"})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;
```

And a describe at the end of the file:

```tsx
describe("LessonContent, recall cards pending (spec 2026-09-24, section 2)", () => {
  it("reports the unsettled card count after mount and after each first answer", () => {
    const report = vi.fn();
    render(
      <LessonContent
        lesson={{ body: RECALL_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["RecallPrompt"])}
        onRecallPending={report}
      />,
    );
    expect(report).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Reveal one" }));
    expect(report).toHaveBeenLastCalledWith(1);
    // A second answer from the same card (the rating) changes nothing.
    fireEvent.click(screen.getByRole("button", { name: "Reveal one" }));
    expect(report).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Reveal two" }));
    expect(report).toHaveBeenLastCalledWith(0);
  });

  it("reports zero once for a body with no card", () => {
    const report = vi.fn();
    render(
      <LessonContent
        lesson={{ body: LESSON_RECAP_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["RecallPrompt"])}
        onRecallPending={report}
      />,
    );
    expect(report).toHaveBeenCalledWith(0);
    expect(report.mock.calls.every(([n]) => n === 0)).toBe(true);
  });
});
```

Add `fireEvent` to the `@testing-library/react` import at the top.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx" -t "recall cards pending"`
Expected: FAIL: `report` is never called.

- [ ] **Step 3: The registrar in the content renderer**

In `lesson-content.tsx`:

1. Change line 3 to `import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef } from "react";`.

2. After the `onHintRevealed` prop in `LessonContentProps` add:

```ts
  /**
   * How many recall cards in this instance are still in their prompt state
   * (spec 2026-09-24, section 2). Reported once after the first commit,
   * so a body with no card reports 0, and again each time a card leaves
   * its prompt. Read through a ref inside the renderer: it must never join
   * the components memo's dependencies, which would remount the MDX tree
   * and snap every revealed card back to its prompt.
   */
  onRecallPending?: (pending: number) => void;
```

3. Add `onRecallPending,` to the destructured props of `LessonContent`, after `onHintRevealed,`.

4. After the `handleHintRevealed` callback, add:

```tsx
  // Recall cards register here (RegisteredRecallPrompt below). Both the set
  // and the latest callback live in refs so the components memo keeps its
  // dependency list and the MDX tree is never remounted by a report.
  const onRecallPendingRef = useRef(onRecallPending);
  useEffect(() => {
    onRecallPendingRef.current = onRecallPending;
  });
  const pendingRecallRef = useRef<Set<string>>(new Set());
  const reportRecallPending = useCallback(() => {
    onRecallPendingRef.current?.(pendingRecallRef.current.size);
  }, []);
  // Children's effects run before this one, so on the first commit the
  // cards have registered and this reports their count; with no card it
  // reports 0, which is what lets the step settle.
  useEffect(() => {
    reportRecallPending();
  }, [reportRecallPending]);
```

5. Replace the `RecallPrompt` binding with:

```tsx
      RecallPrompt: (props: React.ComponentProps<typeof RecallPrompt>) =>
        shouldShow("RecallPrompt") ? (
          <RegisteredRecallPrompt
            {...props}
            registry={pendingRecallRef}
            report={reportRecallPending}
            onAnswer={(result) => {
              trackRecallAnswered(result, { worldId, lessonId });
              props.onAnswer?.(result);
            }}
          />
        ) : null,
```

and add `reportRecallPending,` to the memo's dependency array (it is stable; the linter wants it listed).

6. Add at module level, after `LessonContent`:

```tsx
/* A recall card that reports its prompt state to the instance. Registered
   on mount; settled on the card's first onAnswer (attempted or bailed; the
   later rating call changes nothing). The unmount cleanup deletes without
   reporting: the whole instance unmounts on every step change, and a
   report of 0 then would read as "settled". */
function RegisteredRecallPrompt({
  registry,
  report,
  onAnswer,
  ...props
}: React.ComponentProps<typeof RecallPrompt> & {
  registry: React.MutableRefObject<Set<string>>;
  report: () => void;
}) {
  const id = useId();
  const settledRef = useRef(false);
  useEffect(() => {
    registry.current.add(id);
    report();
    return () => {
      registry.current.delete(id);
    };
  }, [id, registry, report]);
  return (
    <RecallPrompt
      {...props}
      onAnswer={(result) => {
        if (!settledRef.current) {
          settledRef.current = true;
          registry.current.delete(id);
          report();
        }
        onAnswer?.(result);
      }}
    />
  );
}
```

- [ ] **Step 4: Run the content test**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx"`
Expected: PASS, the whole file.

- [ ] **Step 5: Write the failing step tests**

In `lesson-steps.test.tsx`:

1. Before the `vi.mock("./lesson-content", ...)` call add:

```tsx
// What the stubbed content reports as its unsettled recall count on mount,
// and the last report handler it received, so a test can settle it later.
const recallState = vi.hoisted(() => ({
  pendingOnMount: 0,
  report: null as null | ((pending: number) => void),
}));
```

2. Replace that mock with an async factory that keeps the stub's markup and adds the report:

```tsx
vi.mock("./lesson-content", async () => {
  const React = await import("react");
  return {
    LessonContent: ({
      storyRegister,
      hideTeaching,
      hideStoryZone,
      visibleComponents,
      layout,
      onRecallPending,
    }: {
      storyRegister?: boolean;
      hideTeaching?: boolean;
      hideStoryZone?: boolean;
      visibleComponents?: Set<string>;
      layout?: "paired";
      onRecallPending?: (pending: number) => void;
    }) => {
      React.useEffect(() => {
        if (!onRecallPending) return;
        recallState.report = onRecallPending;
        onRecallPending(recallState.pendingOnMount);
      }, [onRecallPending]);
      return (
        <div
          data-testid="lesson-content"
          className="lesson-prose lesson-step-content"
          data-layout={layout}
          data-story-register={storyRegister ? "true" : undefined}
          data-hide-teaching={hideTeaching ? "true" : undefined}
          data-hide-story-zone={hideStoryZone ? "true" : undefined}
          data-visible={
            visibleComponents
              ? Array.from(visibleComponents).sort().join(",")
              : ""
          }
        />
      );
    },
  };
});
```

3. In the top-level `beforeEach`, add `recallState.pendingOnMount = 0; recallState.report = null;`.

4. Add a describe at the end of the file:

```tsx
describe("Takeaways: the recap after the recall (spec 2026-09-24, section 2)", () => {
  const RECALL_KEY = "tc_recall_deep-orbit_introduction-to-tensors";
  const withTerms = {
    ...lesson,
    glossaryTerms: [{ term: "tensor", definition: "a numeric array with a shape" }],
  };
  function openTakeaways(
    extra: Partial<React.ComponentProps<typeof LessonSteps>> = {},
    owner: string | null = null,
  ) {
    // A signed-in reader restores from the account-suffixed keys (see the
    // account-owned position tests at the top of this file).
    const suffix = owner ? `:account:${owner}` : "";
    localStorage.setItem(`${STEP_KEY}${suffix}`, "4");
    localStorage.setItem(`${MAX_KEY}${suffix}`, "4");
    render(
      <LessonSteps
        lesson={withTerms}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={null}
        {...extra}
      />,
    );
    expect(screen.getByText("5 / 6")).toBeInTheDocument();
  }

  it("holds the recap and the terms list until the recall settles, then remembers it", () => {
    recallState.pendingOnMount = 1;
    openTakeaways();
    expect(screen.getByTestId("takeaways-recall")).toBeInTheDocument();
    expect(screen.queryByTestId("takeaways-prose")).toBeNull();
    expect(screen.queryByTestId("lesson-terms-list")).toBeNull();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
    act(() => recallState.report?.(0));
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBe("1");
    // Sticky for the mount: a later non-zero report never hides it again.
    act(() => recallState.report?.(1));
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
  });

  it("shows everything at once when this browser remembers the recall", () => {
    recallState.pendingOnMount = 1;
    localStorage.setItem(RECALL_KEY, "1");
    openTakeaways();
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
  });

  it("shows everything at once when the server knows the lesson is complete", () => {
    recallState.pendingOnMount = 1;
    openTakeaways({
      lessons: [
        { slug: lesson.slug, title: lesson.title, order: 1, locked: false, completed: true },
      ],
    });
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });

  it("writes no flag when the body has no card", () => {
    openTakeaways();
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });

  it("keys the flag to the account like the step keys", () => {
    recallState.pendingOnMount = 1;
    openTakeaways({ reviewUserId: "alice" }, "alice");
    act(() => recallState.report?.(0));
    expect(localStorage.getItem(`${RECALL_KEY}:account:alice`)).toBe("1");
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });
});
```

- [ ] **Step 6: Run to verify they fail**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx" -t "recap after the recall"`
Expected: FAIL: `takeaways-recall` is absent and `takeaways-prose` renders at once.

- [ ] **Step 7: Split the set and gate the step**

In `lesson-steps.tsx`:

1. Replace the `TAKEAWAYS_COMPONENTS` block (lines 236 to 243) with:

```ts
// Takeaways: the recall card first, alone; the lesson close (LessonRecap,
// ProjectMilestone, NextLesson) once every card has left its prompt, so
// the answer is never on screen while the learner is asked for it (spec
// 2026-09-24, section 2). Then the terms list, an app component.
const TAKEAWAYS_RECALL = new Set(["RecallPrompt"]);
const TAKEAWAYS_AFTER = new Set([
  "ProjectMilestone",
  "LessonRecap",
  "NextLesson",
]);
```

In the comment above the sets (lines 175 to 176) change `RecallPrompt only in TAKEAWAYS_COMPONENTS` to `RecallPrompt only in TAKEAWAYS_RECALL`. In `STEP_VISIBILITY`, replace `TAKEAWAYS_COMPONENTS,` with `TAKEAWAYS_RECALL,` and `TAKEAWAYS_AFTER,`.

2. After `getMaxStorageKey` add:

```ts
/* "This browser has settled the lesson's recall" (spec 2026-09-24, section
   2): the same shape as the step keys, so a guest's flag never reads as an
   account's. The answer itself is never stored. */
function getRecallStorageKey(
  worldSlug: string,
  lessonSlug: string,
  owner: string | null,
): string {
  const key = `tc_recall_${worldSlug}_${lessonSlug}`;
  return owner ? `${key}:account:${owner}` : key;
}
```

3. In `LessonStepsInner`, after the `maxStorageKey` line, add:

```tsx
  const recallKey = getRecallStorageKey(worldSlug, lesson.slug, reviewUserId);
  // True once every recall card on Takeaways has left its prompt in this
  // mount, or this browser remembers doing so. Sticky: the left column is
  // keyed on the step, so StepTakeaways remounts on every visit and its
  // instance reports afresh; a later non-zero report must not hide the
  // recap that already showed.
  const [recallSettled, setRecallSettled] = useState(false);
  const recallEverPendingRef = useRef(false);
  const handleRecallPending = useCallback(
    (pending: number) => {
      if (pending > 0) {
        recallEverPendingRef.current = true;
        return;
      }
      setRecallSettled(true);
      // A body with no card reports 0 without ever being pending: nothing
      // to remember. A learner who settled a card is remembered.
      if (!recallEverPendingRef.current) return;
      try {
        localStorage.setItem(recallKey, "1");
      } catch {
        // localStorage unavailable
      }
    },
    [recallKey],
  );
```

4. In the mount-restore effect, inside its first `try` block after the `savedPassed` handling, add:

```ts
      if (localStorage.getItem(recallKey) === "1") setRecallSettled(true);
```

and change the effect's dependency array to `[storageKey, maxStorageKey, recallKey]`.

5. At the `StepTakeaways` render site (`shellLeft = <StepTakeaways {...sharedContentProps} />;`) pass the two props:

```tsx
    shellLeft = (
      <StepTakeaways
        {...sharedContentProps}
        recallSettled={recallSettled || knownCompleted}
        onRecallPending={handleRecallPending}
      />
    );
```

6. Replace `StepTakeaways` with:

```tsx
function StepTakeaways({
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  lessonSlug,
  recallSettled,
  onRecallPending,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  /** Every recall card has left its prompt, or the browser or server says so. */
  recallSettled: boolean;
  onRecallPending: (pending: number) => void;
}) {
  const shared = {
    lesson,
    exercises,
    worldId: worldSlug,
    moduleId: moduleSlug,
    lessonId: lessonSlug,
    glossaryTerms: lesson.glossaryTerms,
  };
  return (
    <div>
      {/* The existing <PhaseChip label="Takeaways" icon={...} /> line stays
          here exactly as it is today; edit around it. */}
      {/* The recall first, alone (spec 2026-09-24, section 2). */}
      <div className="lesson-prose max-w-[820px]" data-testid="takeaways-recall">
        <LessonContent
          {...shared}
          visibleComponents={TAKEAWAYS_RECALL}
          onRecallPending={onRecallPending}
        />
      </div>
      {recallSettled && (
        <>
          <div
            className="lesson-prose max-w-[820px]"
            data-testid="takeaways-prose"
          >
            <LessonContent {...shared} visibleComponents={TAKEAWAYS_AFTER} />
          </div>
          <LessonTermsList terms={lesson.glossaryTerms ?? []} />
        </>
      )}
    </div>
  );
}
```

Leave the `PhaseChip` line as it is: replace the function's signature, the two `LessonContent` calls and the terms list around it, and never retype the icon argument (the check mark is a harmless glyph either way; the escape warning in this plan's header is load-bearing only for the em dash).

- [ ] **Step 8: Run the lesson directory's unit tests and typecheck**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]"` then `pnpm typecheck`
Expected: PASS, including `content-partition-contract.test.ts` (it unions every set) and the older "caps the Takeaways prose" test (the stub reports 0 on mount); no errors.

- [ ] **Step 9: Update the three e2e specs the gate changes, and add the proof**

1. `e2e/lesson-layout.spec.ts`, `openStep` case 4: replace `await expect(page.getByTestId("takeaways-prose")).toBeVisible();` with `await expect(page.getByTestId("takeaways-recall")).toBeVisible();`.

2. In the same file's desktop describe (after the step-6 forward-control test from Task 4), add:

```ts
  test("the recap and the terms list follow the recall card once it settles", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 4);
    await expect(page.getByTestId("takeaways-prose")).toHaveCount(0);
    await expect(page.getByTestId("lesson-terms-list")).toHaveCount(0);
    await page.getByRole("button", { name: /recall it/i }).first().click();
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        recallBottom: box("[data-testid='takeaways-recall']").bottom,
        proseTop: box("[data-testid='takeaways-prose']").top,
        proseBottom: box("[data-testid='takeaways-prose']").bottom,
        termsTop: box("[data-testid='lesson-terms-list']").top,
      };
    });
    expect(m.proseTop).toBeGreaterThanOrEqual(m.recallBottom);
    expect(m.termsTop).toBeGreaterThanOrEqual(m.proseBottom);
  });

  test("a browser that remembers the recall sees the recap at once", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tc_recall_deep-orbit_introduction-to-tensors", "1");
    });
    await openStep(page, LESSONS.paragraphLed, 4);
    await expect(page.getByTestId("takeaways-prose")).toBeVisible();
    await expect(page.getByTestId("lesson-terms-list")).toBeVisible();
    // The card is back in its prompt state, for practice.
    await expect(
      page.getByRole("button", { name: /recall it/i }).first(),
    ).toBeVisible();
  });
```

3. `e2e/end-of-lesson.spec.ts`: rename the first test to "Takeaways step shows the recall, then the recap after the reveal". Replace the block from `// Both close blocks render on the Takeaways step.` through `expect(recallBox!.y).toBeLessThan(recapBox!.y);` with:

```ts
    // The recall card renders first, alone; the recap waits for it (spec
    // 2026-09-24, section 2).
    const recall = page.getByText("Recall Prompt", { exact: true }).first();
    const recap = page.getByText("Lesson Recap", { exact: true }).first();
    await expect(recall).toBeVisible({ timeout: 15000 });
    await expect(recap).toHaveCount(0);
```

and after the `await expect(reveal).toBeHidden();` line add:

```ts
    // The recap appears once the card leaves its prompt state, below it.
    await expect(recap).toBeVisible();
    const recallBox = await recall.boundingBox();
    const recapBox = await recap.boundingBox();
    expect(recallBox).not.toBeNull();
    expect(recapBox).not.toBeNull();
    expect(recallBox!.y).toBeLessThan(recapBox!.y);
```

4. `e2e/worlds.spec.ts`, the test "the Takeaways step lists the lesson's terms": after `await page.goto(LESSON, { waitUntil: "domcontentloaded" });` add:

```ts
    // The terms list follows the recap, which waits for the recall card
    // (spec 2026-09-24, section 2): bail on the card first.
    await page.getByRole("button", { name: /recall it/i }).first().click();
```

- [ ] **Step 10: Build and run the affected e2e specs**

Run the production build command from the table, then:
`source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/lesson-layout.spec.ts e2e/end-of-lesson.spec.ts e2e/worlds.spec.ts e2e/channel-experiment.spec.ts e2e/editor-drafts.spec.ts e2e/learning-routes.spec.ts e2e/normalization-experiment.spec.ts e2e/accessibility.spec.ts --project=chromium --reporter=line > /tmp/e2e.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e.log`
Expected: all passed. The accessibility spec audits every step in both schemes; Takeaways now audits the recall card alone, and the Complete step's fade-out marker is audited for contrast for the first time.

- [ ] **Step 11: Checkpoint**

Owner commits Tasks 3 to 5 if not yet committed separately. Suggested message: `feat(lesson): the recap and the terms list wait for the recall card`.

---
### Task 5 addendum: applied during execution (2026-09-25)

1. **Lint-clean registration effect.** In `RegisteredRecallPrompt`, the effect's cleanup read `registry.current`, which `react-hooks/exhaustive-deps` warns about. Capture the Set once at the top of the effect with `const pending = registry.current;` and use `pending.add(id)` and `pending.delete(id)` in the body and the cleanup. The Set is never reassigned, so behaviour is unchanged.
2. **From the quality review.**
   - **Answered cards stay out.** In `RegisteredRecallPrompt`'s effect, make `if (settledRef.current) return;` the first line. An answered card must not register again when its effects re-run (Fast Refresh in development, or any future Activity wrapper); otherwise the count never reaches 0 again.
   - **Recall read first.** In `LessonStepsInner`'s restore effect, move the `recallKey` read above the `-passed` block, in its own try/catch, so a malformed `-passed` entry cannot skip it.
   - **`lesson-content.test.tsx`, first test.** Keep `unmount` from `render`; at the end add `report.mockClear(); unmount(); expect(report).not.toHaveBeenCalled();`, so the cleanup that deletes without reporting stays that way.
   - **`lesson-content.test.tsx`, "reports zero once" test.** Add `expect(report).toHaveBeenCalledTimes(1);`.
   - **`e2e/end-of-lesson.spec.ts`.** After `await expect(recap).toBeVisible();`, add `await expect(page.getByRole("button", { name: /got it/i }).first()).toBeVisible();`, so a remount after the recap appears would fail.
   - **`e2e/accessibility.spec.ts`.** In the lesson-step audit's init script, next to its consent line, add `localStorage.setItem("tc_recall_deep-orbit_introduction-to-tensors", "1");`, so the Takeaways audit scans the recap and the terms list again, beside the card in its prompt state.

### Task 6: The exercise brief beside the editor (spec section 3)

**Files:**
- Create: `packages/ui/src/mdx/exercise-data.tsx`, `packages/ui/src/mdx/exercise-brief.tsx`, `packages/ui/src/mdx/exercise-brief.test.tsx`
- Modify: `packages/ui/src/mdx/exercise.tsx` (imports lines 3-17; the context, provider and chip config blocks lines 155-203; `ExerciseProps` line 131; the not-found branch line 930; the header, title and instructions blocks lines 968-1017), `packages/ui/src/mdx/index.ts:7`, `packages/ui/src/index.ts:8-23`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` (import line 6; the two `base.Exercise` bindings lines 509-535), `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx:227-233` (`CHALLENGE_LEFT`)
- Test: `lesson-content.test.tsx`, `lesson-steps.playback.test.tsx:62`, `e2e/lesson-layout.spec.ts`, `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts` (Task 1's accent shadow rule)

- [ ] **Step 1: Write the failing brief test**

Create `packages/ui/src/mdx/exercise-brief.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import { ExerciseBrief } from "./exercise-brief";
import { ExerciseDataProvider } from "./exercise-data";
import type { ExerciseData } from "./exercise";

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));

const exercise: ExerciseData = {
  slug: "create-a-tensor",
  title: "First Contact: Tensor In, Memory Clean",
  instructions:
    "Start with the five readings in `streamValues`.\n1. Create a 1D tensor called `reading` from that array.",
  starterCode: "",
  solutionCode: "",
  testCode: "",
  estimatedMinutes: 6,
  difficulty: "beginner",
  mlContent: "data",
  hints: [{ level: "nudge", content: "Three moves." }],
};

function renderBrief(ex: ExerciseData = exercise) {
  return render(
    <ExerciseDataProvider exercises={new Map([[ex.slug, ex]])}>
      <ExerciseBrief slug={ex.slug} />
    </ExerciseDataProvider>,
  );
}

describe("ExerciseBrief (spec 2026-09-24, section 3)", () => {
  it("renders the chips, the title, the instructions and the exercise's own ladder", () => {
    renderBrief();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "First Contact: Tensor In, Memory Clean",
    );
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByTestId("mlcontent-badge")).toHaveTextContent(
      "Tensor Data",
    );
    expect(screen.getByText("~6 min")).toBeInTheDocument();
    expect(screen.getByText(/five readings/)).toBeInTheDocument();
    expect(screen.getByTestId("exercise-hints")).toBeInTheDocument();
  });

  it("wraps its header row between whole items only", () => {
    const { container } = renderBrief();
    const row = container.querySelector(
      "[data-testid='exercise-brief'] > div",
    )!;
    expect(row).toHaveClass("flex-wrap");
    for (const item of Array.from(row.children)) {
      expect(item).toHaveClass("whitespace-nowrap");
    }
  });

  it("renders the not-found card for an unknown slug", () => {
    render(
      <ExerciseDataProvider exercises={new Map()}>
        <ExerciseBrief slug="missing" />
      </ExerciseDataProvider>,
    );
    expect(screen.getByText(/not found/)).toBeInTheDocument();
  });

  it("imports no Sandpack, directly or through the exercise module", () => {
    const here = new URL(".", import.meta.url);
    const brief = fs.readFileSync(new URL("exercise-brief.tsx", here), "utf8");
    const data = fs.readFileSync(new URL("exercise-data.tsx", here), "utf8");
    // Import lines only: the data module's comment names Sandpack to say
    // why it must not import it.
    expect(brief + data).not.toMatch(/^import[^\n]*sandpack/im);
    expect(brief).not.toMatch(/from "\.\/exercise"/);
    expect(data).not.toMatch(/^import (?!type ).*from "\.\/exercise"/m);
  });

  it("the pane wraps its header between chips and guards its brief behind the inline mode", () => {
    // The pane itself needs Sandpack to render, so its two contracts are
    // pinned in source: the Playwright layout spec proves the page.
    const src = fs.readFileSync(
      new URL("exercise.tsx", import.meta.url),
      "utf8",
    );
    expect(src).toMatch(/brief === "inline" && \(/);
    expect(src).toMatch(/mb-4 flex flex-wrap items-center gap-x-3 gap-y-1/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run packages/ui/src/mdx/exercise-brief.test.tsx`
Expected: FAIL at import: `./exercise-brief` does not exist.

- [ ] **Step 3: The shared data module**

Create `packages/ui/src/mdx/exercise-data.tsx`:

```tsx
"use client";

import { createContext } from "react";
import type { ExerciseData, MLContent } from "./exercise";

/* Shared by the exercise pane (exercise.tsx) and the brief
   (exercise-brief.tsx). exercise.tsx imports Sandpack at module level, so
   everything the brief needs lives here and this file imports no Sandpack
   (spec 2026-09-24, section 3). The type imports above are erased. */

export const ExerciseDataContext = createContext<Map<string, ExerciseData>>(
  new Map(),
);

export function ExerciseDataProvider({
  exercises,
  children,
}: {
  exercises: Map<string, ExerciseData>;
  children: React.ReactNode;
}) {
  return (
    <ExerciseDataContext.Provider value={exercises}>
      {children}
    </ExerciseDataContext.Provider>
  );
}

/* Badge colors are scheme-paired: the dark values are bright pastels that
   sat at 1.5-2.4:1 on the light scheme's white cards (axe, 2026-07-23).
   Light values are the same hues darkened until >=4.6:1 against both
   white and their own `${color}15` tint composited on the light paper
   surface #F5F5F2, the real chip background (axe, 2026-08-12). */
export const difficultyConfig = {
  beginner: { label: "Beginner", color: "#4ADE80", light: "#16773A" },
  intermediate: { label: "Intermediate", color: "#FBBF24", light: "#866103" },
  advanced: { label: "Advanced", color: "#F87171", light: "#CA0A0A" },
};

export const mlContentConfig: Record<
  MLContent,
  { label: string; tone: string; light: string }
> = {
  arithmetic: { label: "Arithmetic", tone: "#9CA3AF", light: "#606877" },
  data: { label: "Tensor Data", tone: "#60A5FA", light: "#0762D3" },
  model: { label: "Model Build", tone: "#A78BFA", light: "#6E44EB" },
  training: { label: "Training", tone: "#F472B6", light: "#C40F6E" },
  evaluation: { label: "Evaluation", tone: "#FB923C", light: "#A74D04" },
  deployment: { label: "Deployment", tone: "#34D399", light: "#1A7554" },
  systems: { label: "Systems", tone: "#F59E0B", light: "#8F5C06" },
};

/* The fallback when the context carries no exercise for the slug. */
export function ExerciseNotFound({ slug }: { slug: string }) {
  return (
    <div className="p-6 my-6 bg-surface-raised border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          Exercise
        </h4>
      </div>
      <p className="text-sm text-text-muted">
        Exercise{" "}
        <code className="text-xs px-1.5 py-0.5 bg-surface-overlay text-primary">
          {slug}
        </code>{" "}
        not found.
      </p>
    </div>
  );
}
```

Every value above is copied from `exercise.tsx` as it stands; diff the two blocks before deleting the old one (`git diff` shows the deletion, and the new file must carry identical rows).

- [ ] **Step 4: The brief**

Create `packages/ui/src/mdx/exercise-brief.tsx`:

```tsx
"use client";

import { useContext } from "react";
import { useScheme } from "../use-scheme";
import { InstructionText } from "./instruction-text";
import { HintPanel } from "./hint-panel";
import {
  ExerciseDataContext,
  ExerciseNotFound,
  difficultyConfig,
  mlContentConfig,
} from "./exercise-data";

interface ExerciseBriefProps {
  slug: string;
  /** The exercise's own ladder reports here, like the lesson-level one. */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}

/* The exercise's chips, title, instructions and its own hint ladder, for
   the Challenge step's reading column (spec 2026-09-24, section 3). The
   pane (exercise.tsx with brief="external") keeps the editor. Rendered
   inside .lesson-prose, so the title pins every property the prose h3
   rule sets, as LearningObjectives does for its heading. */
export function ExerciseBrief({ slug, onHintRevealed }: ExerciseBriefProps) {
  const exercise = useContext(ExerciseDataContext).get(slug);
  const scheme = useScheme();
  if (!exercise) return <ExerciseNotFound slug={slug} />;
  const diff = difficultyConfig[exercise.difficulty];
  const diffColor = scheme === "light" ? diff.light : diff.color;
  const ml = exercise.mlContent ? mlContentConfig[exercise.mlContent] : null;
  const mlTone = ml ? (scheme === "light" ? ml.light : ml.tone) : null;
  return (
    <div
      data-testid="exercise-brief"
      data-exercise-slug={slug}
      className="my-6"
    >
      {/* Wraps between whole items only (the phone fix, section 3). */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="whitespace-nowrap text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          <span className="text-base" aria-hidden="true">
            ⚡
          </span>{" "}
          Exercise
        </span>
        <span
          className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
          style={{ background: `${diffColor}15`, color: diffColor }}
          title="Cognitive difficulty"
        >
          {diff.label}
        </span>
        {ml && mlTone && (
          <span
            className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
            style={{ background: `${mlTone}15`, color: mlTone }}
            title="ML content axis: what skill the exercise actually builds"
            data-testid="mlcontent-badge"
          >
            {ml.label}
          </span>
        )}
        <span className="whitespace-nowrap text-xs text-text-muted">
          ~{exercise.estimatedMinutes} min
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-2 text-text-primary"
        style={{
          marginTop: 0,
          marginBottom: "0.5rem",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "var(--tc-text)",
        }}
      >
        {exercise.title}
      </h3>
      <InstructionText
        text={exercise.instructions}
        className="text-sm leading-relaxed mb-4 text-text-primary/65"
      />
      {exercise.hints && exercise.hints.length > 0 && (
        <div data-testid="exercise-hints">
          <HintPanel hints={exercise.hints} onHintRevealed={onHintRevealed} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: The pane reads from the shared module and gains its two props**

In `exercise.tsx`:

1. Remove `createContext,` from the `react` import. After the `./exercise-draft` import add:

```ts
import {
  ExerciseDataContext,
  ExerciseDataProvider,
  ExerciseNotFound,
  difficultyConfig,
  mlContentConfig,
} from "./exercise-data";

// The provider moved to exercise-data.tsx (spec 2026-09-24, section 3);
// lesson-content.tsx and the package index import it from here.
export { ExerciseDataProvider };
```

2. Delete the block from the comment `/*  Context - exercise data injected from LessonContent` (and its rule lines) through the closing `};` of `mlContentConfig`, including the `/*  Difficulty badge  */` comment block between them. Confirm with `grep -n "difficultyConfig\|mlContentConfig\|ExerciseDataContext" packages/ui/src/mdx/exercise.tsx` that every remaining hit is a use, not a definition.

3. In `ExerciseProps`, after `onHintRevealed`, add:

```ts
  /**
   * "inline" (default) renders the brief (chips, title, instructions and
   * the exercise's own hint ladder) above the editor, as every mount did
   * before 2026-09-24. "external" leaves the brief to ExerciseBrief in the
   * Challenge step's reading column and renders the pane from the editor
   * down (spec 2026-09-24, section 3).
   */
  brief?: "inline" | "external";
  /**
   * With an external brief, name the exercise in the eyebrow row so the
   * learner can match this editor to its brief in the other column. The
   * page sets it when the lesson has more than one exercise.
   */
  titled?: boolean;
```

and destructure them in `Exercise`: `brief = "inline", titled = false,` after `onHintRevealed,`.

4. Replace the not-found branch (`if (!exercise) { return ( <div className="p-6 my-6 ...`) with `if (!exercise) return <ExerciseNotFound slug={slug} />;`.

5. Replace the header block (`{/* Header */}` through its closing `</div>`) and the title-and-instructions block (`{/* Title & Instructions */}` through the closing `)}` of the `exercise.hints` conditional) with:

```tsx
      {/* Header row. Wraps between whole items only: at 390 px the old
          non-wrapping row squeezed its chips until they broke inside words
          ("EXERCIS / E", "Beginne / r"). With an external brief the chips
          and the minutes live in the brief; the row keeps the eyebrow and,
          when the lesson has more than one exercise, the exercise's name. */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-base">⚡</span>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Exercise
          </h4>
        </div>
        {brief === "inline" ? (
          <>
            <span
              className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
              style={{
                background: `${diffColor}15`,
                color: diffColor,
              }}
              title="Cognitive difficulty"
            >
              {diffConfig.label}
            </span>
            {mlConfig && mlTone && (
              <span
                className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
                style={{
                  background: `${mlTone}15`,
                  color: mlTone,
                }}
                title="ML content axis: what skill the exercise actually builds"
                data-testid="mlcontent-badge"
              >
                {mlConfig.label}
              </span>
            )}
            <span className="whitespace-nowrap text-xs text-text-muted">
              ~{exercise.estimatedMinutes} min
            </span>
          </>
        ) : titled ? (
          <span
            className="min-w-0 truncate text-xs text-text-muted"
            data-testid="exercise-pane-title"
          >
            {exercise.title}
          </span>
        ) : null}
      </div>

      {brief === "inline" && (
        <>
          <h3 className="text-lg font-semibold mb-2 text-text-primary">
            {exercise.title}
          </h3>
          <InstructionText
            text={exercise.instructions}
            className="text-sm leading-relaxed mb-4 text-text-primary/65"
          />
          {exercise.hints && exercise.hints.length > 0 && (
            <div data-testid="exercise-hints">
              <HintPanel
                hints={exercise.hints}
                onHintRevealed={onHintRevealed}
              />
            </div>
          )}
        </>
      )}
```

6. Exports: in `packages/ui/src/mdx/index.ts` add `export { ExerciseBrief } from "./exercise-brief";` after line 7. In `packages/ui/src/index.ts` add `ExerciseBrief,` to the `./mdx` export list after `Exercise,`.

7. Extend Task 1's accent shadow rule in `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`. Add `"packages/ui/src/mdx/exercise-data.tsx"` to its `loses` array: the not-found card moved there, and it keeps its `border border-border` hairline. Then add inside that describe:

```ts
  it("the exercise brief carries no offset shadow", () => {
    // Prose in the reading column, not a framed block: no hairline to check.
    expect(read("packages/ui/src/mdx/exercise-brief.tsx")).not.toMatch(
      /\bbrutalist-shadow\b/,
    );
  });
```

- [ ] **Step 6: Run the brief test, then typecheck the UI package**

Run: `pnpm exec vitest run packages/ui/src/mdx/exercise-brief.test.tsx "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts"`
Expected: PASS.

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Write the failing content tests**

In `lesson-content.test.tsx`:

1. In the `@tensorcraft/ui` mock factory replace `Exercise: () => null,` with:

```tsx
  Exercise: ({ brief, titled }: { brief?: "inline" | "external"; titled?: boolean }) => (
    <div
      data-testid="exercise-pane"
      data-brief={brief ?? "inline"}
      data-titled={titled ? "true" : undefined}
    />
  ),
  ExerciseBrief: ({ slug }: { slug: string }) => (
    <div data-testid="exercise-brief">{slug}</div>
  ),
```

2. Add a body after `RECALL_BODY`:

```ts
const EXERCISE_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const Exercise = _components.Exercise;
  return jsxs(Fragment, {children: [
    jsx("p", {children: "Now it is your turn."}),
    jsx(Exercise, {slug: "create-a-tensor"})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;
```

3. Add a describe at the end:

```tsx
describe("LessonContent, the exercise brief and the pane (spec 2026-09-24, section 3)", () => {
  const one = [
    {
      slug: "create-a-tensor",
      title: "t",
      instructions: "i",
      starterCode: "",
      solutionCode: "",
      testCode: "",
      estimatedMinutes: 6,
      difficulty: "beginner" as const,
    },
  ];
  const two = [...one, { ...one[0], slug: "second" }];
  const lessonBody = { body: EXERCISE_BODY, concept: { explanation: "x" } };

  it("renders the brief and no pane for a set that names ExerciseBrief", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["challenge", "ExerciseBrief"])}
      />,
    );
    expect(screen.getByTestId("exercise-brief")).toHaveTextContent(
      "create-a-tensor",
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId("exercise-pane")).toBeNull();
  });

  it("renders the pane without its brief for a set that names Exercise", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    const pane = await screen.findByTestId("exercise-pane");
    expect(pane).toHaveAttribute("data-brief", "external");
    expect(pane).not.toHaveAttribute("data-titled");
    expect(screen.queryByTestId("exercise-brief")).toBeNull();
  });

  it("names the pane when the lesson has more than one exercise", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={two}
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    expect(await screen.findByTestId("exercise-pane")).toHaveAttribute(
      "data-titled",
      "true",
    );
  });

  it("renders the inline pane alone when no set is passed", async () => {
    render(<LessonContent lesson={lessonBody} exercises={one} />);
    expect(await screen.findByTestId("exercise-pane")).toHaveAttribute(
      "data-brief",
      "inline",
    );
    expect(screen.queryByTestId("exercise-brief")).toBeNull();
  });
});
```

4. In `lesson-steps.playback.test.tsx`, add `ExerciseBrief: () => null,` next to `Exercise: () => null,` in its `@tensorcraft/ui` factory.

- [ ] **Step 8: Run to verify they fail**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx" -t "exercise brief and the pane"`
Expected: FAIL: no brief renders and the pane carries no `data-brief`.

- [ ] **Step 9: The bindings and the set**

In `lesson-content.tsx`:

1. Add `ExerciseBrief,` to the `@tensorcraft/ui` import list (a static import; the brief has no Sandpack).

2. Replace both `base.Exercise` assignments (the `if (worldId && lessonId) { ... } else { ... }` block) with:

```tsx
    // The Challenge step's left instance names "ExerciseBrief" and renders
    // the brief where the MDX places the exercise; the pane instance names
    // "Exercise" and renders the editor without its brief. With no set (or
    // an empty one) shouldShow is true for every name, so that path keeps
    // today's inline pane and never renders both (spec 2026-09-24, section
    // 3). The count comes from the lesson's exercises prop: a numbered
    // index was rejected because velite lists exercises in file order.
    const scoped = !!visibleComponents && visibleComponents.size > 0;
    const submit =
      worldId && lessonId
        ? (result: ExerciseSubmitResult) => {
            handleExerciseSubmit(result);
            if (result.passed) {
              onExerciseComplete?.(result.exerciseSlug, result.score);
            }
          }
        : undefined;
    base.Exercise = (props: { slug: string }) => {
      if (scoped && shouldShow("ExerciseBrief")) {
        return (
          <ExerciseBrief slug={props.slug} onHintRevealed={handleHintRevealed} />
        );
      }
      if (!shouldShow("Exercise")) return null;
      return (
        <Exercise
          {...props}
          key={`${props.slug}:${draftOwner ?? "guest"}`}
          draftOwner={draftOwner}
          bridge={bridgeHint}
          onHintRevealed={handleHintRevealed}
          onSubmit={submit}
          brief={scoped ? "external" : "inline"}
          titled={scoped && exerciseCount > 1}
        />
      );
    };
```

Before the `useMemo` that builds `components`, add `const exerciseCount = exercises.length;` and add `exerciseCount` and `visibleComponents` to the memo's dependency array if they are not already there (`shouldShow` already depends on `visibleComponents`; `exerciseCount` is a number and changes only with the lesson). The `Exercise` dynamic import's loading placeholder is unchanged.

3. In `lesson-steps.tsx`, `CHALLENGE_LEFT` becomes:

```ts
// Challenge: challenge zone, the exercise brief where the MDX places the
// exercise (a pseudo-name: the left instance renders ExerciseBrief there,
// spec 2026-09-24 section 3), and the hint ladders on the left; the
// Exercise editor in the right pane.
const CHALLENGE_LEFT = new Set([
  "challenge",
  "ExerciseBrief",
  "HintPanel",
  "TransferAssignment",
  "DecisionTask",
  "IndependentProject",
]);
```

Run `grep -n "data-visible" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx"` and, if a test pins the Challenge left set's sorted names, add `ExerciseBrief` to that expectation.

- [ ] **Step 10: Run the lesson directory's tests, the UI tests, typecheck and lint**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]" packages/ui/src` then `pnpm typecheck` then `pnpm lint`
Expected: PASS; no errors; no new warnings. `content-partition-contract.test.ts` passes: the pseudo-name is never an MDX component and the test only unions the sets. Also `grep -rn "mlcontent-badge" apps/web e2e --include='*.ts' --include='*.tsx' | grep -v exercise-brief`: any test that expects the badge inside the pane on the Challenge step now finds it in the brief; update that selector to the brief.

- [ ] **Step 11: The page-level proof**

In `e2e/lesson-layout.spec.ts`, inside the desktop describe add:

```ts
  test("the exercise brief sits in the reading column and the pane keeps the editor", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    const brief = page.getByTestId("exercise-brief");
    await expect(brief).toBeVisible();
    await expect(brief.getByRole("heading", { level: 3 })).toBeVisible();
    const pane = page.locator("[data-testid='lesson-right'][data-kind='pane']");
    await expect(pane.locator("h3")).toHaveCount(0);
    await expect(pane.locator(".cm-content")).toBeVisible({ timeout: 30000 });
    // One exercise: the pane's eyebrow carries no title.
    await expect(pane.getByTestId("exercise-pane-title")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        briefRight: box("[data-testid='exercise-brief']").right,
        paneLeft: box("[data-testid='lesson-right'][data-kind='pane']").left,
      };
    });
    expect(m.briefRight).toBeLessThanOrEqual(m.paneLeft);
  });
```

and inside the phone describe (the one that uses a 390 by 844 viewport; create `test.describe("lesson layout, phone", ...)` with `test.use({ viewport: { width: 390, height: 844 }, colorScheme: "dark" })` if none exists):

```ts
  test("the Instructions view holds the brief and its header wraps only between chips", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    const brief = page.getByTestId("exercise-brief");
    await expect(brief).toBeVisible();
    await expect(brief.getByRole("heading", { level: 3 })).toBeVisible();
    // Every item in the header row is one line tall: a chip that broke
    // inside a word would be two.
    const items = await brief
      .locator(":scope > div:first-child > *")
      .evaluateAll((els) =>
        els.map((el) => ({
          height: el.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(el).lineHeight),
        })),
      );
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const item of items) {
      // An item that broke inside a word is two lines tall. One line plus a
      // chip's padding, or the eyebrow's larger glyph, stays under 1.9.
      expect(item.height).toBeLessThan(item.lineHeight * 1.9);
    }
    await page.getByRole("button", { name: "Editor" }).click();
    await expect(
      page.locator("[data-testid='lesson-right'][data-kind='pane'] .cm-content"),
    ).toBeVisible({ timeout: 30000 });
    await expect(brief).toBeHidden();
  });
```

- [ ] **Step 12: Build and run the layout spec, the drafts spec and the exercise-run spec**

Run the production build command, then:
`source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/lesson-layout.spec.ts e2e/editor-drafts.spec.ts e2e/exercise-run.spec.ts e2e/accessibility.spec.ts --project=chromium --reporter=line > /tmp/e2e.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e.log`
Expected: all passed. The accessibility audit of the Challenge step now sees the brief's `h3` in the left column and the pane's `h4` eyebrow.

- [ ] **Step 13: Checkpoint**

Owner commits. Suggested message: `feat(lesson): the exercise brief beside the editor; the pane keeps the editor`.

---
### Task 6 addendum: applied during execution (2026-09-25)

1. **Reading source files in the brief test.** Under the root jsdom environment, Vite rewrites `new URL("<file>", import.meta.url)` into an address resolved against jsdom's location (`http://localhost:3000/`), so `fs.readFileSync` rejects it. The two source-reading tests use the repo's existing convention instead (as in `exercise-corpus.test.ts`): `path.dirname(fileURLToPath(import.meta.url))` joined with the file name, through one `source(name)` helper. The assertions are unchanged.
2. **From the quality review.**
   - **Sandpack guard.** In `exercise-brief.test.tsx`, add `vi.mock("@codesandbox/sandpack-react", () => { throw new Error("the brief must not load Sandpack"); });` next to the `use-scheme` mock. It is hoisted, so a static import anywhere in the brief's graph fails the file, whatever its line wrapping. Keep the existing source checks.
   - **Brief hint wiring (UI test).** In `exercise-brief.test.tsx`, add a test that renders the brief with `onHintRevealed={spy}`, clicks the "Reveal Nudge" button, and expects `spy` to have been called with `1`.
   - **Brief hint wiring (content test).** In `lesson-content.test.tsx`, make the `ExerciseBrief` mock render `<button type="button" onClick={() => onHintRevealed?.(1)}>reveal</button>` beside its slug, and add a test in the "exercise brief and the pane" describe. With `onHintRevealed={spy}`, `worldId` and `lessonId` set, clicking it calls `spy` with `1`, and `trackHintRequested` with `1, { worldId, lessonId }`. In the "renders the brief and no pane" test, replace the `setTimeout(0)` wait with `expect(screen.queryByText("Loading editor…")).toBeNull()` before the pane assertion.
   - **`titled` branch.** In `exercise-brief.test.tsx`'s source test, pin it with `expect(src).toMatch(/titled \? \(\s*<span[\s\S]*?data-testid="exercise-pane-title"/);`.
   - **Pane headings in multi-exercise lessons.** In `exercise.tsx`, the eyebrow `h4` gains `{brief === "external" && titled && <span className="sr-only">: {exercise.title}</span>}` after "Exercise", and the visible title span gains `title={exercise.title}`, since it truncates.
   - **Cross-references.** Above `.lesson-prose h3` in `apps/web/app/globals.css`, add `/* ExerciseBrief (packages/ui/src/mdx/exercise-brief.tsx) pins every property this rule sets inline; add any new property here to both places. */`. In `docs/architecture.md`, in the MDX components table, add a row for `ExerciseBrief`: "The exercise's chips, title, instructions and own hint ladder, rendered in the Challenge step's reading column; imports no Sandpack".
3. **Found by Task 8's full unit run.** `packages/content/__tests__/pipeline-integration.test.tsx` read `exercise.tsx` as text and expected `export function ExerciseDataProvider` there; after the move the provider is defined in `exercise-data.tsx`. The test (now "Exercise: the package exports Exercise and a working ExerciseDataProvider") checks the contract instead of the file layout: `exercise.tsx` still matches `/export\s+function\s+Exercise\b/` (Sandpack keeps it out of jsdom); a small `reExports` parser maps each `export { ... } from "..."` name to its source, and `mdx/index.ts` must export `Exercise` from `./exercise` and `ExerciseDataProvider` from `./exercise` or `./exercise-data`, while `src/index.ts` exports both from `./mdx`; and the provider, imported from the Sandpack-free `exercise-data.tsx`, renders around a child that reads the map's size from `ExerciseDataContext`. `node:fs` and `node:path` are top-level imports, which removes the base file's ungated `no-require-imports` error (the content package's lint covers `src/` only). This fix is part of Task 6's patch; Task 8's quality review asked for the stronger form.

### Task 7: Code wraps on phones (spec section 4)

**Files:**
- Modify: `apps/web/app/globals.css` (after the `.lesson-prose pre` rule, line 613), `packages/ui/src/mdx/exercise.tsx` (the `SandpackCodeEditor` element near line 1034)
- Modify only if the measurement demands it: `packages/ui/src/mdx/code-block.tsx:16-18,59-63`
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`, `e2e/lesson-layout.spec.ts`

- [ ] **Step 1: Write the failing contract test**

Append to `lesson-layout-contract.test.ts`:

```ts
describe("code wraps on phones (spec 2026-09-24, section 4)", () => {
  const css = read("apps/web/app/globals.css");
  const block =
    /@media \(max-width: 1023px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";

  it("wraps pre below the one-column breakpoint", () => {
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*white-space: pre-wrap/);
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*overflow-wrap: anywhere/);
    expect(block).toMatch(/\.lesson-prose pre \{[^}]*overflow-x: visible/);
  });

  it("gives each highlighted line a 2ch hanging indent", () => {
    expect(block).toMatch(/\.lesson-prose pre \.line \{[^}]*padding-left: 2ch/);
    expect(block).toMatch(/\.lesson-prose pre \.line \{[^}]*text-indent: -2ch/);
  });

  it("reaches no deeper than the line span", () => {
    const selectors = block.match(/^\s*\.lesson-prose[^{]*\{/gm) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) {
      expect(s.replace("{", "").trim().split(/\s+/).length).toBeLessThanOrEqual(3);
    }
  });

  it("the editor wraps its lines at every width", () => {
    expect(read("packages/ui/src/mdx/exercise.tsx")).toMatch(
      /<SandpackCodeEditor[\s\S]*?\bwrapContent\b[\s\S]*?\/>/,
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts" -t "code wraps"`
Expected: FAIL, all four.

- [ ] **Step 3: The media block and the editor prop**

In `globals.css`, directly after the `.lesson-prose pre { ... }` rule (line 613), add:

```css
/* Code on phones wraps instead of scrolling (spec 2026-09-24, section 4):
   at 390 px the Concept step's blocks hid 47 to 56% of every line, the
   trailing comments first. Below the one-column breakpoint each Shiki
   line is a full-width inline block with a 2 ch hanging indent, and the
   preserved newline after it ends its line. Raw fences and the
   unhighlighted fallback have no .line spans and wrap without the indent.
   From 1,024 px nothing changes; lines fit the 820 and 1,184 px boxes. */
@media (max-width: 1023px) {
  .lesson-prose pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overflow-x: visible;
  }
  .lesson-prose pre .line {
    display: inline-block;
    width: 100%;
    padding-left: 2ch;
    text-indent: -2ch;
  }
}
```

In `exercise.tsx`, add `wrapContent` to the editor element:

```tsx
              <SandpackCodeEditor
                showLineNumbers
                showTabs={false}
                // The starter's comments are the task's steps; on a phone
                // they were the part off-screen (spec 2026-09-24, section 4).
                // At desktop no starter reaches the editor's width.
                wrapContent
                style={{
                  minHeight: 200,
                  maxHeight: 400,
                }}
              />
```

- [ ] **Step 4: Run the two unit files**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts" packages/ui/src/mdx/exercise-brief.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the page-level measurement**

In `e2e/lesson-layout.spec.ts`, inside the phone describe, add:

```ts
  for (const step of [1, 2]) {
    test(`every code block fits the phone on step ${step + 1}, with no blank line between code lines`, async ({
      page,
    }) => {
      await openStep(page, LESSONS.paragraphLed, step);
      // Rendered blocks only: the Concept step keeps the reference drawer's
      // example inside a closed <details>, which lays out nothing. Shiki
      // highlights on the client after mount, so wait until every rendered
      // block carries its line spans.
      await expect
        .poll(() =>
          page.evaluate(() => {
            const pres = Array.from(
              document.querySelectorAll<HTMLElement>(".lesson-prose pre"),
            ).filter((pre) => pre.getBoundingClientRect().height > 0);
            return (
              pres.length > 0 && pres.every((pre) => !!pre.querySelector(".line"))
            );
          }),
        )
        .toBe(true);
      const blocks = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".lesson-prose pre"))
          .filter((pre) => pre.getBoundingClientRect().height > 0)
          .map((pre) => {
          const lines = Array.from(pre.querySelectorAll<HTMLElement>(".line"));
          const boxes = lines.map((l) => l.getBoundingClientRect());
          // Shiki renders a blank source line as an empty span, which lays
          // out 0 px tall while its line box keeps the blank line's height.
          // Measure the lines that carry text: a newline rendering as a line
          // of its own would still open a gap between every such pair.
          const filled = boxes.filter((b) => b.height > 0);
          // One unwrapped line's height; a wrapped line is a multiple of it.
          const single = Math.min(...filled.map((b) => b.height));
          let maxGap = 0;
          for (let i = 1; i < boxes.length; i++) {
            if (boxes[i].height === 0 || boxes[i - 1].height === 0) continue;
            maxGap = Math.max(maxGap, boxes[i].top - boxes[i - 1].bottom);
          }
          const wrappedAt = boxes.findIndex((b) => b.height > single * 1.5);
          const style =
            wrappedAt >= 0 ? getComputedStyle(lines[wrappedAt]) : null;
          return {
            scrollWidth: pre.scrollWidth,
            clientWidth: pre.clientWidth,
            lines: filled.length,
            single,
            maxGap,
            hanging: style
              ? {
                  paddingLeft: parseFloat(style.paddingLeft),
                  textIndent: parseFloat(style.textIndent),
                }
              : null,
          };
        }),
      );
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) {
        expect(b.lines).toBeGreaterThan(0);
        expect(b.scrollWidth).toBeLessThanOrEqual(b.clientWidth);
        // A blank line between two code lines is a gap of a whole line
        // height. Half a line of slack absorbs baseline rounding without
        // letting a blank line through.
        expect(b.maxGap).toBeLessThan(b.single / 2);
      }
      // At least one line wraps, and its continuation starts 2 ch in: the
      // padding equals the negative indent.
      const wrapped = blocks.find((b) => b.hanging);
      expect(wrapped).toBeDefined();
      expect(wrapped!.hanging!.paddingLeft).toBeGreaterThan(0);
      expect(
        wrapped!.hanging!.paddingLeft + wrapped!.hanging!.textIndent,
      ).toBeCloseTo(0, 1);
    });
  }

  test("the editor shows its starter code without a horizontal scrollbar", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 3);
    await page.getByRole("button", { name: "Editor" }).click();
    const scroller = page.locator(
      "[data-testid='lesson-right'][data-kind='pane'] .cm-scroller",
    );
    await expect(scroller).toBeVisible({ timeout: 30000 });
    const m = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
  });
```

- [ ] **Step 6: Build and run it; this is the spec's measurement**

Run the production build command, then:
`source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/lesson-layout.spec.ts --project=chromium --reporter=line > /tmp/e2e.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e.log`
Expected: all passed.

If the `maxGap` assertion fails with a gap near one line height, the preserved newline text nodes are rendering as their own lines. Apply the spec's fallback and run again:

1. In `code-block.tsx`, widen the highlighter type (lines 16 to 18) to
   `codeToHtml: (code: string, opts: { lang: string; theme: string; transformers?: Array<{ code?: (node: { children: Array<{ type: string; value?: string }> }) => void }> }) => string;`
   and pass, in the `codeToHtml` call, `transformers: [{ code(node) { node.children = node.children.filter((c) => !(c.type === "text" && c.value === "\n")); } }]`.
2. The transformer drops the newlines at every width, so the lines must stack at every width too. Add `.lesson-prose pre .line { display: block; min-height: 1lh; }` as a top-level rule directly after the media block, and reduce the media block's `.line` rule to the indent pair (`padding-left: 2ch; text-indent: -2ch;`), dropping `display: inline-block` and `width: 100%`. A blank source line is an empty span, which a block collapses to 0 px; `1lh` keeps it one line tall. Without the top-level rule every code block from 1,024 px up would collapse onto one row. The contract test names no display value and still finds the indent pair, so it needs no change; update the Step 5 test's comment that says empty spans lay out at 0 px.
3. Add this guard to the desktop describe of `e2e/lesson-layout.spec.ts`, because the Concept desktop baseline is re-minted in Task 8 and would otherwise certify a collapse:

```ts
  test("code lines stack on desktop", async ({ page }) => {
    await openStep(page, LESSONS.paragraphLed, 1);
    await expect(
      page.locator(".lesson-prose pre .line:visible").first(),
    ).toBeVisible();
    const collapsed = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".lesson-prose pre"))
        .filter((pre) => pre.getBoundingClientRect().height > 0)
        .some((pre) => {
          const tops = Array.from(
            pre.querySelectorAll<HTMLElement>(".line"),
          ).map((l) => l.getBoundingClientRect().top);
          return tops.some((top, i) => i > 0 && top <= tops[i - 1]);
        }),
    );
    expect(collapsed).toBe(false);
  });
```

- [ ] **Step 7: Checkpoint**

Owner commits. Suggested message: `feat(lesson): code wraps with a hanging indent below 1,024 px; the editor wraps`.

---

### Task 7 addendum: fixes from the quality review (applied during execution, 2026-09-25)

The primary CSS path held in the browser measurement, so the fallback stays unused. The review found two premises of section 4 wrong, and three small gaps.

1. **The editor wraps at desktop too, on purpose.** 59 of 65 Deep Orbit starters have a line wider than the 1,440 px editor, and 64 of 65 are wider than the editor at 1,024 px, so `wrapContent` shows at desktop as well. It stays, because the steps' comments were scrolled off at desktop too. In `exercise.tsx`, replace the three-line comment above `wrapContent` with:

```tsx
                // The starter's comments are the task's steps, and they were
                // the part scrolled off-screen: most starters have a line
                // wider than the editor at every width (spec 2026-09-24,
                // section 4, amended 2026-09-25).
```

2. **Instruction pseudo-code wraps at every width.** Task 6 moved the brief into a 352 to 440 px column, where 18 of the 38 pseudo-code lines in 5 exercises scroll sideways and hide their comments; on phones the new rule wrapped them with no hang. In `packages/ui/src/mdx/instruction-text.tsx`, the code block's `pre` drops `overflow-x-auto whitespace-pre` for `whitespace-pre-wrap [overflow-wrap:anywhere]` (it keeps `tabIndex`, `role` and `aria-label`), and renders each line as a full-width span with a 2 ch hanging indent:

```tsx
              {block.text.split("\n").map((line, lineIndex, lines) => (
                <Fragment key={lineIndex}>
                  <span className="inline-block w-full pl-[2ch] -indent-[2ch]">
                    {line}
                  </span>
                  {lineIndex < lines.length - 1 ? "\n" : null}
                </Fragment>
              ))}
```

   Import `Fragment` from `react`. Add a test in `packages/ui/src/mdx/exercise-brief.test.tsx`: render the brief for an exercise whose instructions hold an indented pseudo-code block of two lines; assert the `pre` (role region, name "Exercise code contract") has the `whitespace-pre-wrap` class and contains two spans with the `-indent-[2ch]` class.
3. **The file's own breakpoint syntax.** In `apps/web/app/globals.css`, the block's query becomes `@media (width < 64rem)`, the form the file already uses for Tailwind's `lg`, which also tracks a non-default browser font size. In the contract test, the block regex becomes `/^@media \(width < 64rem\) \{([\s\S]*?)\n\}/m`: anchored to a line start, because an indented `@media (width < 64rem)` block already sits nested inside another rule earlier in the file.
4. **A bounded editor regex.** In the contract test's editor case, capture the element first and assert on the capture:

```ts
    const editor =
      /<SandpackCodeEditor\b(?:(?!\/>)[\s\S])*\/>/.exec(
        read("packages/ui/src/mdx/exercise.tsx"),
      )?.[0] ?? "";
    expect(editor).toMatch(/\bwrapContent\b/);
```

5. **Verify.** Run the two unit files, `pnpm exec vitest run packages/ui/src`, `pnpm typecheck`, `pnpm lint` and Prettier. Rebuild, then run `e2e/lesson-layout.spec.ts e2e/ui-remediation.spec.ts e2e/exercise-run.spec.ts e2e/accessibility.spec.ts` with the table's Playwright command.

### Task 8: Records, baselines and the final gates

**Files:**
- Modify: `docs/post-launch-backlog.md` (append a section at the end; one sentence at line 2533), `docs/visual-regression.md` (baseline record rows), `e2e/visual/key-pages.spec.ts`, `e2e/visual/responsive.spec.ts`, `e2e/visual/worlds.spec.ts` (a declined consent in each `beforeEach`)
- Re-mint: `e2e/visual/lesson.spec.ts-snapshots/lesson-concept-{desktop,phone}-chromium-darwin.png` and `lesson-briefing-desktop-chromium-darwin.png`, and the key-pages, responsive and worlds sets

- [ ] **Step 1: Record the audit in the backlog**

Append to `docs/post-launch-backlog.md`:

```markdown

## Lesson audit (2026-09-24)

Every step of lesson 1 walked on the production build as a signed-out
visitor at 1,440 x 900 and 390 x 844, dark scheme, with Playwright; the
exercise gate opened with Show solution. Items 2 to 8 are direction A,
docs/superpowers/specs/2026-09-24-lesson-tightening-design.md (approved
2026-09-24); the owner ordered "A then B then C".

- [ ] **(B1) OWNER, direction B: the Code step re-serves the Concept step's
  code.** On lesson 1 the step is 24 words of framing, the same two
  CodeBlocks the learner read on Concept, and the reference drawer opened
  by default, on a page 2,748 px tall. CodeBlock sits in both CONCEPT_LEFT
  and CODE_RIGHT by design, and 40 of 56 lessons have no derivation
  drawer to justify the step. Direction B folds Code into Concept in its own
  spec after direction A ships; direction C (content of its own for the
  step) follows B. The same item as "The Code step is thin" under the
  2026-09-04 re-audit follow-ups.
- [x] **(B1) The consent banner covered the activation moment.** 202 px at
  desktop, 248 px on a phone (29% of the screen), over the last story beat
  and the divider for the whole 17-second scene; Continue landed under it.
  Resolved by section 1 of the spec: a bar that reserves its height.
- [x] **(B1) The recall card sat directly above the recap bullet that states
  its answer.** Resolved by section 2.
- [x] **(B1) On a phone the Instructions view held 23 words while the task
  sat under Editor (459 words), and the exercise header broke inside words at
  390 px.** Resolved by section 3.
- [x] **(B2) Every Concept code block scrolled sideways on a phone, 47 to 56%
  of each line hidden.** Resolved by section 4.
- [x] **(B2) The step bar had no labels.** Resolved by section 5; the last
  step reads "Epilogue" on screen and analytics keeps "Consequence".
- [x] **(B2) The Complete step printed the title twice and offered two
  next-lesson controls; "Fade out" sat at 1.23:1.** Resolved by section 6.
- [x] **(B3) The offset accent shadow sat on every container.** Resolved by
  section 7: it stays on the exercise pane, the recall and warm-up cards, the
  hint ladder, the decision boxes, the quiz and the demo.
- [ ] **(B3) The NextLesson card never lifts on hover.**
  `apps/web/app/components/mdx/next-lesson.tsx` pairs `brutalist-hover` with
  layered hover utilities that lose to, or cancel, the unlayered
  `.brutalist-hover:hover` rule in `apps/web/app/globals.css`: the two
  `translate` utilities offset the rule's 2 px lift, and the rule's 6 px
  shadow at 35% accent wins over the utility's 4 px accent shadow. On hover
  the card shows the faint shadow and never moves. Predates the 2026-09-24
  work. Found in the Task 1 quality review of
  docs/superpowers/plans/2026-09-24-lesson-tightening.md.
- [ ] **(B3) OWNER: two faint edges after the shadow rule.** The exercise
  results panel's partial state uses `border-warning/15`, about 1.33:1 in
  dark and 1.25:1 in light against the pane, fainter than the house hairline
  (about 1.45:1). Its success and error states sit near the hairline, so
  `/20` would match them. CodeBlock is framed by its hairline alone (about
  1.63:1 dark, 1.31:1 light against the page), because Shiki paints the code
  close to the page colour. The edges are decorative, so neither fails WCAG
  1.4.11, and no baseline captures the results panel. Found in the Task 1
  quality review of docs/superpowers/plans/2026-09-24-lesson-tightening.md.
- [ ] **(B2) OWNER: the exercise editor wraps at desktop too.** Since
  2026-09-25 `wrapContent` is on at every width, because 59 of 65 starters
  have a line wider than the desktop editor and their step comments were
  scrolled off. Wrapped rows start at the content edge with no line number,
  and Home, End, Up and Down move by visual row. The alternative is to wrap
  below 1,024 px only (`wrapContent` from a matchMedia hook); crossing the
  breakpoint then rebuilds the editor view, which keeps the text but loses
  undo history and the cursor. Found in the Task 7 quality review of
  docs/superpowers/plans/2026-09-24-lesson-tightening.md.
- [ ] **(B3) Wrapped code hangs from the block edge, not the line's indent.**
  Below 1,024 px a wrapped line continues 2 ch in from the `pre` edge, so a
  line indented 2 or more spaces continues at or left of its own code (2,669
  CodeBlock lines exceed a 390 px row; 986 are indented 2+ spaces). A Shiki
  `line` transformer in `packages/ui/src/mdx/code-block.tsx` that stamps
  each line's leading spaces as `--tc-indent`, with the CSS hang written as
  `calc((var(--tc-indent, 0) + 2) * 1ch)`, would hang each line from its own
  indent. Found in the Task 7 quality review.
- [ ] **(B3) Run the phone wrap tests in WebKit.** `e2e/lesson-layout.spec.ts`
  runs only in the chromium project, and iOS Safari is the main phone engine.
  The inline-block line layout with preserved newlines has not been seen in
  WebKit. The simplest route is a wrap test in `e2e/mobile.spec.ts`, which
  the `mobile-iphone-se` project already runs in WebKit at 320 x 568. This
  overlaps the open "Test-infra debt (2026-07-21 audit structural notes)"
  item, which notes that the WebKit projects run only the mobile smoke
  suite. Found in the Task 7 quality review.
- [ ] **(B3) OWNER: two "Need a hint?" ladders in one column.** Since the
  2026-09-25 change, an exercise's own hint ladder renders in the Challenge
  step's reading column, above the lesson ladder at the column's foot. About
  8 lessons (10 exercises carry their own ladder) now show two panels headed
  "Need a hint?" in one column, where the second used to sit in its own pane.
  A label per ladder (for example "Hints for" followed by the exercise's
  title) would tell them apart. Found in the Task 6 quality review of
  docs/superpowers/plans/2026-09-24-lesson-tightening.md.
- [ ] **(B2) Analytics: `hintsUsed` counts the exercise's own ladder from
  2026-09-25.** Before, reveals on an exercise's own ladder reached analytics
  but never the step machine's counter, so `hintsUsed` on the attempts POST,
  `exercise_submitted` and `lesson_completed` undercounted on those lessons.
  From this change on they count. The figure is lesson-wide distinct levels,
  so a reveal on exercise 2's ladder also raises exercise 1's figure.
  Read any jump on those lessons as this fix, not a behaviour change.
  Per-exercise attribution would need the counter keyed by exercise slug.
- [ ] **(B2) Takeaways: Continue before answering skips the recap.** The
  recall gate keeps Continue available, so a learner who moves on without
  answering never sees the recap or the terms list on that visit. Compare
  Takeaways step views with `recall_answered` events once data arrives, to
  see how often that happens. Found in the Task 5 quality review of
  docs/superpowers/plans/2026-09-24-lesson-tightening.md.
- [ ] **(B1) OWNER, legal-adjacent: "Cookie settings" never brings the bar
  back in the same tab.** `cookie-settings-button.tsx` clears the consent
  key and turns every consent gate off, so withdrawal itself works. But
  `CookieConsent` reads storage once, on mount, and has never listened for
  consent changes, so a visitor cannot make a new choice until a full
  reload. The button's docstring and the closed backlog item "Consent
  withdrawal path (code)" both say the banner re-shows. The fix is small
  (subscribe to the consent change event in `CookieConsent`), and the
  publish effect from the 2026-09-24 work already handles a re-show. Found
  in the Task 2 quality review of
  docs/superpowers/plans/2026-09-24-lesson-tightening.md.
```

At line 2533 (the item "(OWNER CALL) The Code step is thin for the 42 drawer-less lessons"), append the sentence: `Direction B of the 2026-09-24 lesson audit (see "Lesson audit (2026-09-24)" below) takes this up after direction A ships.`

Run: `grep -c $'\xe2\x80\x94' docs/post-launch-backlog.md` and expect `0`.

- [ ] **Step 2: The three visual specs store a declined consent**

In each of `e2e/visual/key-pages.spec.ts`, `e2e/visual/responsive.spec.ts` and `e2e/visual/worlds.spec.ts`, add as the first statement of the `test.beforeEach` callback:

```ts
      // The consent bar would otherwise sit in every capture and move with
      // the copy; the lesson and review specs already store a choice.
      await page.addInitScript(() => {
        localStorage.setItem("tc-cookie-consent", "declined");
      });
```

- [ ] **Step 3: Re-read the drift note from Task 0**

Task 0 compared these three specs with their committed baselines on the untouched tree and recorded every difference in a note under the "Baseline record" table of `docs/visual-regression.md`. Re-read it before minting. The re-mint below may keep those differences and add only the consent card's removal and, on a page that renders one of Task 1's components, the shadow's removal.

- [ ] **Step 4: Re-mint**

From the repo root, with the production build of this branch in place (rebuild if `apps/web/.next` is older than the last code change; delete a dev `.next` first, per docs/visual-regression.md):

```bash
source /tmp/tc-e2e-env.sh && RUN_VISUAL=1 CI=1 PW_PORT=3111 npx playwright test e2e/visual/lesson.spec.ts --project=chromium -g "concept|briefing desktop" --update-snapshots=all > /tmp/visual-lesson.log 2>&1
source /tmp/tc-e2e-env.sh && RUN_VISUAL=1 CI=1 PW_PORT=3111 npx playwright test e2e/visual/lesson.spec.ts --project=chromium -g "briefing phone" --update-snapshots=none >> /tmp/visual-lesson.log 2>&1
source /tmp/tc-e2e-env.sh && RUN_VISUAL=1 CI=1 PW_PORT=3111 npx playwright test e2e/visual/key-pages.spec.ts e2e/visual/responsive.spec.ts e2e/visual/worlds.spec.ts --project=chromium --update-snapshots=all > /tmp/visual-mint.log 2>&1
grep -E "passed|failed|flaky" /tmp/visual-lesson.log /tmp/visual-mint.log
git status --short e2e/visual
```

Expected: the phone Briefing passes against its committed image (below 1,024 px the step labels are hidden and nothing else on the Briefing changed); the desktop Briefing, both Concept images and the 30 key-pages, responsive and worlds images change. Open every changed PNG (`open <path>`) and confirm: at 1,440 the six step labels sit under their segments on both lesson images, and nothing else moved on the Briefing; on Concept, the green offset is gone from the code blocks, the callout and the objectives box, and at 390 the code wraps with no horizontal scrollbar; on the other 30, the consent card is gone from the bottom and nothing else moved except the drift Task 0 recorded. A baseline written during a run always passes; the eyes are the check.

Afterwards run the compare once: `source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3111 pnpm test:visual > /tmp/visual-compare.log 2>&1; grep -E "passed|failed|flaky" /tmp/visual-compare.log` and expect all passed, none flaky. `CI=1` keeps the compare on the production build; `pnpm test:visual` alone would start `next dev` over it.

- [ ] **Step 5: Record the re-mint**

Add these rows at the end of the "Baseline record" table in `docs/visual-regression.md`, inside the table and above the note Task 0 wrote under it:

```markdown
| 2026-09-24 | `lesson-briefing-desktop.png` | Spec 2026-09-24 section 5: the six step labels appear under the step bar's segments from 1,024 px | The labels under the bar, and the bars move up to make room inside the 44 px control row, whose height does not change. Nothing else on the page moves |
| 2026-09-24 | `lesson-concept-{desktop,phone}.png` | Spec 2026-09-24 sections 4, 5 and 7: at 1,440 the step labels appear under the segments; the offset shadow leaves the code blocks, the bridge callout and the objectives box; below 1,024 px the code wraps with a 2 ch hanging indent | Desktop: the 4 px green offset gone from four boxes, page height unchanged within 8 px. Phone: the three code blocks grow taller as their long lines wrap and their horizontal scrollbars go (record the new heights from the images) |
| 2026-09-24 | `key-pages`, `responsive` and `worlds` sets (30 PNGs) | The consent card leaves the frame: the three specs now store a declined consent like the lesson and review specs (spec 2026-09-24, section 1). Pre-existing drift, measured on the untouched tree before any change, is in the note under this table (Task 0) and is kept | The 640 px card and its offset shadow disappear from the bottom of every capture; a page shorter than the viewport loses the card's height |
```

- [ ] **Step 6: The final gates**

```bash
cd packages/content && pnpm run build:content && cd ../..
pnpm exec vitest run > /tmp/unit.log 2>&1; tail -5 /tmp/unit.log
pnpm typecheck
pnpm lint
pnpm format:check
```

Expected: the unit suite passes (the em-dash gate and the slop lexicon gate are in it); no type errors; no new lint warnings.

Then the full browser suite against a fresh production build (the build command from the table):

```bash
source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test --project=chromium --reporter=line > /tmp/e2e-all.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e-all.log
source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3117 npx playwright test e2e/mobile.spec.ts --reporter=line > /tmp/e2e-mobile.log 2>&1; grep -E "passed|failed|flaky" /tmp/e2e-mobile.log
git checkout -- apps/web/next-env.d.ts
git status --short
```

Expected: all passed in both; the working tree shows only the intended files. If any `next dev` ran during the work, `git checkout -- apps/web/AGENTS.md` too (it rewrites that file with em dashes).

- [ ] **Step 7: Checkpoint**

Owner commits the records and the baselines. Suggested message: `docs(lesson): the 2026-09-24 audit record; baselines re-minted for the shadow rule, the phone code wrap and the consent bar`. Then the owner pushes; the CI `mint` job produces the Linux baselines per docs/visual-regression.md.

---

### Task 8 addendum: applied during execution (2026-09-25)

1. **Backlog.** In the two-hint-ladders item, the example label reads "Hints for" followed by the exercise's title: a literal `<exercise title>` renders as an HTML tag on GitHub and hides the words.
2. **Step 2.** `e2e/visual/responsive.spec.ts` has its `beforeEach` at 2 spaces, so the consent block sits at 4.
3. **Step 5 rows, as measured.** The Concept row names two code blocks, not three (the phone Concept step shows two), with the heights from the images: `inspect-a-packet.ts` 475 to 755 px, `tensor-memory.ts` 615 to 1,063 px, page 4,695 to 5,423 px, plus one sentence that headless Chromium hides scrollbars. The 30-PNG row's last cell reads: "On 24 of the 30, the card and its offset shadow leave the band where the first viewport put it (rows 614 to 787 at 1,280 x 800). The six landing images never showed the card, because the hero canvas mask covered it. Five of them change only through the older differences in the note below. `landing-768` is byte-identical, because it was minted on 2026-09-19, after the older changes that reach it". No height changed except the two deep-orbit images Task 0 recorded.
4. **Older drift under the tolerance.** The re-mint also kept differences already on `f232988a` that stayed under the 0.001 `maxDiffPixelRatio`, so Task 0's compare passed them: the footer "Report issue" link (`80a3f029`), the FAQ's 28 hours (`8dba3469`), the 320 px header padding (`6ed43376`), the 56 bridges on /learn, and "theme" to "world" (`1f55a97e`). A note after Task 0's note in `docs/visual-regression.md` lists them per image, and Task 0's last sentence now reads "The re-mint of these sets for that work keeps these differences and the smaller ones listed below. Everything else in those images comes from the work."
5. **Unit gate.** The one failure (`pipeline-integration.test.tsx`) came from Task 6 and is fixed in Task 6's patch; see the Task 6 addendum, item 3.
6. **From the quality review.**
   - **Deep-orbit cause.** Task 0's note now says why those two images lost 995 px: they were minted at `6ed43376` (2026-09-19), before `8a28a23c` and `1f55a97e` (2026-09-20) changed `apps/web/app/worlds/[slug]/page.tsx`. The signed-out page lost the route picker (purchasers only) and the expanded project brief (now a collapsed "Project brief" at the end), and the hero line changed.
   - **Older-drift note.** The lead-in reads "Each one is already on `f232988a`, from an earlier commit, and none comes from a line this work changes". Task 2 edits `report-issue-button.tsx`, so "a file this work does not touch" was false.
   - **30-PNG row.** It states that at every viewport the card's band ends 12 px above the first viewport's foot, with 614 to 787 at 1,280 x 800 as the example.
   - **"Every visual spec" list.** A bullet records the declined consent seed in all five visual specs (`review-warmup.spec.ts` through `seedDueReview`), and that the bar's coverage is `e2e/consent-bar.spec.ts` plus the axe suite, which never stores a choice.
   - **Backlog.**
     - The closed "Consent withdrawal path (code)" item gains a dated correction pointing at the new Cookie settings item.
     - The drawer count is exact, 40 of 56 (16 lessons carry a `DerivationDrawer`), in both the direction-B item and the older "Code step is thin" item, which said 42.
     - The hang item names `packages/ui/src/mdx/code-block.tsx`.
     - The WebKit item names `e2e/mobile.spec.ts` (the `mobile-iphone-se` project runs WebKit) and cross-references the open "Test-infra debt (2026-07-21 audit structural notes)" item.
7. **From the quality re-review (Ready: Yes).** The "Every visual spec" consent bullet says the axe suite's page and lesson-step audits store no consent choice, since the review warm-up audits seed a declined one through `seedDueReview`; the older-drift lead-in drops its repeated clause; the open "Test-infra debt (2026-07-21 audit structural notes)" backlog item now says two WebKit projects (iPhone SE, iPad) and the Chromium Pixel 7 run the mobile smoke suite, where it said "three WebKit projects".

### Task 9: Final review follow-ups (added 2026-09-25)

The whole-branch review of Tasks 0 to 8 found no critical or important issue ("Ready to hand to the owner: Yes") and eight minor ones. This task fixes the six with a clear answer and records the one design call. It is its own commit, after Task 8.

**Files:**
- Modify: `apps/web/app/globals.css`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx` (or the file that holds the swipe tests), `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`, `packages/ui/src/mdx/instruction-text.tsx`, `packages/ui/src/mdx/exercise-brief.tsx`, `packages/ui/src/mdx/exercise.tsx` (comment only), `e2e/lesson-layout.spec.ts`, `e2e/consent-bar.spec.ts`, `e2e/accessibility.spec.ts` (comment only), `docs/architecture.md`, `docs/post-launch-backlog.md`

- [ ] **Step 1: Focus and anchors clear the consent bar.** Body padding clears the bar only at the page's end: a focused element in the viewport's bottom band (60 px at 1,440, 144 px at 390) counts as in view, so the browser does not scroll it, and the bar hides it. In `globals.css`, give the root element `scroll-padding-bottom: var(--tc-consent-h, 0px)` (if an `html` rule already sets a `scroll-padding`, add it there; the bar publishes the property on the root element). Add a test beside "body pads its bottom by the bar's published height" in the "consent bar reserved space" describe that pins the rule. In `e2e/consent-bar.spec.ts`, add a test with no stored choice: scroll so a focusable element sits inside the bar's band, focus it with `element.focus()`, and expect its bottom edge at or above the bar's top. If Chromium does not honour `scroll-padding` for focus, keep the CSS and the contract test, drop the e2e test, and report the measured positions.

- [ ] **Step 2: Swipe works over code that cannot pan.** Since Task 7, code blocks below 1,024 px wrap and never scroll sideways, but `handleTouchStart` still treats any touch inside `pre, code` as a content pan, so a swipe over most of a phone Concept step does nothing. Keep `.sp-wrapper, .cm-editor, [data-no-swipe]` unconditional; for `pre, code`, suppress the swipe only when the nearest block can pan:

```ts
const block = target?.closest("pre") ?? target?.closest("code");
touchFromScrollable.current =
  !!target?.closest(".sp-wrapper, .cm-editor, [data-no-swipe]") ||
  (!!block && block.scrollWidth > block.clientWidth);
```

(`closest("pre")` first: an inline `code` inside a scrolling `pre` has no scroll box of its own.) Update the comment above it. Tests: a swipe that starts on a `pre` whose `scrollWidth` equals its `clientWidth` navigates; one whose `scrollWidth` exceeds it (stub both with `Object.defineProperty` on the element) does not; one on the editor wrapper does not. Find the existing swipe coverage first and extend it rather than duplicating it.

- [ ] **Step 3: A guest who finished the lesson is not re-gated.** The spec settles the recall gate for a returning learner (`recallSettled || knownCompleted`), but `knownCompleted` comes from the server `lessons` prop only, so a guest who finished lesson 1, returns, lands on the Epilogue and steps back sees only the recall card. In the restore effect, in its own `try` right after the `tc_recall` read, settle the gate when `getGuestCompletions()` holds this world, module and lesson (the completion effect already merges guest records the same way). Unit test: a stored guest completion for the lesson, mounted at Takeaways, shows the recap with no answer given; a guest completion for a different lesson does not.

- [ ] **Step 4: Takeaways layout checks cover the full step too.** `openStep` for step 4 now waits for the recall card, so the desktop and phone layout loops in `e2e/lesson-layout.spec.ts` measure a Takeaways view with no recap and no terms list. Add a second step-4 pass in both loops with `tc_recall_deep-orbit_introduction-to-tensors` set to `"1"` before navigation, so the same invariants (no right column, footer spacing, nothing between Continue and the footer) run on the settled view. Give the new tests distinct names.

- [ ] **Step 5: Small code fixes.** In `instruction-text.tsx`, drop `tabIndex={0}` from the code-contract `pre`: it existed for axe's scrollable-region rule, and the block now wraps at every width and never scrolls, so it adds a keyboard stop with nothing to do (keep its `role` and `aria-label`). In `exercise-brief.tsx`, drop the unused `data-exercise-slug` attribute (confirm no test, e2e spec or CSS reads it).

- [ ] **Step 6: Comments and docs the code contradicts.**
  - `exercise.tsx`, the comment near line 84 that says an exercise's own ladder is "present on a lesson's second exercise": `ci-cd-gate`, `verify-deployment` and `browser-ml-tradeoffs` are first or only exercises with their own ladders. Say what is true.
  - `e2e/accessibility.spec.ts`, the comment near lines 31-32 that lists where `data-decorative` remains: `packages/ui/src/animated-avatar.tsx` also carries one, on every lesson Briefing.
  - `docs/architecture.md`: the `lesson-steps.tsx` row gains the `tc_recall_*` key and the recall-before-recap gate (settled by an answer, a known completion or a guest completion); the `lesson-content.tsx` row gains `onRecallPending` and the ExerciseBrief rendering path.
  - `docs/post-launch-backlog.md`, the "two Need a hint? ladders" item: count the lessons and exercises that carry their own ladder from the content files and state the exact numbers (the review found 9 lessons, adding `browser-runtimes/01-why-the-browser`), and say that `capstone/05-launch` shows three panels, since `verify-deployment` and `launch-rehearsal` both carry one.

- [ ] **Step 7: Measure the brief's title, record the call.** On the production build at 1,440 and 390, open lesson 1's Challenge step with a throwaway Playwright script (not a committed test) and read the computed `font-size`, `line-height` and `font-weight` of the brief's `h3` and of its first instruction paragraph and list item. Add an item to the "Lesson audit (2026-09-24)" block, tagged `(B3) OWNER`: the title against the instructions with the measured numbers, the old pane title's size for comparison, and the two options (pin the title larger, or pin the instruction metrics inside the brief as LearningObjectives pins its list). If the title is already clearly larger, write no item and report the numbers.

- [ ] **Step 8: Gates.** Build with the table's build command. Then, each in its own call: the full unit suite, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, the full chromium Playwright suite, `e2e/mobile.spec.ts`, and the visual compare (`source /tmp/tc-e2e-env.sh && CI=1 PW_PORT=3111 pnpm test:visual`). None of the visual baselines should change; if one fails, stop and report it. Em dash count 0 in every changed file; `apps/web/next-env.d.ts` and `apps/web/AGENTS.md` unchanged.

- [ ] **Step 9: Checkpoint.** Owner commits. Suggested message: `fix(lesson): final review follow-ups; focus clears the consent bar, swipe over wrapped code, guest recall settle`.

### Task 9 addendum: applied during execution (2026-09-25)

1. **Step 1.** `globals.css` had no `scroll-padding` rule, so the property joins the existing `html { color-scheme: dark; }` rule. Chromium honours it for focus: at 1,440 Continue moves from 896 (under the 61 px bar, top at 839) to 690, and at 390 from 840 to 401 (bar 151 px, top at 693). With the rule forced to 0 focus does not scroll, so the e2e test fails without it.
2. **Step 2.** No swipe coverage existed anywhere, so the three tests are a new "LessonSteps, swipe navigation" describe in `lesson-steps.test.tsx`; each touch lands on the inline `code` inside the `pre`, which also pins the `closest("pre")`-first order.
3. **Step 4.** Both layout loops iterate `[step, settled]` pairs through an `openSettledTakeaways` helper instead of copying the test bodies.
4. **Step 6, found during the task and fixed by the controller.** The exercise-ladder comment in `packages/content/velite.config.ts` still framed ladders as second exercises "rendered beneath the exercise's instructions" in the pane; it now names the first or only ones and the brief. The `lesson-steps.tsx` row in `docs/architecture.md` still said "forward-only bottom nav", though the nav has had a Back button since 2026-07-14.
5. **Step 7 measurement.** The brief's `h3` is 18 px / 28 px / 600 at both widths; the first instruction paragraph is 18 px / 32.4 px at 1,440 and 16 px at 390; the old pane title was 24 px at 1,440 and 20 px at 390 (the unlayered `.lesson-prose h3` rule beat `text-lg` inside the old prose pane). Recorded as a `(B3) OWNER` item in the audit block.
6. **Root `tsc`, not a gate.** Type-checking the root `tsconfig.json` (with a workspace `tsc`; `npx tsc` at the root is not TypeScript, and macOS has no `timeout` command) reports 36 errors, all React-type resolution in package tests. The Task 6 test's `import { useContext } from "react"` added one of them, so the test reads the context through `ExerciseDataContext.Consumer` instead; the change is in Task 6's patch.
7. **From the quality review (Ready: Yes, seven minor findings, all applied).**
   - The swipe check is `block.scrollWidth - block.clientWidth > 1`, since the two widths round separately at fractional widths (the +1 of `mobile.spec.ts` and `reflow.spec.ts`), with a 321 against 320 case that pages.
   - The focus e2e test scrolls, checks the band and focuses in one `evaluate`.
   - The swipe describe gains inline `code` outside a `pre` (it pages), plus a case where that code's own box pans (it does not), which pins the `closest("code")` fallback.
   - A signed-in owner with a guest completion also settles the gate (deliberate: GuestProgressBridge replays guest completions into whichever account signs in).
   - The accessibility comment names every place AnimatedAvatar renders.
   - The two-ladders backlog item adds `browser-runtimes/01-why-the-browser`, whose two ladders repeat the same nudge and guidance word for word.
   - The brief-title item gives one option per sentence.
   - Two `(B3)` backlog items record the duplicate code landmarks (`capstone/05-launch` renders three "Exercise code contract" regions) and the tab stops on Shiki and raw-fence blocks that cannot scroll below 1,024 px.
8. **From the quality re-review (Ready: Yes), applied by the controller.**
   - Task 7's comment above the phone wrap rule in `globals.css` said lines fit the 820 and 1,184 px boxes from 1,024 px. At 1,440 one of lesson 1's Concept blocks overflows, so it now says most lines fit and a longer one scrolls; the spec's section 4 sentence carries the same dated correction.
   - The two new backlog items name the Deep Orbit build as the source of their fence counts.
   - The landmark item's 40-word sentence is split.

## Notes for the executor

- Task 0 runs before any code change: it measures the drift Task 8's re-mint must not absorb. Tasks 1 to 4 are independent of each other and of Task 5; Task 6 needs Task 1's shadow removal in `exercise.tsx` to be in place (the not-found card moves shadow-less); Task 7's contract test reads Task 6's `exercise.tsx`. Run them in the order given and every checkpoint is green alone.
- The `lesson-steps.test.tsx` stub for `LessonContent` reports `recallState.pendingOnMount` on every mount, on every step. Tests that never touch Takeaways are unaffected: the step passes no `onRecallPending` on other steps.
- `vi.mock("@tensorcraft/ui")` factories: `lesson-content.test.tsx` and `lesson-steps.playback.test.tsx` enumerate `Exercise` and gain `ExerciseBrief` (Task 6). `lesson-steps.test.tsx` mocks `./lesson-content` wholesale and `scene-clip.test.tsx` mocks only `ScenePortrait`; neither needs the brief.
- `useId` returns ids with colons; they are only Set keys here, never selectors.
- Never pipe Playwright through `tail`, never point it at 3000 or 3001, and restore `apps/web/next-env.d.ts` after every build.
