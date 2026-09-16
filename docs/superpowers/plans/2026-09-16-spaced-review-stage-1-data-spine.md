# Spaced Review, Stage 1: Data Spine, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **EXECUTED 2026-09-16.** All 8 tasks complete in the worktree at
> `~/.config/superpowers/worktrees/tensorcraft/spaced-review-stage-1`
> (branch `feature/spaced-review-stage-1`). Migration 061 is APPLIED to the
> live database. Tests went 2485 to 2621. Nothing is committed.
>
> Three things were done differently from what is written below, each for a
> reason recorded in the code: the quota in Task 6 is applied AFTER the
> entitlement gate rather than before (Task 6 step 4 still says
> `selectDue(rows, now, limit)`), both enqueue paths take
> `promptIndices: number[]` rather than a count, and the free-table filter in
> Task 7 also scopes on `worldId`.

**Goal:** Build the scheduling, storage, and content-extraction layer for spaced review, fully tested, with nothing user-visible shipped.

**Architecture:** One SM-2 implementation in `packages/shared` as pure functions, with three thin adapters around it: `localStorage` for guests, an RLS-scoped server read for signed-in learners, and an authenticated Hono route for writes. Recall prompt text is extracted from MDX at build time into a derived velite field and resolved server-side, never by client-supplied key.

**Tech Stack:** TypeScript, vitest, velite 0.4.0, Supabase Postgres with RLS, Hono, Next.js App Router.

**Spec:** `docs/superpowers/specs/2026-09-15-spaced-review-design.md`. Read it before starting. This plan implements its "Staging" item 1 only. Stage 2 (the card, the warm-up, Briefing placement, guest merge, outbox) is a separate plan.

---

## Two standing rules for this plan

**1. Never commit.** `CLAUDE.md` in this repo says: do not run `git add`, `git commit`, or `git push` unless explicitly asked. This overrides the usual "commit frequently" step in the plan format. Each task ends with a **Checkpoint** step instead: stop, report what changed, and let the owner commit. Do not "fix" this by adding commit steps.

**2. Never use the em dash character (U+2014).** Repo-wide ban, CI-enforced by `packages/content/__tests__/em-dash-ban.test.ts`. Applies to code, comments, tests, and SQL. Use a comma, colon, period, or parentheses.

---

## File structure

| File | Responsibility |
| --- | --- |
| `packages/shared/src/review-schedule.ts` | Pure SM-2 math and due selection. No I/O, no storage, no React |
| `packages/shared/src/review-types.ts` | `ReviewItem`, `ReviewOutcome`, `ScheduleResult`, `ReviewStore` |
| `packages/content/src/parse-recall-prompts.ts` | Extract `{ index, question, answer }` from raw lesson MDX |
| `packages/supabase/migrations/061_review_queue.sql` | Table, index, RLS. Plus its `.down.sql` |
| `apps/web/lib/review-store-guest.ts` | `localStorage` adapter, mirrors `guest-progress.ts` |
| `apps/web/lib/review-store-server.ts` | RLS-scoped read plus the entitlement filter |
| `apps/web/lib/free-recall-prompts.ts` | The free module's prompts, for guest key lookup |
| `apps/api/src/routes/review.ts` | Authenticated writes |

Types live in their own file because `review-schedule.ts`, both web adapters, and the API route all import them, and a cycle through the implementation file is easy to create by accident.

**Two files the spec names that are deliberately NOT in stage 1:**

- `apps/web/lib/review-store-api.ts`, the client-side fetch wrapper for writes. Nothing calls it until the card exists, so it lands in stage 2 beside its caller. Do not hunt for it here.
- Nothing implements the `ReviewStore` interface yet. It is a stage-2 contract, written down now so both adapters are built against one shape. Task 5's guest functions are deliberately synchronous and take an explicit `now`, which makes them trivially testable; the async `ReviewStore` shape wraps them in stage 2. Do not contort the guest adapter to satisfy the interface in this stage.

---

## Task 1: Shared types and due selection

**Files:**

- Create: `packages/shared/src/review-types.ts`
- Create: `packages/shared/src/review-schedule.ts`
- Create: `packages/shared/src/review-schedule.test.ts`
- Modify: `packages/shared/src/index.ts`

- [x] **Step 1: Write the types**

```ts
// packages/shared/src/review-types.ts

/** What the learner reported after a retrieval attempt. */
export type ReviewOutcome = "got-it" | "review" | "bailed";

/** One schedulable recall prompt. Keys only: never carries question text. */
export interface ReviewItem {
  worldId: string;
  moduleId: string;
  lessonId: string;
  /** Position of the prompt within its lesson, 0-based. Part of the key. */
  promptIndex: number;
  pulls: number;
  successes: number;
  /** ISO 8601, or null if never reviewed. */
  lastReviewedAt: string | null;
  /** ISO 8601. */
  nextReviewAt: string;
}

/** A ReviewItem with its text resolved. Built server-side, never from a client key. */
export interface ResolvedReviewItem extends ReviewItem {
  question: string;
  answer: string;
}

export interface ScheduleResult {
  nextReviewAt: string;
  pulls: number;
  successes: number;
}

export interface ReviewStore {
  getDue(worldId: string, limit: number): Promise<ReviewItem[]>;
  record(item: ReviewItem, outcome: ReviewOutcome): Promise<void>;
}
```

