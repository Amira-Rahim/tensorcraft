# Pricing Re-evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `/pricing` advertising three SKUs that cannot be bought, and stop
it quoting counts that drifted from the corpus, without changing any price.

**Architecture:** Presentation-only change to `apps/web/app/pricing/`. The
five-card grid collapses to two live cards (Free, Single) plus a
non-transactional bundle roadmap strip. JSON-LD and page metadata stop quoting
unbuyable bundle prices. Two new gates close the holes that let these claims
drift. `PRICING`, the checkout API, `validateThemeIds`, and the Stripe webhook
are not touched: the server diff is zero.

**Tech Stack:** Next.js App Router (RSC + client components), TypeScript,
Tailwind, Vitest + Testing Library (single root `vitest.config.ts`, jsdom),
Playwright (e2e + visual snapshots + axe), Velite-compiled MDX content.

**Spec:** `docs/superpowers/specs/2026-08-09-pricing-reevaluation-design.md`

---

## IMPORTANT: execution rules (decided 2026-08-09)

**No commits, by anyone, at any point.** `CLAUDE.md` forbids committing on the
user's behalf, and the user confirmed this for this run. Workers must never run
`git add`, `git commit`, `git push`, `git stash`, `git checkout`, or
`git restore`. Leave every change in the working tree. The user commits when
satisfied.

Reviewers therefore **review the uncommitted working tree**, not commit SHAs.
Use `git diff` and `git status` to see the change set.

**Branch: `main`, in place.** The user chose to work directly on `main` rather
than branch or use a worktree. There is no isolation and no per-task checkpoint
to roll back to, so a worker that breaks something must fix it forward rather
than reset. Do not create branches.

**The tree is not clean at start.** Three untracked docs files exist (this plan
and two specs). That is expected. Do not remove them.

---

## Prerequisites

Run once before starting. Velite output must exist or every content test fails
on a missing `../.velite` import.

```bash
pnpm turbo build:content
```

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `packages/content/__tests__/scene-art-coverage.test.ts` | Gate: every built deep-orbit lesson has a scene plate. Makes "Every lesson illustrated" true by construction. | Create |
| `apps/web/app/pricing/bundle-roadmap.tsx` | Server component. Non-transactional bundle ladder. No CTA. | Create |
| `apps/web/app/pricing/__tests__/bundle-roadmap.test.tsx` | Roadmap copy must not imply a schedule; must render no button. | Create |
| `apps/web/app/pricing/pricing-tiers.tsx` | Two live cards. Bundle cards removed. Accepts `extrasLessons` prop. | Modify |
| `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx` | 6 of 7 tests re-aimed at behavior instead of card count. | Modify |
| `apps/web/app/pricing/page.tsx` | JSON-LD offers reduce to buyable SKUs; metadata decision; wires new components; passes `EXTRAS_LESSON_COUNT`. | Modify |
| `apps/web/app/pricing/__tests__/pricing-jsonld.test.tsx` | First-ever coverage of the offers array. | Create |
| `e2e/pricing.spec.ts` | `shows all 5 tier cards` rewritten. | Modify |

**Not touched:** `packages/shared/src/constants.ts` (no price change, no new
constant), `checkout-button.tsx`, `curriculum-preview.tsx`, `paywall-notice.tsx`,
the API, and all migrations.

**No art is added to `/pricing` by this plan.** A proof strip was specced and
then dropped on 2026-08-09: all `/pricing` art belongs to
`docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md` Wave 3,
which already owns an eleven-frame module filmstrip at `#curriculum`. Do not
add images. If a task seems to call for one, stop and escalate.

---

## Task 1: Scene-art coverage gate

This runs first because it is what licenses the copy added in Task 5. If it
fails, the claim "Every lesson illustrated" is false and the copy must not ship.

**Files:**
- Create: `packages/content/__tests__/scene-art-coverage.test.ts`

- [ ] **Step 1: Write the failing test**

Model it on the existing pinning gate at
`packages/content/__tests__/exercise-counts.test.ts`, which resolves the content
root the same way.

