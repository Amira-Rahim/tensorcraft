/**
 * Server-side review queue read (spaced review stage 1, 2026-09-16).
 *
 * The lesson page's server component reads a signed-in learner's due recall
 * prompts here, resolves each one to its question and answer, and passes them
 * down as props. `review-store-guest.ts` is the signed-out counterpart, and
 * `free-recall-prompts.ts` is the table that path matches against.
 *
 * THIS MODULE IS A SECURITY BOUNDARY. 75 of Deep Orbit's 82 recall prompts are
 * paid content; only the 7 in the free `foundations` module are not. A
 * `review_queue` row is a KEY, never text, so this file is the only place a
 * key becomes readable prose for a signed-in learner. Four rules keep that
 * safe, and all four exist for a reason that is easy to undo by accident.
 *
 * 1. THE FILTER IS `canAccessWorld`, NOT THE PAGE'S `purchased` VALUE. The
 *    lesson page computes `purchased` as
 *    `user && mod && mod.order > 1 ? hasWorldPurchase(...) : true`
 *    (page.tsx:137), so it is a hardcoded `true` on every module-1 lesson,
 *    with no entitlement lookup performed at all. It means "not blocked on
 *    this page", not "entitled to this world". The warm-up renders on every
 *    lesson, and module 1 is exactly what stays open to a learner after a
 *    refund, so filtering on `purchased` would resolve a refunded learner's
 *    paid keys to text on any free lesson. Spec section D.
 *
 * 2. ENTITLEMENT IS COMPUTED ONCE, AND A FAULT THROWS. `getEntitledWorlds`
 *    throws on a lookup failure by deliberate design, so that a transient DB
 *    fault never silently shows a paying customer the paywall. Wrapping the
 *    call in a try/catch, per key or otherwise, converts that fault into a
 *    silent deny and reintroduces the exact bug the throw prevents.
 *
 * 3. FREENESS COMES FROM THE CONTENT BUILD, NOT FROM THE ROW. Migration 061
 *    grants each learner INSERT and UPDATE on their own `review_queue` rows
 *    (apps/api writes through a JWT-scoped client, so those policies are
 *    required, not optional). Every column is therefore a value the learner
 *    can choose. A row claiming `module_id = 'foundations'` while naming a
 *    paid lesson would walk straight past a gate that trusted `module_id`, so
 *    the gate reads the module off the lesson in the velite build and drops
 *    any row whose `module_id` disagrees with it. A module that is not in the
 *    build at all is treated as NOT free.
 *
 * 4. TEXT IS READ ONLY AFTER THE GATE. The question and answer are looked up
 *    below the entitlement check, so a dropped item's paid text is never even
 *    loaded into a local variable.
 *
 * Gate: `review-store-server.test.ts`.
 *
 * SERVER-ONLY, like `free-recall-prompts.ts`: it imports the velite `lessons`
 * collection, which velite re-exports as one 1.1 MB JSON default. It must
 * never carry "use client".
 */

