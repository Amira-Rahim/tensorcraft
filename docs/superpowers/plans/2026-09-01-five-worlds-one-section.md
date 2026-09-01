# Five Worlds One-Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing Five Worlds section read as one object: a fluid "Choose Your World" type line, the Deep Orbit band, and a badge-free coming-soon rail, on shared gutters.

**Architecture:** Single-component change to `FiveWorldsSection` per the approved spec (docs/superpowers/specs/2026-09-01-five-worlds-one-section-design.md). Cut the eyebrow row, intro paragraph, LIVE NOW badge, and per-card COMING SOON badges; promote the eyebrow text into an h2 in the fluid clamp family; align the rail's row-start text to the page gutter via container padding arithmetic. New tests appended to the colocated unit file guard the cuts and survivors.

**Tech Stack:** Next.js app router, Tailwind (arbitrary clamp values), vitest + testing-library, Playwright visual baselines.

**House rules that override the usual plan grammar:** NO git commits at any step (owner rule: never commit on their behalf; the working tree stays uncommitted for owner review). No em dash characters anywhere. Baselines: delete pngs before minting, verify twice against a WARM server (`PW_PORT=3100`, port 3000 is another project), never pipe playwright through tail.

---

### Task 1: Unit test guard (failing first)

**Files:**
- Modify: `apps/web/app/components/five-worlds-section.test.tsx` (EXISTS with 4 tests: inert cards, single flagship link, modal wiring, reading-column scrim. The scrim test is the ONLY gate on the band's art treatment; all 4 survive the redesign unchanged. Do NOT touch them, do NOT duplicate mocks: the file already mocks next/link, framer-motion, effects, art-plate, newsletter-modal, and location-art.)

- [x] **Step 1: Append the new describe block to the END of the existing file**

```tsx
describe("FiveWorldsSection (one-section redesign, spec 2026-09-01)", () => {
  it("promotes Choose Your World to the section h2", () => {
    render(<FiveWorldsSection />);
    expect(
      screen.getByRole("heading", { level: 2 }).textContent,
    ).toBe("Choose Your World");
  });

  it("renders none of the cut furniture", () => {
    // Cut per the spec: eyebrow row, intro paragraph, LIVE NOW badge,
    // per-card COMING SOON badges, the old "Five Worlds" h2.
    const { container } = render(<FiveWorldsSection />);
    expect(screen.queryByText(/live now/i)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    expect(screen.queryByText("Five Worlds")).toBeNull();
    expect(container.textContent).not.toMatch(/foundations track/i);
  });

  it("keeps the flagship link and all four Notify me waitlist entries", () => {
    render(<FiveWorldsSection />);
    expect(screen.getByText("Deep Orbit").closest("a")).toHaveAttribute(
      "href",
      "/worlds/deep-orbit",
    );
    expect(screen.getByText(/start module 1/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /notify me/i })).toHaveLength(
      4,
    );
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd /Users/amira.salah/Desktop/tensorcraft/apps/web && npx vitest run app/components/five-worlds-section.test.tsx`
Expected: 5 passed, 2 failed. The existing 4 plus the new "keeps the flagship link" pass pre-change; "promotes Choose Your World" fails (h2 is "Five Worlds") and "renders none of the cut furniture" fails on LIVE NOW / COMING SOON.

### Task 2: Header block: the big line

**Files:**
- Modify: `apps/web/app/components/five-worlds-section.tsx:83-118` (header `motion.div`)

- [x] **Step 1: Replace the header block**

Replace the whole header `motion.div` (currently eyebrow row + LIVE NOW badge + h2 + paragraph) with:

```tsx
      {/* One section, three layers, one grammar (spec
          docs/superpowers/specs/2026-09-01-five-worlds-one-section-design.md):
          the line, the band, the rail, on shared gutters. The old eyebrow
          was promoted into the line; the intro paragraph and the LIVE NOW /
          COMING SOON badges were cut: the band and the rail already SHOW
          live-vs-coming. Header prose stays off the art (owner ruling
          2026-08-23); the band's top border is the only rule under the
          type. */}
      <motion.div
        className="px-10 md:px-20 pt-16 pb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {/* Fluid one-liner: 17 mono chars at 0.555em per char (0.6em
            advance minus 0.045em tracking) inside the md:px-20 gutters,
            the same width math as the hero wall's accent line. One line
            from ~768px up, natural wraps below. */}
        <h2 className="text-[clamp(3rem,calc(10vw-1rem),8.5rem)] font-mono font-black leading-[0.93] tracking-[-0.045em] uppercase">
          Choose Your World
        </h2>
      </motion.div>
```

- [x] **Step 2: Typecheck**

Run: `cd /Users/amira.salah/Desktop/tensorcraft/apps/web && npx tsc --noEmit`
Expected: clean.

### Task 3: Rail: badges out, gutters reconciled

**Files:**
- Modify: `apps/web/app/components/five-worlds-section.tsx` (coming-soon grid, currently lines 196-272)

- [x] **Step 1: Align the rail's outer edges to the page gutters**

DELIBERATE DEVIATION from the spec's first/last-card mechanism, recorded
in the spec's amendment note: container padding is the only mechanism
that delivers row-start gutter alignment at ALL THREE grid breakpoints
(first/last-card padding cannot at `sm:grid-cols-2` or `grid-cols-1`).
Consequence: the rail insets from the viewport edge; the band above
remains the section's one full-bleed moment. Task 5 Step 2 checks this
reads as intentional.

Change the grid container class from:

```tsx
      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

to:

```tsx
      {/* Gutter arithmetic: container px-2 md:px-12 plus each card's px-8
          puts every row-start card's text exactly on the page gutter
          (8+32=40 = px-10; 48+32=80 = md:px-20) at all three grid
          breakpoints, without special-casing first/last cards. */}
      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-2 md:px-12">
```

- [x] **Step 2: Remove the COMING SOON badge from the card**

Replace the card's name row (the `flex items-center justify-between` div containing the name div and the badge span) with just the name div:

```tsx
              <div
                className="text-[13px] font-bold tracking-tight uppercase group-hover:text-text-primary transition-colors"
                style={{ color: "var(--tc-muted)" }}
              >
                {t.name}
              </div>
```

(Delete the wrapping `<div className="flex items-center justify-between gap-3">`, its closing tag, and the whole `COMING SOON` `<span>`.)

- [x] **Step 3: Run the new unit test to verify it passes**

Run: `cd /Users/amira.salah/Desktop/tensorcraft/apps/web && npx vitest run app/components/five-worlds-section.test.tsx`
Expected: 7 passed (the existing 4 plus the new 3).

- [x] **Step 4: Run the neighboring suites**

Run: `cd /Users/amira.salah/Desktop/tensorcraft/apps/web && npx vitest run app/page.test.tsx && npx tsc --noEmit`
Expected: 20 passed; typecheck clean.

### Task 4: Copy sweep (both layers, case-insensitive)

- [x] **Step 1: Sweep for stale references**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && grep -rniE "five worlds|live now|coming soon|foundations track" apps/web/app e2e packages/content/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v five-worlds-section`
Expected hits are all leave-alone: /worlds surfaces (`e2e/worlds.spec.ts` asserts `/coming soon/i` on /worlds, which keeps its copy), coming-soon-stub, world-cards-grid, plus non-copy noise (structural comments in `page.tsx`, the `e2e/art.spec.ts` test TITLE "landing Five Worlds band", `ambient-background.tsx` and `auth/page.tsx` comments, pricing JSON-LD "All five worlds", onboarding "(live now)"). The ONLY hits requiring action are ones that ASSERT or RENDER the landing section's cut copy; comments and test titles are not copy, leave them.

### Task 5: Eyeball, then baselines

- [x] **Step 1: Boot the dev server and warm the landing route**

Run: `(pnpm --filter @tensorcraft/web dev -p 3100 > /tmp/dev.log 2>&1 &) ; until curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ | grep -q 200; do sleep 2; done; echo warm`
(Port 3100, never 3000: that is the Ops Portal project.)

- [x] **Step 2: Capture the section unmasked at 1440 and 320 and LOOK at it**

Screenshot `section` containing the h2 (Playwright script, viewport 1440x900 dark, reduced motion) and read the images. Check: the line spans the gutters as ONE line at 1440; rail row-start text aligns with the h2's left edge; no badges anywhere; band unchanged; the rail's inset-from-viewport-edge (the deliberate deviation) reads as intentional against the full-bleed band. At 320 the line wraps to natural words with no clipping.

- [x] **Step 3: Re-mint all six landing baselines and verify twice**

Run from repo root (server already warm):
`rm e2e/visual/responsive.spec.ts-snapshots/landing-*-chromium-darwin.png e2e/visual/key-pages.spec.ts-snapshots/landing-chromium-darwin.png e2e/visual/key-pages.spec.ts-snapshots/landing-light-chromium-darwin.png`
`RUN_VISUAL=1 PW_PORT=3100 npx playwright test e2e/visual/key-pages.spec.ts e2e/visual/responsive.spec.ts -g landing --update-snapshots`
then the same command twice WITHOUT `--update-snapshots`.
Expected: mint exit 0, both verifies "6 passed".

- [x] **Step 4: Landing e2e**

Run: `PW_PORT=3100 npx playwright test e2e/landing.spec.ts`
Expected: 10 passed (the "shows world section with Deep Orbit" test asserts `/deep orbit/i` visible, which survives).

- [x] **Step 5: Stop the dev server**

Run: `lsof -ti :3100 -sTCP:LISTEN | xargs kill`

### Task 6: Docs and memory close-out

- [x] **Step 1: Mark the spec implemented**

In `docs/superpowers/specs/2026-09-01-five-worlds-one-section-design.md`, change `**Status:** Approved ...` to `**Status:** Implemented (2026-09-01)`.

- [x] **Step 2: Memory**

Append a dated entry to the session memory file (`session_2026_08_31_landing_headline_story_first.md`, the running log of the fluid-type redesign) recording: the section redesign, the cuts, the gutter arithmetic, verification results, uncommitted status. Update `MEMORY.md`'s line for that file with a short clause.

- [x] **Step 3: Report**

Report to the owner with the eyeball screenshots' findings and the uncommitted file list. NO commit.

---

## Execution notes (2026-09-01, inline execution)

- Task 1 Step 2 actual: 4 passed, 3 failed (not 5/2). The "keeps the
  flagship link" test also failed PRE-change, on "Found multiple elements
  with the text: Deep Orbit": the old intro paragraph rendered the name a
  second time. Consistent with the redesign being the fix; post-change it
  passes as a unique match.
- All other steps ran exactly as written: unit 7/7, page 20/20, typecheck
  clean, sweep hits all leave-alone (page.tsx hits are comments), mint
  clean, verify 6/6 twice, landing e2e 10/10, eyeballed at 1440 and 320.
- Nothing committed, per the house rule.