- [x] **Step 2: Write the failing test for `selectDue`**

```ts
// packages/shared/src/review-schedule.test.ts
import { describe, it, expect } from "vitest";
import { selectDue } from "./review-schedule";
import type { ReviewItem } from "./review-types";

const NOW = new Date("2026-09-16T12:00:00.000Z");

function item(over: Partial<ReviewItem> = {}): ReviewItem {
  return {
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "normalization",
    promptIndex: 0,
    pulls: 0,
    successes: 0,
    lastReviewedAt: null,
    nextReviewAt: "2026-09-15T12:00:00.000Z",
    ...over,
  };
}

describe("selectDue", () => {
  it("excludes items not yet due", () => {
    const future = item({ nextReviewAt: "2026-09-17T12:00:00.000Z" });
    expect(selectDue([future], NOW, 2)).toEqual([]);
  });

  it("includes an item due exactly now", () => {
    const exact = item({ nextReviewAt: NOW.toISOString() });
    expect(selectDue([exact], NOW, 2)).toHaveLength(1);
  });

  it("orders most overdue first", () => {
    const older = item({ lessonId: "a", nextReviewAt: "2026-09-10T12:00:00.000Z" });
    const newer = item({ lessonId: "b", nextReviewAt: "2026-09-15T12:00:00.000Z" });
    expect(selectDue([newer, older], NOW, 2).map((i) => i.lessonId)).toEqual(["a", "b"]);
  });

  it("breaks ties on failure rate, weakest first", () => {
    const strong = item({ lessonId: "strong", pulls: 4, successes: 4 });
    const weak = item({ lessonId: "weak", pulls: 4, successes: 1 });
    expect(selectDue([strong, weak], NOW, 2).map((i) => i.lessonId)).toEqual(["weak", "strong"]);
  });

  it("treats an unpulled item as maximum failure rate", () => {
    const pulled = item({ lessonId: "pulled", pulls: 2, successes: 2 });
    const fresh = item({ lessonId: "fresh", pulls: 0, successes: 0 });
    expect(selectDue([pulled, fresh], NOW, 2).map((i) => i.lessonId)).toEqual(["fresh", "pulled"]);
  });

  it("caps at the limit", () => {
    const many = [1, 2, 3, 4].map((n) => item({ lessonId: `l${n}` }));
    expect(selectDue(many, NOW, 2)).toHaveLength(2);
  });

  it("is stable for identical items so the same two do not shuffle per render", () => {
    const a = item({ lessonId: "a" });
    const b = item({ lessonId: "b" });
    expect(selectDue([a, b], NOW, 1)).toEqual(selectDue([a, b], NOW, 1));
  });
});
```

- [x] **Step 3: Run it and confirm it fails**

Run: `pnpm vitest run packages/shared/src/review-schedule.test.ts`
Expected: FAIL, "Failed to resolve import ./review-schedule".

- [x] **Step 4: Implement `selectDue` only**

```ts
// packages/shared/src/review-schedule.ts
import type { ReviewItem } from "./review-types";

/** An item never pulled counts as fully unlearned, so it sorts ahead of a pulled one. */
function failureRate(item: ReviewItem): number {
  if (item.pulls <= 0) return 1;
  return 1 - item.successes / item.pulls;
}

/**
 * Due items, most overdue first, ties broken by failure rate (weakest first).
 * Deliberately NOT the epsilon-greedy bandit from the deleted migration 027:
 * see the spec's "Departures" item 1. Selection here is plain and explainable.
 */
export function selectDue(
  items: ReviewItem[],
  now: Date,
  limit: number,
): ReviewItem[] {
  const nowMs = now.getTime();
  return items
    .filter((i) => Date.parse(i.nextReviewAt) <= nowMs)
    .sort((a, b) => {
      const byDue = Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt);
      if (byDue !== 0) return byDue;
      return failureRate(b) - failureRate(a);
    })
    .slice(0, Math.max(limit, 0));
}
```

- [x] **Step 5: Run and confirm green**

Run: `pnpm vitest run packages/shared/src/review-schedule.test.ts`
Expected: PASS, 7 tests.

- [x] **Step 6: Export from the package barrel**

Add to `packages/shared/src/index.ts`, following the existing named-export style:

```ts
export { selectDue, nextInterval } from "./review-schedule";
export type {
  ReviewItem,
  ResolvedReviewItem,
  ReviewOutcome,
  ScheduleResult,
  ReviewStore,
} from "./review-types";
```

`nextInterval` does not exist yet, so typecheck fails until Task 2. That is expected and Task 2 closes it.

- [x] **Step 7: Checkpoint**

Report: files created, test count, and that `pnpm typecheck` is red pending Task 2. Do not commit.

---

## Task 2: `nextInterval`, OWNER-AUTHORED

**This task is a blocking checkpoint, not a task to complete autonomously.**

**Files:**

- Modify: `packages/shared/src/review-schedule.ts`
- Modify: `packages/shared/src/review-schedule.test.ts`

