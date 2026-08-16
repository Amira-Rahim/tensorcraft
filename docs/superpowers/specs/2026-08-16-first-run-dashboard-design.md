# First-Run Dashboard: Mission Dispatch

Date: 2026-08-16. Status: approved by owner (this session), two design
rounds. Companion fix (grid hardening) approved in the same session.

## Problem

A brand-new account's /dashboard is a wall of zeroed instruments: 0%
progress, 0-day streak, 0.0 score, 30 empty heatmap cells, a radar chart
reading "No activity yet" beside six 0.00 rows, 0/N bridges, empty patch
slots, and "Complete 3+ exercises to see trend". Five consecutive panels
report nothing. The one action that matters, starting lesson 1, is a
single button in the header.

Three layout defects compound it, for every account (the first two are
wide-screen scaling bugs, the third is an inconsistency):

1. The 30-day heatmap uses `repeat(10, 1fr)` square cells with no size
   cap, so a ~1700px main column renders ~170px cells: three rows of
   giant empty boxes.
2. The bridge grid uses `lg:grid-cols-8` with `aspect-square` tiles, so
   ~50 uncollected bridges render as roughly 1400 vertical pixels of
   `opacity-25` "?" tiles.
3. SkillGenome, BridgeCollection, and PatchCollection lack the 40px
   horizontal gutter every other dashboard panel has.

## Decision

Two independent changes:

### A. First-run variant (new)

When a user has zero completed lessons AND zero exercise attempts across
all worlds, /dashboard renders a dedicated full-bleed "mission dispatch"
view instead of the analytics dashboard. One completed lesson or one
recorded attempt exits the variant permanently. The trigger is a pure
function of data page.tsx already fetches (progress records, exercise
attempts). No new queries.

The variant is one cinematic panel under the global nav. It omits the
module sidebar, stats strip, heatmap, skill genome, bridges, patches,
learning trend, world cards, recent activity, and the streak toast
(which cannot fire before activity exists).

Contents, top to bottom:

- Ground: the world's dashboard location plate
  (`surfacePlateSrc(world, "dashboard")`, deep-orbit resolves to
  `/locations/deep-orbit/dashboard-station.webp`) rendered full-bleed
  through the established ArtPlate pattern: `bleed` prop, `tc-art-scrim`
  legibility veil, copy in `tc-on-art` tokens (precedent: /worlds hero
  card). On art failure ArtPlate renders nothing and the section keeps
  the dark surface and grid background; worlds without art get the same
  art-less render.
- Dispatch briefing in the ship's system voice (mono, transmission-log
  register). Canon constraint: cast members never address the learner
  directly (story bible, operator-of-record rule), so no character
  speaks here.
  - Kicker: `ARCHIMEDES · MONITORING STATION`
  - Status line: `SIGNAL: SECTOR 7-G · 64 CHANNELS · LIVE` (canon
    facts; rendered only for deep-orbit, other worlds skip the line)
  - Operator line: `OPERATOR: {displayName}` in the same status block
    (system voice, so the operator-of-record canon rule is not
    violated; this is where the displayName prop is consumed)
  - H1 from live content data: module 1 name, e.g.
    `MODULE 1: FOUNDATIONS: TENSORS & DATA`
  - Sub: `Lesson 1 of 5 · ~12 min · Introduction to Tensors` (computed,
    not hardcoded)
  - CTA: `Start First {terminology.lesson} →` linking to module 1
    lesson 1. Module 1 is free; the paywall cannot intercept this path.
- Compact stat strip, one row, three mono cells, all computed:
  streak starts today; first patch after {module 1 lesson count}
  lessons; 0 / {total lessons} lessons. Patches are launched content,
  so nothing unbuyable is promised.
- Instruments line, one sentence: activity, skill genome, bridges, and
  patches switch on after the first completed lesson.

All copy passes docs/writing-quality-rubric.md. No em dashes anywhere.
No colored left accent bars.

### B. Grid hardening (full dashboard, all accounts)

1. Heatmap cells: fixed size (~18px, GitHub density) with the grid left
   at its natural width instead of `1fr` viewport fractions.
2. Bridge tiles: fixed ~44px via `repeat(auto-fill, ...)`.
3. Restore the 40px horizontal gutter on SkillGenome, BridgeCollection,
   and PatchCollection.

## Architecture

- New: `apps/web/app/dashboard/first-run-view.tsx`, a server component
  (CSS hovers only; ArtPlate is its own client island) plus test file.
  Props: displayName, worldName, worldSlug, plateSrc, module 1 briefing
  info (reuses the currentModule shape), resumeUrl, module1LessonCount,
  totalLessons.
- Modified: `apps/web/app/dashboard/page.tsx` computes `isFirstRun`
  after building module info and branches before assembling analytics
  props (bridges, heatmap, world cards, genome consumption stay with
  the full view).
- Modified: `dashboard-view.tsx` (heatmap sizing, gutters),
  `bridge-collection.tsx` (tile sizing).
- No schema, API, or navigation changes.

## Testing

- page.test.tsx: 0 completed + 0 attempts renders the first-run view;
  1 completed lesson renders the full dashboard; 0 completed but 1
  attempt renders the full dashboard.
- first-run-view.test.tsx: dispatch renders with and without plateSrc;
  CTA href targets module 1 lesson 1; stat strip shows computed counts;
  none of the analytics panels' test ids are present; axe pass.
- Existing dashboard tests updated only where grid sizing changes
  assertions or snapshots.
- Visual baselines: delete affected PNGs before re-minting (stale
  under-tolerance trap, 2026-08-15).
- Full battery green before reporting done.

## Out of scope

Per-panel progressive disclosure for accounts with partial data (the
full dashboard still shows zeroed panels until data arrives; the owner
chose the first-run variant over per-panel gating). Documented here so
a future pass knows the boundary was deliberate.
