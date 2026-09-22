/**
 * Free-module recall prompts, inlined for guests (spaced review stage 1,
 * 2026-09-16).
 *
 * A signed-out learner's review queue lives in `localStorage` (see
 * `review-store-guest.ts`), so the server never sees it and cannot resolve a
 * guest's due keys into prompt text. Instead the server ships this table and
 * the client joins its own queue keys against it.
 *
 * THIS TABLE IS A SECURITY BOUNDARY. 76 of Deep Orbit's 83 recall prompts are
 * paid content behind the paywall; only the 7 in the free `foundations`
 * module are not. A guest's queue keys sit in `localStorage`, where anyone can
 * hand-edit them, so the safety property is that this table simply does not
 * contain paid text: a forged key matches nothing. If a paid module ever leaks
 * in, a hand-edited key resolves to paid prompt text. Gate:
 * `free-recall-prompts.test.ts`.
 *
 * THIS FILE IS SERVER-ONLY. It must never carry "use client". Velite's
 * `index.js` re-exports `lessons.json` as a single JSON default, and that file
 * is about 1.2 MB (1,189,142 bytes measured with 82 prompts built on
 * 2026-09-17; 83 are built today), so a
 * "use client" module importing it ships all of that to
 * the browser. No client component in apps/web imports `@tensorcraft/content`
 * today, and this must not be the first. The stage-2 consumer receives the
 * table as serialized props. Stage 1 ships no consumer, so nothing here can
 * regress yet, which is exactly why the reasoning is written down now: the
 * stage-2 reviewer will not be reading the stage-1 plan. Note also that the
 * payload budget check in that plan measures the 7 prompts (about 3 KB), not
 * what a bundler would ship, so it would still read 3 KB on the day this
 * file grows a "use client" and the browser receives 1.1 MB. The comment is
 * the guard, not the number.
 */

import { lessons, modules } from "@tensorcraft/content";
import { DEFAULT_WORLD } from "@tensorcraft/shared";

/** One free recall prompt with the key a guest queue entry carries. */
export interface FreeRecallPrompt {
  question: string;
  answer: string;
  /** Position of the prompt within its lesson, 0-based. Part of the key. */
  promptIndex: number;
  lessonId: string;
  moduleId: string;
  /** Course order of the source lesson, so the warm-up can refuse to ask
   *  about the lesson being opened or anything after it (course-position.ts). */
  moduleOrder: number;
  lessonOrder: number;
}

// Derive the free module through the `modules` collection, NOT the `lessons`
// one. Both carry an `order` field and they mean different things: a lesson's
// `order` is its position inside its module, so `lessons.filter(l => l.order
// === 1)` returns 11 lessons spanning all 11 modules, `neural-networks` and
// `capstone` included. That is paid text in a table whose only job is to hold
// free text.
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

/**
 * Every recall prompt in the free module, and nothing else.
 *
 * Derived, never hand-copied: a hand-maintained copy drifts from the MDX the
 * first time a prompt is edited.
 */
export const FREE_RECALL_PROMPTS: FreeRecallPrompt[] = lessons
  // `worldId` is matched as well as `moduleId` as defensive scoping, not as a
  // fix for a collision that exists today. No other world ships a module
  // called `foundations`: each has its own opening module (`ml-through-vision`,
  // `edge-ai-basics`, `generative-basics`, `ml-through-text`), and only
  // deep-orbit is in the velite build at all, so this clause selects the same
  // 5 lessons with or without it.
  //
  // It stays because `lookupFreePrompt` keys on lesson slug ALONE. Nothing
  // stops a future world reusing a module or lesson slug, and if one ever did,
  // an unscoped filter would put another world's prompts in a table whose only
  // job is to hold free deep-orbit text. One clause is cheap insurance on a
  // security boundary.
  .filter((l) => l.worldId === DEFAULT_WORLD && l.moduleId === freeModule.slug)
  .flatMap((l) =>
    (l.recallPrompts ?? []).map(({ index, ...rest }) => ({
      ...rest,
      // Rename on the way out: parseRecallPrompts emits `index`, but
      // `promptIndex` is the key name used by ReviewItem, the guest store and
      // the lesson-completion enqueue. This table must not be the one surface
      // that spells it differently, because stage 2's whole job is joining
      // them.
      promptIndex: index,
      lessonId: l.slug,
      // Carried only so the safety test can assert the table holds nothing
      // outside the free module. The lookup below keys on
      // (lessonId, promptIndex).
      moduleId: l.moduleId,
      moduleOrder: freeModule.order,
      lessonOrder: l.order,
    })),
  );

/**
 * Resolve a guest queue key into its prompt text, or null.
 *
 * Null for anything not in the table, which is every paid prompt and every
 * forged key, however well-formed.
 */
export function lookupFreePrompt(
  lessonId: string,
  promptIndex: number,
): FreeRecallPrompt | null {
  return (
    FREE_RECALL_PROMPTS.find(
      (p) => p.lessonId === lessonId && p.promptIndex === promptIndex,
    ) ?? null
  );
}