The interval policy carries the pedagogy of the whole feature, and the spec's "Open decision for the owner" assigns it to the owner deliberately. An agent must not choose these numbers.

- [x] **Step 1: Scaffold the signature and leave it unimplemented**

```ts
/**
 * The interval policy. OWNER-AUTHORED: see the spec's "Open decision for
 * the owner". Four choices live in this function:
 *   1. the multiplier applied to the current interval on a success
 *   2. the interval a failure resets to
 *   3. whether "bailed" is treated the same as "review"
 *   4. the ceiling that stops an item drifting to a six-month interval
 *
 * For reference, deleted migration 027 used 2.5x on success and a flat
 * one-day reset on failure, with no ceiling. That is textbook SM-2 and is a
 * defensible starting point, not a default this function should assume.
 */
export function nextInterval(
  item: ReviewItem,
  outcome: ReviewOutcome,
  now: Date,
): ScheduleResult {
  throw new Error("nextInterval: owner-authored, not yet implemented");
}
```

- [x] **Step 2: STOP and ask the owner**

Present the four choices above and ask for the numbers. Do not proceed past this step without them. Do not pick "reasonable defaults" and continue: the spec calls this a plan dependency precisely so it lands as a checkpoint rather than a silent guess.

- [x] **Step 3: Owner writes the function body**

The owner writes roughly 8 lines. Offer the current-interval helper if useful:

```ts
const lastMs = item.lastReviewedAt ? Date.parse(item.lastReviewedAt) : null;
const currentIntervalMs = lastMs ? Math.max(now.getTime() - lastMs, DAY_MS) : DAY_MS;
```

- [x] **Step 4: Write the test table from the owner's numbers**

Cases to cover, with the owner's expected values filled in: fresh item first success; repeated success (compounding); `review` after successes; `bailed`; the ceiling; and that `pulls` and `successes` increment correctly for each outcome (a `bailed` must not increment `successes`).

- [x] **Step 5: Run the full shared suite**

Run: `pnpm vitest run packages/shared/`
Expected: PASS.

- [x] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS, closing the Task 1 red.

- [x] **Step 7: Checkpoint**

---

## Task 3: Extract recall prompts at build time

**Files:**

- Create: `packages/content/src/parse-recall-prompts.ts`
- Create: `packages/content/src/parse-recall-prompts.test.ts`
- Create: `packages/content/__tests__/recall-prompt-extraction.test.ts`
- Modify: `packages/content/velite.config.ts`

- [x] **Step 1: Write the failing parser test**

The two hazard cases below are real prompts from the corpus. A `<RecallPrompt[^>]*/>` character class loses both, which is the entire reason this test exists.

```ts
// packages/content/src/parse-recall-prompts.test.ts
import { describe, it, expect } from "vitest";
import { parseRecallPrompts } from "./parse-recall-prompts";

describe("parseRecallPrompts", () => {
  it("returns an empty array when there are no prompts", () => {
    expect(parseRecallPrompts("## Just a heading\n\nSome prose.")).toEqual([]);
  });

  it("extracts a single-line prompt", () => {
    const raw = `<RecallPrompt question="What is ReLU?" answer="max(0, x)." />`;
    expect(parseRecallPrompts(raw)).toEqual([
      { index: 0, question: "What is ReLU?", answer: "max(0, x)." },
    ]);
  });

  it("extracts a multi-line prompt", () => {
    const raw = [
      "<RecallPrompt",
      '  question="Why does it collapse?"',
      '  answer="Stacked linear maps multiply out to one matrix."',
      "/>",
    ].join("\n");
    expect(parseRecallPrompts(raw)[0].question).toBe("Why does it collapse?");
  });

  it("survives a greater-than sign inside an attribute value", () => {
    // anomaly-detection/01-normal-vs-anomalous.mdx carries |z| > 3
    const raw = `<RecallPrompt question="What does |z| > 3 mean?" answer="Beyond 3 sigma." />`;
    expect(parseRecallPrompts(raw)).toEqual([
      { index: 0, question: "What does |z| > 3 mean?", answer: "Beyond 3 sigma." },
    ]);
  });

  it("survives an arrow function inside an attribute value", () => {
    // browser-runtimes/03-model-loading.mdx carries r => r.json()
    const raw = `<RecallPrompt question="What does r => r.json() do?" answer="Parses the body." />`;
    expect(parseRecallPrompts(raw)[0].question).toContain("r => r.json()");
  });

  it("indexes multiple prompts in source order", () => {
    const raw = [
      `<RecallPrompt question="First?" answer="A." />`,
      "Some prose between them.",
      `<RecallPrompt question="Second?" answer="B." />`,
    ].join("\n\n");
    expect(parseRecallPrompts(raw).map((p) => [p.index, p.question])).toEqual([
      [0, "First?"],
      [1, "Second?"],
    ]);
  });

  it("drops a prompt missing an answer, so the count gate catches it", () => {
    const raw = `<RecallPrompt question="Orphan?" />`;
    expect(parseRecallPrompts(raw)).toEqual([]);
  });
});
```

- [x] **Step 2: Run it and confirm it fails**

Run: `pnpm vitest run packages/content/src/parse-recall-prompts.test.ts`
Expected: FAIL, unresolved import.