```ts
import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Scene-art coverage gate (2026-08-09).
 *
 * /pricing prints "Every lesson illustrated" as purchase evidence. That claim
 * is only safe if it is true by construction, so this asserts plate coverage
 * rather than pinning a count: a pinned `63` would be the exact drift the
 * claim is meant to avoid (see the `21 bonus lessons` literal this same change
 * removed).
 */
// CONTENT_DIR resolves to packages/content/content/deep-orbit, so it IS the
// lessons root; repo root is three levels above its parent.
const LESSONS_ROOT = CONTENT_DIR;
const REPO_ROOT = join(dirname(CONTENT_DIR), "..", "..", "..");
const PLATES_ROOT = join(REPO_ROOT, "apps/web/public/scenes/deep-orbit");

function builtLessons(): { module: string; slug: string }[] {
  const out: { module: string; slug: string }[] = [];
  for (const mod of readdirSync(LESSONS_ROOT)) {
    const modDir = join(LESSONS_ROOT, mod);
    if (!existsSync(modDir)) continue;
    for (const file of readdirSync(modDir)) {
      if (!file.endsWith(".mdx")) continue;
      // Files are `NN-slug.mdx`; the plate is named by slug alone.
      out.push({ module: mod, slug: file.replace(/^\d+-/, "").replace(/\.mdx$/, "") });
    }
  }
  return out;
}

describe("deep-orbit scene art covers every built lesson", () => {
  const lessons = builtLessons();

  it("found the lessons", () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it.each(lessons)("$module/$slug has a scene plate", ({ module, slug }) => {
    const plate = join(PLATES_ROOT, module, `${slug}.webp`);
    expect(
      existsSync(plate),
      `No plate at scenes/deep-orbit/${module}/${slug}.webp. ` +
        `/pricing claims "Every lesson illustrated" - either generate the ` +
        `plate (scripts/art/scenes.mjs) or remove the claim.`,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and read the result carefully**

```bash
pnpm vitest run packages/content/__tests__/scene-art-coverage.test.ts
```

**This test is expected to PASS immediately** — the art already shipped. That is
unusual for TDD, and it means the assertion itself must be proven honest before
you trust it.

- [ ] **Step 3: Prove the gate can fail**

Temporarily rename one plate, re-run, confirm a red test naming that exact
lesson, then rename it back.

```bash
mv apps/web/public/scenes/deep-orbit/training-loop/backpropagation.webp /tmp/plate.webp
pnpm vitest run packages/content/__tests__/scene-art-coverage.test.ts
# Expected: FAIL on "training-loop/backpropagation has a scene plate"
mv /tmp/plate.webp apps/web/public/scenes/deep-orbit/training-loop/backpropagation.webp
pnpm vitest run packages/content/__tests__/scene-art-coverage.test.ts
# Expected: PASS
```

A gate that has never been observed failing is not a gate. This project has been
bitten by exactly that (Gate B was blind to its own `;` delimiter; the e2e a11y
gate failed open).

**Watch for:** epilogue plates. There are 63 plates for 56 lessons because 7
lessons carry an epilogue plate too. This gate covers the 56 briefing plates
only, which is what "every lesson" claims. Do not extend it to demand epilogues.

- [ ] **Step 4: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 2: Fix the `21 bonus deep-dive lessons` literal

**Files:**
- Modify: `apps/web/app/pricing/pricing-tiers.tsx:268`
- Modify: `apps/web/app/pricing/page.tsx`
- Modify: `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx`

**Background the worker needs:** the right constant already exists and is
already correct. `EXTRAS_LESSON_COUNT = 23` is at
`packages/content/src/built-themes.ts:51`, and it is already pinned to the
filesystem transitively by `packages/content/src/end-of-lesson.test.ts:43`.
Do **not** add a new constant and do **not** add a new pin.

The one constraint: `pricing-tiers.tsx` is a **client component**, and
`@tensorcraft/content` exports only `.` to `src/index.ts`, which re-exports
`../.velite`. Importing it client-side pulls all compiled content into the
browser bundle. `pricing/page.tsx` is a **server component**, so the value
crosses the boundary as a prop.

- [ ] **Step 1: Write the failing test**

Add to `pricing-tiers.test.tsx`:

```tsx
it("renders the extras lesson count from the prop, never a hardcoded literal", () => {
  render(<PricingTiers extrasLessons={23} />);
  expect(screen.getByTestId("tier-card-free")).toHaveTextContent(
    /23 bonus deep-dive lessons/,
  );
});
```

- [ ] **Step 2: Run it, verify it fails**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/pricing-tiers.test.tsx
```
Expected: FAIL — the card still says `21`.