import { lessons, modules } from "@tensorcraft/content";
import { selectDue } from "@tensorcraft/shared";
import type { ResolvedReviewItem, ReviewItem } from "@tensorcraft/shared";
import { canAccessWorld } from "@/lib/entitlements";
import type { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The cookie-bound, RLS-scoped client the lesson page already holds. Type-only
 * import: this file never builds its own client, and it must never reach for
 * the service role, which would read past the RLS select policy.
 */
type ServerSupabaseClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

/**
 * Due review items for one learner and one world, resolved to their text.
 *
 * Returns an empty list rather than throwing when the queue read fails: spec
 * section H gives reads and writes opposite treatment, because a missing
 * warm-up loses nothing while a swallowed write leaves an item due forever.
 * The one thing that DOES throw is an entitlement fault; see rule 2 above.
 */
export async function resolveDueForUser(
  supabase: ServerSupabaseClient,
  userId: string,
  worldId: string,
  limit: number,
  now: Date,
): Promise<ResolvedReviewItem[]> {
  // `break` after the push below means a limit of 0 would otherwise yield one
  // item. Not a leak (it passed the gate), but if stage 2 ever uses 0 to mean
  // "warm-up off", off must mean off.
  if (limit <= 0) return [];

  const { data, error } = await Promise.resolve(
    supabase
      .from("review_queue")
      .select(
        "module_id, lesson_id, prompt_index, pulls, successes, last_reviewed_at, next_review_at",
      )
      .eq("user_id", userId)
      .eq("world_id", worldId)
      // Narrows on the (user_id, world_id, next_review_at) index from migration
      // 061. `selectDue` filters by due date again on the way through: this
      // clause saves rows over the wire, it is not the authority on what is due.
      .lte("next_review_at", now.toISOString()),
  ).then(
    (result) => result,
    () => ({ data: null, error: new Error("Review queue unavailable") }),
  );

  if (error) return [];

  const items: ReviewItem[] = (data ?? []).map((row) => ({
    // From the parameter, not the row: the query already scopes to this world,
    // and taking it from the row would put a client-written value in the key
    // the rest of the pipeline reads.
    worldId,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    promptIndex: row.prompt_index,
    pulls: row.pulls,
    successes: row.successes,
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
  }));

  // Unbounded on purpose, with `limit` applied after the filter below rather
  // than before it. Filtering second would let a dropped item consume a slot:
  // a refunded learner keeps up to 74 paid rows and 6 free ones, and their
  // paid rows are the oldest and so the most overdue, so a pre-filter
  // `selectDue(items, now, 2)` would return two paid keys, drop both, and
  // show them nothing forever while free items sat due. Not a leak (they see
  // less, never more), but a silent quality-of-service cliff for exactly the
  // population least likely to report it. Ordering and the failure-rate
  // tie-break are unchanged; only where the quota is applied moved.
  const due = selectDue(items, now, Number.MAX_SAFE_INTEGER);

  // Nothing due means nothing to gate and nothing to show, so the purchases
  // query is skipped. This is the common case, every learner's first day
  // included, and it keeps free lesson pages from paying for a lookup whose
  // answer cannot change the empty result.
  if (due.length === 0) return [];

  // Once for the request, never once per key, and never inside a try/catch.
  const entitled = await canAccessWorld(userId, worldId);

  const resolved: ResolvedReviewItem[] = [];
  for (const item of due) {
    const lesson = lessons.find(
      (l) => l.worldId === worldId && l.slug === item.lessonId,
    );
    // Content is edited and rows outlive it. A stale key drops out here rather
    // than crashing a page render.
    if (!lesson) continue;

    // Rule 3: the row's own `module_id` is client-written, so it is checked
    // against the build rather than believed.
    if (lesson.moduleId !== item.moduleId) continue;

    const mod = modules.find(
      (m) => m.worldId === worldId && m.slug === lesson.moduleId,
    );
    // A module missing from the build is NOT free. Defaulting the unknown case
    // to free would make a deleted or renamed module a way through the gate.
    if (!mod) continue;

    // `order === 1` is the paywall's own definition of free: page.tsx
    // redirects `mod.order > 1` at lines 131 and 167. Do NOT swap this for
    // `isFoundationsModule`, which reads `track === "foundations"` and is true
    // of four deep-orbit modules, three of them paid (neural-networks at
    // order 2, training-loop at 3, browser-runtimes at 4). The lesson page
    // uses that helper for lesson-to-lesson navigation locking, which is a
    // different question from entitlement.
    if (mod.order !== 1 && !entitled) continue;

    const prompt = (lesson.recallPrompts ?? []).find(
      (p) => p.index === item.promptIndex,
    );
    if (!prompt) continue;

    resolved.push({
      ...item,
      question: prompt.question,
      answer: prompt.answer,
    });

    // The quota, applied after the gate rather than before it. Breaking here
    // rather than slicing at the end also stops resolving prompt text nobody
    // will see.
    if (resolved.length >= limit) break;
  }

  return resolved;
}