- [x] **Step 3: Implement the parser**

```ts
// packages/content/src/parse-recall-prompts.ts

export interface ParsedRecallPrompt {
  index: number;
  question: string;
  answer: string;
}

/**
 * Pull <RecallPrompt question="..." answer="..." /> out of raw lesson MDX.
 *
 * Non-greedy and NOT a [^>] character class: two prompts in the corpus carry
 * a ">" inside a quoted attribute value (|z| > 3 in anomaly-detection/01,
 * r => r.json() in browser-runtimes/03), and a character class silently
 * loses both. Verified against all 80 deep-orbit prompts on 2026-09-15.
 *
 * All 80 pass `answer` as a string prop; none pass JSX children. A prompt
 * that parses to neither shape is dropped here and caught by the count gate
 * in __tests__/recall-prompt-extraction.test.ts, which is the point: a
 * parser that silently matches 79 of 80 is otherwise invisible.
 */
const TAG = /<RecallPrompt\b[\s\S]*?\/>/g;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

export function parseRecallPrompts(raw: string): ParsedRecallPrompt[] {
  const out: ParsedRecallPrompt[] = [];
  let index = 0;
  for (const match of raw.matchAll(TAG)) {
    const tag = match[0];
    const question = attr(tag, "question");
    const answer = attr(tag, "answer");
    if (question !== null && answer !== null) {
      out.push({ index, question, answer });
    }
    index += 1;
  }
  return out;
}
```

- [x] **Step 4: Run and confirm green**

Run: `pnpm vitest run packages/content/src/parse-recall-prompts.test.ts`
Expected: PASS, 7 tests.

- [x] **Step 5: Wire it into the velite build**

In `packages/content/velite.config.ts`, add `rawBody: s.raw(),` to the lesson schema object alongside `body: s.mdx()`, then extend the existing transform. `rawBody` is declared only so the transform can read it and is destructured away so it never reaches the built JSON:

```ts
.transform((data) => {
  const { rawBody, ...rest } = data;
  return {
    ...rest,
    glossaryTerms: glossaryTermsInCompiledBody(data.body, GLOSSARY),
    recallPrompts: parseRecallPrompts(rawBody),
  };
});
```

Add the import at the top: `import { parseRecallPrompts } from "./src/parse-recall-prompts";`

- [x] **Step 6: Rebuild the content and verify the field exists**

Run: `cd packages/content && pnpm run build:content`

Then verify **from the repo root**, and note the count must be 80. Velite emits
one file per collection (`lessons.json`, `exercises.json`, `modules.json`),
not a combined `index.json`, which is why the gates read the per-collection
file directly:

```bash
node -e "const lessons=require('./packages/content/.velite/lessons.json'); const n=lessons.reduce((s,l)=>s+(l.recallPrompts?.length??0),0); console.log('lessons:',lessons.length,'prompts:',n); console.log('rawBody leaked:', 'rawBody' in lessons[0]);"
```

Expected: `lessons: 56 prompts: 80` and `rawBody leaked: false`.

**Do not skip the rebuild.** Repo rule: the validator grades the velite BUILD, not the YAML or MDX source. A gate run against a stale build certifies the old text.

- [x] **Step 7: Write the count gate**

```ts
// packages/content/__tests__/recall-prompt-extraction.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";

/**
 * Every <RecallPrompt> in a built lesson's source must survive into its
 * built `recallPrompts` array (2026-09-16).
 *
 * Scoped to BUILT_WORLD_DIRS on purpose. terra-grid/ab-testing/05 carries 3
 * prompts and is not in the velite build, so an unscoped scan compares 83
 * raw tags against 80 built entries and is red on day one.
 */
```

Walk each built world's lesson `.mdx` files, count occurrences of the literal `<RecallPrompt`, and assert that number equals the length of that lesson's `recallPrompts` in the velite output. Follow the file-reading style already used in `packages/content/__tests__/lesson-answer-leak.test.ts`.

- [x] **Step 8: Run the gate**

Run: `pnpm vitest run packages/content/__tests__/recall-prompt-extraction.test.ts`
Expected: PASS, with 56 assertions or one aggregate.

- [x] **Step 9: Run the whole content suite for regressions**

Run: `pnpm vitest run packages/content/`
Expected: PASS. The glossary rail contract test is the one most likely to notice a transform change.

- [x] **Step 10: Checkpoint**

---

## Task 4: Migration 061

**Files:**

- Create: `packages/supabase/migrations/061_review_queue.sql`
- Create: `packages/supabase/migrations/061_review_queue.down.sql`

Read `packages/supabase/migrations/CONVENTIONS.md` first. The five rules are mandatory for every migration from 042 up: transaction wrapped, idempotent, records its version, paired down-migration, never edit an applied migration.

- [x] **Step 1: Write the migration**

