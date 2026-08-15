# Patch Award Moment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the module's mission patch on the Consequence step the moment the last remaining lesson of a module completes.

**Architecture:** One pure predicate (`completesModule`) computed synchronously in the existing completion effect's `enteredThisSession` branch, one small `PatchAward` component under the "Mission Complete" badge, zero new queries. No commit steps (CLAUDE.md).

Spec: `docs/superpowers/specs/2026-08-15-patch-award-moment-design.md`

---

### Task 1: the predicate

**Files:** Create `apps/web/app/worlds/[slug]/[module]/[lesson]/completes-module.ts` + `completes-module.test.ts`

- [ ] RED, cases: (a) all others done server-side, current not → true; (b) current already done → false; (c) one other lesson missing → false; (d) `lessons` undefined or empty → false; (e) guest-only completions cover the others → true; (f) mixed server+guest cover → true.

```ts
export interface ModuleLessonState {
  slug: string;
  completed: boolean;
}

/** True when finishing `currentSlug` right now closes out the module:
 *  every OTHER lesson is already done (server truth or a local guest
 *  record) and the current one is not. Pure; callers gate on patch art
 *  and on the completion effect's enteredThisSession guard. */
export function completesModule(
  lessons: ModuleLessonState[] | undefined,
  currentSlug: string,
  guestDoneSlugs: ReadonlySet<string>,
): boolean {
  if (!lessons || lessons.length === 0) return false;
  const done = (l: ModuleLessonState) =>
    l.completed || guestDoneSlugs.has(l.slug);
  const current = lessons.find((l) => l.slug === currentSlug);
  if (!current || done(current)) return false;
  return lessons.filter((l) => l.slug !== currentSlug).every(done);
}
```

- [ ] GREEN; run the test file.

### Task 2: `PatchAward`

**Files:** Create `apps/web/app/worlds/[slug]/[module]/[lesson]/patch-award.tsx` + `patch-award.test.tsx`

- [ ] RED: renders the ModulePatch img with the given src and alt "<module name> mission patch"; renders the eyebrow text and "Mission patch earned."; firing `error` on the img leaves the text block intact (no broken image).
- [ ] GREEN:

```tsx
"use client";
import { ModulePatch } from "@tensorcraft/ui/module-patch";

export function PatchAward({
  src,
  moduleName,
  moduleTerm,
}: {
  src: string;
  moduleName: string;
  moduleTerm: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 mb-8 animate-fade-up"
      data-testid="patch-award"
    >
      <ModulePatch src={src} size={96} alt={`${moduleName} mission patch`} />
      <div
        className="font-mono text-[10px] uppercase tracking-[2px] mt-2"
        style={{ color: "var(--tc-primary)" }}
      >
        {moduleTerm} Complete
      </div>
      <div className="text-sm font-semibold" style={{ color: "var(--tc-text)" }}>
        {moduleName}
      </div>
      <div className="text-xs" style={{ color: "var(--tc-muted)" }}>
        Mission patch earned.
      </div>
    </div>
  );
}
```

### Task 3: wire the moment

**Files:** Modify `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`; test in its existing test file (`lesson-steps.test.tsx`).

- [ ] RED (follow the file's existing walk-to-final-step test pattern): with `lessons` where every other lesson is completed and patch art resolvable, walking to the final step renders `patch-award`; a restored mount onto the final step does not; with a mid-module lesson (another lesson incomplete) it does not.
- [ ] GREEN: `const [awardSrc, setAwardSrc] = useState<string | null>(null)`. Inside the completion effect's `enteredThisSession` branch, compute synchronously (before the async write settles):

```ts
const patch = patchSrc(worldSlug, moduleSlug);
if (patch) {
  const guestDone = new Set(
    getGuestCompletions()
      .filter((c) => c.worldSlug === worldSlug && c.moduleSlug === moduleSlug)
      .map((c) => c.lessonSlug),
  );
  if (completesModule(lessons, lesson.slug, guestDone)) setAwardSrc(patch);
}
```

(Verify `GuestCompletion`'s field names against `lib/guest-progress.ts` before writing — adjust the filter to its actual shape.) Render in the Consequence step directly under the mission-complete badge: `{awardSrc && <PatchAward src={awardSrc} moduleName={moduleName ?? moduleSlug} moduleTerm={terms(worldSlug).module} />}` — confirm the `terms()` helper exposes `module`; if not, pull from `worlds[worldSlug].terminology.module` the way the badge pulls `lesson`.
- [ ] Run the lesson-steps test file — PASS.

### Task 4: verification + docs

- [ ] `npx vitest run apps/web` and full battery; `pnpm --filter @tensorcraft/web typecheck`; lint.
- [ ] E2e `end-of-lesson.spec.ts` still green (it does not walk a full module; unit coverage carries the award).
- [ ] Eye check: dev server, walk the last lesson of a nearly-complete module if a seeded state is practical; otherwise rely on the component render in tests plus a Storybook-less DOM screenshot of the Consequence step is NOT required — skip.
- [ ] Docs: backlog deferred entry → `[x]`; memory update.