- [ ] **Step 3: Implement**

In `pricing-tiers.tsx`, add the prop to the component signature:

```tsx
export function PricingTiers({ extrasLessons }: { extrasLessons: number }) {
```

Replace the literal at line 268:

```tsx
{extrasLessons} bonus deep-dive lessons
```

In `page.tsx`, import the constant and pass it:

```tsx
import { EXTRAS_LESSON_COUNT } from "@tensorcraft/content";
```
```tsx
<PricingTiers extrasLessons={EXTRAS_LESSON_COUNT} />
```

- [ ] **Step 4: Run tests + typecheck**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/pricing-tiers.test.tsx
pnpm turbo typecheck
```
Expected: PASS, 10/10 typecheck.

**Verify the bundle did not regress.** Confirm `@tensorcraft/content` is not
imported by any `"use client"` file under `apps/web/app/pricing/`:

```bash
grep -l '"use client"' apps/web/app/pricing/*.tsx | xargs grep -l "@tensorcraft/content"
```
Expected: **no output.** Any output is a bundle regression; move the import back
to `page.tsx`.

- [ ] **Step 5: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 3: JSON-LD offers reduce to buyable SKUs

**Files:**
- Create: `apps/web/app/pricing/__tests__/pricing-jsonld.test.tsx`
- Modify: `apps/web/app/pricing/page.tsx:100-107`

**Why this matters:** `availabilityFor` marks bundles `PreOrder`. In schema.org
that means *orderable now, delivered later*. No bundle is orderable at any
price, so search results can surface an unbuyable $159. No test covers the
offers array today, which is why this survived every prior audit.

- [ ] **Step 1: Write the failing test**

`page.tsx` builds `pricingJsonLd` inline. To test it, first **extract the offers
builder into a named export** in `page.tsx` (or a sibling `pricing-jsonld.ts` if
cleaner) so it can be imported without rendering the page.

```tsx
it("offers only the SKUs a buyer can actually purchase", () => {
  const offers = buildPricingOffers();
  const names = offers.map((o) => o.name);
  expect(names).toEqual(["Free Preview", "Single Theme"]);
});

it("never emits PreOrder for a product with no orderable path", () => {
  const offers = buildPricingOffers();
  expect(offers.every((o) => o.availability.endsWith("InStock"))).toBe(true);
});
```

Match `name` strings to whatever `page.tsx` currently emits; read lines 80-107
before writing the assertion.

- [ ] **Step 2: Run it, verify it fails**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/pricing-jsonld.test.tsx
```
Expected: FAIL — five offers, three `PreOrder`.

- [ ] **Step 3: Implement**

Filter the offers array to entries whose `themes` count is satisfiable by
`LAUNCHED_THEMES.length`. Keep `availabilityFor` in place: it is correct and it
restores the bundle offers automatically when a theme launches. The change is
*which offers get built*, not how availability is derived.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run apps/web/app/pricing/
pnpm turbo typecheck
```
Expected: PASS.

- [ ] **Step 5: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 4: Two-card decision row + bundle roadmap strip

The largest task. Read the spec's "Buying surface" section before starting.

**Files:**
- Create: `apps/web/app/pricing/bundle-roadmap.tsx`
- Create: `apps/web/app/pricing/__tests__/bundle-roadmap.test.tsx`
- Modify: `apps/web/app/pricing/pricing-tiers.tsx`
- Modify: `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx`

- [ ] **Step 1: Write the failing roadmap tests**

```tsx
it("renders the three bundle prices as information", () => {
  render(<BundleRoadmap />);
  expect(screen.getByTestId("bundle-roadmap")).toHaveTextContent("$99");
  expect(screen.getByTestId("bundle-roadmap")).toHaveTextContent("$129");
  expect(screen.getByTestId("bundle-roadmap")).toHaveTextContent("$159");
});

it("offers no purchase affordance, not even a disabled one", () => {
  render(<BundleRoadmap />);
  const strip = screen.getByTestId("bundle-roadmap");
  expect(strip.querySelectorAll("button")).toHaveLength(0);
  expect(strip.querySelectorAll('a[href*="checkout"]')).toHaveLength(0);
});

it("does not imply a delivery schedule", () => {
  render(<BundleRoadmap />);
  expect(screen.getByTestId("bundle-roadmap")).not.toHaveTextContent(
    /coming soon|soon|shortly|next month|this year/i,
  );
});
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/bundle-roadmap.test.tsx
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Build `BundleRoadmap`**

A server component. Reads `PRICING` and `LAUNCHED_THEMES` from
`@tensorcraft/shared`. Renders the three bundle tiers as a compact ladder with
`data-testid="bundle-roadmap"`. No `CheckoutButton`, no `<button>`.

Condition copy must state the gate without promising a date. It must survive the
regex in the third test.

Keep the house style: `rounded-none`, mono for prices, `border-border`.

- [ ] **Step 4: Run roadmap tests**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/bundle-roadmap.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Re-aim the tier tests**

**6 of the 7 tests in `pricing-tiers.test.tsx` break.** They assert the *shape
of the grid* rather than behavior. Only `Single tier CTA sends planId=single`
(line 183) survives untouched.

Rewrite them to assert what actually matters. Delete rather than adapt where the
old assertion had no behavioral content:

| Old test | Action |
| --- | --- |
| `renders exactly 5 tier cards` (108) | Replace: `renders exactly the buyable tiers` — Free + Single present, `tier-card-two/three/all-five` absent. |
| `renders canonical dollar amounts on every tier` (117) | Narrow to the two live cards. Bundle prices are now covered by the roadmap test. |
| `maps plan ids to tier cards` (126) | Narrow to `free` and `single`. |
| `recommends the buyable Single tier` (150) | Keep the intent, drop the `tier-card-all-five` lookup. Assert Single carries `data-recommended`. |
| `uses rounded-none on every tier card` (160) | Narrow the slug list to the two live cards. |
| `All 5 CTA is disabled at V1` (168) | **Delete.** There is no All-5 CTA any more. Its intent (never sell an unbuyable tier) is now enforced by the roadmap's no-button test. |
| `Single tier CTA sends planId=single` (183) | **Leave untouched.** |

Also rename the `describe` at line 90 — it says "brutalist 5-tier grid".

- [ ] **Step 6: Restructure `PricingTiers`**

Remove the three bundle `<article>` blocks. Change the grid from
`lg:grid-cols-5` to a two-card layout. Keep every `data-testid` and
`data-plan-id` on Free and Single: analytics and checkout depend on them.

Delete the now-unused `twoThemes` / `threeThemes` state, their `ThemePicker`
instances, and the `minBundleLessons` / `allFiveLessons` locals **only if
nothing else reads them.** Check first:

```bash
grep -n "minBundleLessons\|allFiveLessons\|twoThemes\|threeThemes" apps/web/app/pricing/pricing-tiers.tsx
```

Leave the `?plan=twoBundle` restore branch in the `useEffect` at line 117 alone.
It is harmless, and it keeps working when the bundles return.

- [ ] **Step 7: Wire the roadmap into the page**

Render `<BundleRoadmap />` below `<PricingTiers />` in `page.tsx`.

- [ ] **Step 8: Run the full pricing suite + typecheck + lint**

```bash
pnpm vitest run apps/web/app/pricing/
pnpm turbo typecheck
pnpm turbo lint
```
Expected: all PASS.

- [ ] **Step 9: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 5: "Every lesson illustrated" copy

Depends on Task 1 passing. If that gate is red, **stop** — the claim is false.

**Files:**
- Modify: `apps/web/app/pricing/pricing-tiers.tsx`
- Modify: `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("tells the buyer the course is illustrated", () => {
  render(<PricingTiers extrasLessons={23} />);
  expect(screen.getByTestId("tier-card-single")).toHaveTextContent(
    /every lesson illustrated/i,
  );
});
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm vitest run apps/web/app/pricing/__tests__/pricing-tiers.test.tsx
```

- [ ] **Step 3: Add the line**

Add `"Every lesson illustrated"` to the Single tier's feature array (currently
lines 317-323). Add an equivalent to the Free tier's list, which has 6 plates in
`foundations`.

**Do not print a plate count.** "63" includes 7 epilogue plates and will drift.
"Every lesson" is gated by Task 1 and stays true as lessons are added.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run apps/web/app/pricing/
```

- [ ] **Step 5: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 6: Page metadata decision

**Files:**
- Modify: `apps/web/app/pricing/page.tsx:13-39`

**This task requires a human decision. Do not decide it alone.**

`metadata` puts `$159` in four places: the `<title>` ("From $0 to $159"), the
meta description, the OpenGraph description, and the Twitter description (all
say "bundles up to $159").

This is the same misrepresentation as the JSON-LD, but unlike the JSON-LD it is
a judgement call: a title stating a range is not an offer, and it carries SEO
weight on a page that matters for search.

- [ ] **Step 1: Surface the decision to the user**

Present the conservative option — drop "bundles up to $159" from the three
descriptions, leave the `<title>` alone — and the aggressive option, which
rewrites the title too. Get an explicit answer.

- [ ] **Step 2: Implement whichever was chosen**

- [ ] **Step 3: Verify metadata still builds**

```bash
pnpm --filter @tensorcraft/web build
```

- [ ] **Step 4: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.

---

## Task 7: e2e, visual baselines, accessibility

**Files:**
- Modify: `e2e/pricing.spec.ts:14`

- [ ] **Step 1: Rewrite the e2e assertion**

`shows all 5 tier cards` (line 14) asserts `tier-card-free` and
`tier-card-all-five` are visible. The latter no longer exists. Rewrite to assert
the two live cards plus the roadmap strip, and add an assertion that the proof
strip rendered.

- [ ] **Step 2: Run the pricing e2e**

```bash
pnpm test:e2e e2e/pricing.spec.ts
```
Expected: PASS.

- [ ] **Step 3: Regenerate visual baselines**

Six regenerate: `pricing` + `pricing-light`, and
`pricing-320/768/1024/1440`.

```bash
pnpm test:e2e e2e/visual/ --update-snapshots
```

**Review every regenerated PNG by eye before accepting.** `--update-snapshots`
will happily bless a broken layout. Specifically check: the two cards are not
stretched to absurd width at 1440, and the roadmap strip does not overflow at 320.

- [ ] **Step 4: Run the dual axe matrix**

```bash
pnpm test:e2e e2e/ --grep axe
```
Expected: 32/32 (the count recorded in the 2026-08-09 art session).

New images are the risk here. Every plate must carry non-empty alt from content,
and the roadmap strip must not rely on colour alone to convey the locked state
— the same WCAG 1.4.1 issue the `ThemePicker` `aria-pressed` fix addressed at
lines 50-56.

- [ ] **Step 5: Full battery**

```bash
pnpm test && pnpm turbo typecheck && pnpm turbo lint && pnpm turbo build
```

- [ ] **Step 6: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.


---

## Task 8: Documentation

**Files:**
- Modify: `docs/post-launch-backlog.md`

Per `feedback_document_deferred_work`, `docs/post-launch-backlog.md` is the
canonical home for deferred work. Per `feedback_docs_and_tests`, docs get
updated before reporting done.

- [ ] **Step 1: Record the deferred pricing decision**

Add an entry: revisit `PRICING.single` (test $79) only on real conversion data,
earliest at 200 paying users, the same threshold as the theme-2 gate. Cite the
spec.

- [ ] **Step 2: Record the accepted edge**

Note the `ScenePortrait`-returns-null case on `/pricing` as accepted, so a future
audit does not re-discover it as a defect.

- [ ] **Step 3: Grep for other surfaces quoting the retired bundle framing**

```bash
grep -rn "159\|bundles up to\|All 5 Themes" --include="*.tsx" --include="*.ts" --include="*.md" --include="*.txt" apps/web packages/shared/src docs | grep -v node_modules | grep -v __tests__
```

Check `llms.txt` and `ai-plugin.json` in particular — the 2026-06-20 pricing
change had to sweep both. Report what you find; do not necessarily change it.
Those files describe the ladder, which still exists; only the *buyability*
framing changed.

- [ ] **Step 4: Report, do NOT commit**

Leave the change in the working tree. Run `git status --short` and report
the touched files. Do not run `git add` or `git commit`.

---

## Definition of done

- [ ] `pnpm test` green
- [ ] `pnpm turbo typecheck` 10/10
- [ ] `pnpm turbo lint` green
- [ ] `pnpm turbo build` green
- [ ] `pnpm test:e2e` green, including the axe matrix
- [ ] Visual baselines regenerated **and reviewed by eye**
- [ ] Task 1 gate proven to fail when a plate is removed
- [ ] No `"use client"` file under `apps/web/app/pricing/` imports
      `@tensorcraft/content`
- [ ] `PRICING` in `packages/shared/src/constants.ts` **unchanged**
- [ ] Nothing committed by the worker