```sql
-- Tensorcraft: Review queue for spaced recall (restores 027 in changed form).
--
-- Migration 033 dropped the original review_queue, its SM-2-lite RPCs, and
-- the epsilon-greedy selector on 2026-06-01. This restores the table only.
-- The scheduling math now lives in packages/shared/src/review-schedule.ts so
-- that guests (localStorage) and signed-in learners (Postgres) run one
-- implementation. See docs/superpowers/specs/2026-09-15-spaced-review-design.md.
--
-- Differences from 027, all deliberate:
--   theme_id -> world_id (migration 058), and prompt_index joins the key so
--   each recall prompt schedules independently: 20 deep-orbit lessons carry
--   two prompts and two carry three.
--   No bandit: review_queue_epsilon(), the selector, and was_explored stay
--   deleted until Terra Grid (world 4) launches and the algorithm is teachable.
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped, idempotent, records its version, paired .down.sql.

begin;

create table if not exists public.review_queue (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  world_id         text not null,
  module_id        text not null,
  lesson_id        text not null,
  prompt_index     integer not null default 0 check (prompt_index >= 0),
  pulls            integer not null default 0 check (pulls >= 0),
  successes        integer not null default 0 check (successes >= 0 and successes <= pulls),
  last_reviewed_at timestamptz,
  next_review_at   timestamptz not null,
  created_at       timestamptz not null default now(),

  primary key (user_id, world_id, lesson_id, prompt_index)
);

-- getDue is the only hot read. NOT partial on `next_review_at <= now()` as
-- 027 was: now() is not immutable, so Postgres rejects it in an index predicate.
create index if not exists idx_review_queue_due
  on public.review_queue (user_id, world_id, next_review_at);

alter table public.review_queue enable row level security;

-- SELECT for the server component's read.
drop policy if exists "Users can view own review queue" on public.review_queue;
create policy "Users can view own review queue"
  on public.review_queue for select
  using (auth.uid() = user_id);

-- INSERT and UPDATE are REQUIRED, not optional. apps/api writes via
-- getSupabaseServerClient(token), which is built on the service-role key but
-- spreads the caller's JWT as an Authorization header, so PostgREST resolves
-- the role from that JWT and RLS is enforced. With no write policy every
-- write is silently denied.
--
-- This exact mistake has already shipped here once: migration 013 recreated
-- skill_events carrying only its SELECT policy, and migration 041 exists to
-- repair it. Its comment: "With no INSERT policy, every write is denied ...
-- Nothing surfaced this because emitSkillEvent had zero call sites."
-- Compare exercise_attempts, which carries this policy at 004:25 for the
-- identical client factory and works.
drop policy if exists "Users can insert own review queue" on public.review_queue;
create policy "Users can insert own review queue"
  on public.review_queue for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own review queue" on public.review_queue;
create policy "Users can update own review queue"
  on public.review_queue for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.schema_migrations (version, name)
values (61, 'review_queue')
on conflict (version) do nothing;

commit;
```

- [x] **Step 2: Write the down migration**

```sql
-- Reverses 061_review_queue.sql.
begin;

drop policy if exists "Users can view own review queue" on public.review_queue;
drop policy if exists "Users can insert own review queue" on public.review_queue;
drop policy if exists "Users can update own review queue" on public.review_queue;
drop index if exists public.idx_review_queue_due;
drop table if exists public.review_queue cascade;

delete from public.schema_migrations where version = 61;

commit;
```

- [x] **Step 3: Check the ledger before applying**

Run: `pnpm migrate:status`
Expected: 061 listed as pending.

- [x] **Step 4: STOP, applying migrations is the owner's call**

  **This step blocks Tasks 6 and 8** (found 2026-09-16, during execution).
  Both issue `supabase.from("review_queue")` against a `createClient<Database>`
  client, and `review_queue` does not exist in
  `packages/supabase/src/types.ts` until `pnpm gen:types` runs, which needs
  the migration applied to the live database. Neither task can pass typecheck
  before then.

  Tasks 5 and 7 are NOT blocked: the guest store touches only `localStorage`
  and the free-prompt table reads only the velite build. Run those while the
  migration waits.

Do not apply this against any database. Report that 061 is written and pending, and let the owner apply it. Migration 058's history in this repo (web auto-deployed before the migration was applied, causing a production outage) is why this is not an agent decision.

- [x] **Step 5: Regenerate Supabase types after the owner applies it**

Run: `pnpm gen:types`

Needs live database credentials, which live in `apps/api/.env`. If the command stalls or errors on a missing env var, that is where to look rather than a bug in the script.
Expected: `review_queue` appears in `packages/supabase/src/types.ts`.

- [x] **Step 6: Checkpoint**

---

## Task 5: Guest store

**Files:**

- Create: `apps/web/lib/review-store-guest.ts`
- Create: `apps/web/lib/review-store-guest.test.ts`

Mirror `apps/web/lib/guest-progress.ts` exactly: `"use client"`, a `tc_*_v1` storage key, and every `localStorage` access wrapped in try/catch that degrades to empty rather than throwing.

- [x] **Step 1: Write the failing test, including the throwing-localStorage case**

```ts
// apps/web/lib/review-store-guest.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  enqueueGuestReviews,
  getGuestDue,
  recordGuestReview,
} from "./review-store-guest";

const NOW = new Date("2026-09-16T12:00:00.000Z");

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("review-store-guest", () => {
  it("returns nothing when the store is empty", () => {
    expect(getGuestDue("deep-orbit", 2, NOW)).toEqual([]);
  });

  it("enqueues one item per prompt index", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", 2);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    expect(getGuestDue("deep-orbit", 5, tomorrow).map((i) => i.promptIndex)).toEqual([0, 1]);
  });

  it("does not resurface an item before it is due", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", 1);
    expect(getGuestDue("deep-orbit", 5, NOW)).toEqual([]);
  });

  it("never resets an existing schedule on re-enqueue", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", 1);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    const before = getGuestDue("deep-orbit", 5, tomorrow)[0].nextReviewAt;
    vi.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", 1);
    expect(getGuestDue("deep-orbit", 5, tomorrow)[0].nextReviewAt).toBe(before);
  });

  it("degrades to empty when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: blocked site data");
    });
    expect(() => getGuestDue("deep-orbit", 2, NOW)).not.toThrow();
    expect(getGuestDue("deep-orbit", 2, NOW)).toEqual([]);
  });

  it("does not throw when a write is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => enqueueGuestReviews("deep-orbit", "foundations", "x", 1)).not.toThrow();
  });
});
```

- [x] **Step 2: Run and confirm it fails**

Run: `pnpm vitest run apps/web/lib/review-store-guest.test.ts`
Expected: FAIL, unresolved import.

- [x] **Step 3: Implement it**

Key: `tc_guest_reviews_v1`. Storage shape: `Record<"world/module/lesson/index", { pulls, successes, lastReviewedAt, nextReviewAt }>`, matching the flat-map style `guest-progress.ts` uses. `enqueueGuestReviews` must be a no-op for a key that already exists, which is the localStorage equivalent of `on conflict do nothing`. `getGuestDue` rehydrates keys into `ReviewItem`s and delegates ordering to `selectDue` from `@tensorcraft/shared`. `recordGuestReview` delegates to `nextInterval` and writes the result back. No scheduling math in this file.

- [x] **Step 4: Run and confirm green**

Run: `pnpm vitest run apps/web/lib/review-store-guest.test.ts`
Expected: PASS, 6 tests.

- [x] **Step 5: Checkpoint**

---

## Task 6: Server read and the entitlement filter

**Files:**

- Create: `apps/web/lib/review-store-server.ts`
- Create: `apps/web/lib/review-store-server.test.ts`

**This is the security boundary of the whole feature.** 74 of Deep Orbit's 80 prompts are paid content. This module is the only thing between a stale `review_queue` row and paid prompt text.

- [x] **Step 1: Read the spec section first**

`docs/superpowers/specs/2026-09-15-spaced-review-design.md`, section D, "The filter is `canAccessWorld`, not the page's `purchased` value". An earlier draft of the spec got this wrong and the reason is subtle, so read it before writing code.

- [x] **Step 2: Write the failing test, entitlement cases first**

```ts
// apps/web/lib/review-store-server.test.ts

describe("resolveDueForUser", () => {
  it("resolves a free-module key for an unentitled learner", async () => {});

  it("drops a paid key for an unentitled learner", async () => {});

  it("resolves a paid key for an entitled learner", async () => {});

  // The case an earlier spec draft got wrong: filtering on the page's
  // `purchased` value would pass here, because purchased is a hardcoded
  // true on every module-1 lesson (page.tsx:137).
  it("drops a refunded learner's paid keys while they sit on a module-1 lesson", async () => {});

  it("propagates an entitlement lookup fault instead of denying", async () => {
    // getEntitledWorlds throws by design so a transient DB fault never
    // silently shows a paying customer the paywall. Do not catch per key.
  });

  it("drops a key whose lesson or prompt index no longer exists in the build", async () => {});
});
```

Fill in each body with a mocked Supabase client and a mocked `canAccessWorld`. Follow the mocking style in `apps/api/src/routes/__tests__/`.

- [x] **Step 3: Run and confirm it fails**

Run: `pnpm vitest run apps/web/lib/review-store-server.test.ts`

- [x] **Step 4: Implement**

Signature: `resolveDueForUser(supabase, userId, worldId, limit, now): Promise<ResolvedReviewItem[]>`.

Order of operations, and the order matters:

1. Select the user's `review_queue` rows for `worldId` with the cookie-bound RLS-scoped client the page already holds. Do not use the service role.
2. `selectDue(rows, now, limit)`.
3. Compute entitlement **once** for the request: `const entitled = await canAccessWorld(userId, worldId)`. Let a fault throw. Do not wrap per key.
4. Keep an item when its module `order === 1` or `entitled` is true.
5. Resolve each surviving key to `{ question, answer }` from the velite build, dropping any key whose lesson or `promptIndex` no longer exists. Content is edited; a stale row must not crash a page render.

- [x] **Step 5: Run and confirm green**

Run: `pnpm vitest run apps/web/lib/review-store-server.test.ts`
Expected: PASS, 6 tests.

- [x] **Step 6: Checkpoint, and flag the entitlement tests explicitly in the report**

---

## Task 7: Guest free-module prompt table

**Files:**

- Create: `apps/web/lib/free-recall-prompts.ts`
- Create: `apps/web/lib/free-recall-prompts.test.ts`

The server cannot see a guest's `localStorage`, so it inlines the free module's
prompts and the client matches its own queue keys against that table. Per spec
section D, this table **is** the guest half of the security boundary, and it is
the stronger of the two safety arguments: a guest key naming paid content
matches nothing, whatever the queue contains. Task 6 built the signed-in half.
Without this task stage 1 ships one half of a boundary.

- [x] **Step 1: Write the failing test**

```ts
// apps/web/lib/free-recall-prompts.test.ts
import { describe, it, expect } from "vitest";
import { FREE_RECALL_PROMPTS, lookupFreePrompt } from "./free-recall-prompts";

describe("FREE_RECALL_PROMPTS", () => {
  it("contains exactly the free module's prompts", () => {
    expect(FREE_RECALL_PROMPTS).toHaveLength(6);
  });

  it("contains nothing outside the free module", () => {
    // The whole safety argument. If a paid module ever leaks in here, a
    // hand-edited guest localStorage key resolves to paid prompt text.
    const modules = new Set(FREE_RECALL_PROMPTS.map((p) => p.moduleId));
    expect([...modules]).toEqual(["foundations"]);
  });

  it("resolves a free key", () => {
    const first = FREE_RECALL_PROMPTS[0];
    expect(lookupFreePrompt(first.lessonId, first.promptIndex)).toEqual(first);
  });

  it("returns null for a paid key, however well-formed", () => {
    expect(lookupFreePrompt("activation-functions", 0)).toBeNull();
  });

  it("returns null for a free lesson with an out-of-range prompt index", () => {
    const first = FREE_RECALL_PROMPTS[0];
    expect(lookupFreePrompt(first.lessonId, 99)).toBeNull();
  });
});
```

- [x] **Step 2: Run and confirm it fails**

Run: `pnpm vitest run apps/web/lib/free-recall-prompts.test.ts`

- [x] **Step 3: Implement**

**This file is server-only. It must not carry `"use client"`.** Velite's
`index.js` re-exports `lessons.json` as a single JSON default, and that file is
1,150,097 bytes. A `"use client"` module importing it ships 1.1 MB to the
browser. No client component in `apps/web` imports `@tensorcraft/content`
today, and this must not be the first. Per spec section D the server builds the
table and the stage-2 consumer receives it as serialized props. Stage 1 ships
no consumer, so nothing here can regress, which is exactly why it has to be
written down now: the stage-2 reviewer will not be reading this reasoning.

**Derive the module slug through the `modules` collection, not the `lessons`
one.** Both collections have an `order` field and they mean different things.
A lesson's `order` is its position within its module, so
`lessons.filter(l => l.order === 1)` returns 11 lessons spanning all 11 modules,
`neural-networks` and `capstone` included. That is paid text in a table whose
only job is to hold free text. The correct derivation:

```ts
const freeModule = modules.find(
  (m) => m.worldId === DEFAULT_WORLD && m.order === 1,
);
// Throw, never fall back to an empty table. An empty table makes every guest
// lookup return null, which is indistinguishable from "nothing due" and would
// hide a broken security boundary. `strict: true` in
// packages/config/typescript/base.json also makes the bare dereference a
// TS2532, so this guard is required to compile either way.
if (!freeModule) {
  throw new Error(`No module with order 1 in world ${DEFAULT_WORLD}`);
}

export const FREE_RECALL_PROMPTS = lessons
  .filter((l) => l.moduleId === freeModule.slug)
  .flatMap((l) =>
    (l.recallPrompts ?? []).map(({ index, ...rest }) => ({
      ...rest,
      // Rename on the way out: parseRecallPrompts emits `index`, but
      // `promptIndex` is the key name used by ReviewItem, the guest store and
      // Task 6. This table must not be the one surface that spells it
      // differently, because stage 2's whole job is joining them.
      promptIndex: index,
      lessonId: l.slug,
      moduleId: l.moduleId,
    })),
  );
```

`l.slug` is the correct lesson identifier and the only one that works:
`lesson-steps.tsx:663` passes `lesson.slug` to `markLessonCompleted`, which
writes it as `world_progress.lesson_id`, so the free table's keys match a guest
queue key with no translation. `moduleId` is carried only so the Step 1 safety
test can assert the table holds nothing outside the free module; the lookup
itself keys on `(lessonId, promptIndex)`.

Derive it, never hand-copy the text: a hand-maintained copy drifts from the MDX
the first time a prompt is edited. `lookupFreePrompt` returns `null` for
anything not in the table.

Deriving from module `order` rather than the literal `"foundations"` is
deliberate, so the table follows the free module if it ever moves. Note that
this is *not* the pattern `WORLD_CONTENT.freeModuleSlug` uses: `constants.ts:161`
hardcodes the slug and `constants.test.ts:117` pins it. Derivation is the better
choice here because this table is a security boundary, but do not go looking for
a precedent that agrees with it.

- [x] **Step 4: Run and confirm green**

Run: `pnpm vitest run apps/web/lib/free-recall-prompts.test.ts`
Expected: PASS, 5 tests.

- [x] **Step 5: Check the payload size**

The table ships to the client. Spec section D budgets it at roughly 3KB against
38.5KB for the whole world:

```bash
node -e "const lessons=require('./packages/content/.velite/lessons.json'); const mods=require('./packages/content/.velite/modules.json'); const free=mods.find(m=>m.worldId==='deep-orbit'&&m.order===1); const f=lessons.filter(l=>l.moduleId===free.slug).flatMap(l=>l.recallPrompts??[]); console.log('module:',free.slug,'prompts:',f.length,'bytes:',JSON.stringify(f).length);"
```

Expected: `foundations`, 6 prompts, about 2,490 bytes. If it is materially
larger, stop and report rather than shipping a surprise into every lesson
payload.

This command goes through the `modules` collection for the same reason Step 3
does. It is measuring the derived table, so it must derive it the same way.

Note what this check does **not** cover: it measures the 6 prompts, not what a
bundler would ship. If the module ever acquires `"use client"`, this command
still prints 2,490 bytes while the browser receives 1.1 MB. The size bar is a
budget check, not the server-only guard.

- [x] **Step 6: Checkpoint**

---

## Task 8: Write route

**Files:**

- Create: `apps/api/src/routes/review.ts`
- Create: `apps/api/src/routes/__tests__/review.test.ts`
- Modify: `apps/api/src/index.ts`

- [x] **Step 1: Write the failing route test**

Cover: unauthenticated request rejected; a write to another user's row rejected; enqueue is idempotent and never resets `next_review_at`; a record call moves `next_review_at` per `nextInterval`; an invalid `worldId` rejected with 400. Follow the existing style in `apps/api/src/routes/__tests__/supabase-integration.test.ts`.

- [x] **Step 2: Run and confirm it fails**

- [x] **Step 3: Implement the route**

Mirror `apps/api/src/routes/exercise-attempts.ts`: `new Hono<AppEnv>()`, `review.use("*", authMiddleware)`, `c.get("userId")` and `c.get("accessToken")`, `isValidWorldSlug` on input, JSON parse in a try/catch returning 400.

Two endpoints: `POST /` records an outcome (calls `nextInterval` from `@tensorcraft/shared`), and `POST /enqueue` inserts one row per prompt index with `on conflict do nothing`.

**Two traps in the enqueue write, both created by the UPDATE policy Task 4 added:**

- **Pass `ignoreDuplicates: true` to `.upsert()`.** supabase-js defaults to
  `ignoreDuplicates: false`, which sends `Prefer: resolution=merge-duplicates`
  and becomes `ON CONFLICT DO UPDATE`. Before migration 061 that would have
  been denied by RLS for lack of an UPDATE policy. Now it succeeds and
  overwrites `next_review_at`, which is exactly what the spec's Departures
  item 3 forbids: re-completing a lesson must never reset the schedule.
  Adding the UPDATE policy removed an accidental safety net, so the intent has
  to be explicit in the call. There is a working precedent to copy:
  `apps/web/lib/progress-client.ts:47` writes
  `{ onConflict: "user_id,world_id,lesson_id", ignoreDuplicates: true }` for
  the same never-reset-an-existing-row purpose. The same file uses the bare
  merge form at line 135, so both spellings genuinely coexist here and reading
  one without the other is how this trap gets sprung.
- **The conflict target names exactly the four primary-key columns:**
  `user_id, world_id, lesson_id, prompt_index`. `module_id` is a non-key column
  on this table. Including it raises Postgres 42P10, "no unique or exclusion
  constraint matching the ON CONFLICT specification."

**Do not emit a `skill_events` row.** The spec's "Departures" item 4 makes this an explicit non-goal: `review_recall` still carries a weight of 1 in the live `compute_user_skill_genome` (migration 055 line 62), and resuming emission would move every reviewing learner's Genome before anyone has decided that is intended.

- [x] **Step 4: Run and confirm green**

Run: `pnpm vitest run apps/api/src/routes/__tests__/review.test.ts`

- [x] **Step 5: Mount it**

In `apps/api/src/index.ts`, add the import alongside the others at lines 18-33 and mount it at `/api/review` following the existing mounting style.

- [x] **Step 6: Run the full suite**

Run: `pnpm test`
Expected: PASS. If a `vi.mock` factory anywhere fails, that is the known trap from 2026-08-26: a new export in a widely-mocked lib breaks every mock factory. Grep `vi.mock` for the affected module and add the new export to each factory.

- [x] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [x] **Step 8: Final checkpoint**

Report: every file created, the full test count, migration 061 pending or applied, and that nothing user-visible ships in this stage. Do not commit. Stage 2 is a separate plan.

---

## Definition of done for stage 1

- `pnpm test` green, including the new content gate.
- `pnpm typecheck` and `pnpm lint` green.
- `packages/content/.velite/lessons.json` carries 80 `recallPrompts` across 56 lessons, and no `rawBody`.
- Migration 061 written with SELECT, INSERT and UPDATE policies, paired with its down file, and either pending or applied by the owner.
- `apps/web/lib/free-recall-prompts.ts` derives the free module through the `modules` collection, carries no `"use client"`, and its test asserts the table holds only free-module entries.
- `nextInterval` authored by the owner, with a test table built from their numbers.
- No UI change. No route renders anything new. A learner sees exactly what they saw before.
