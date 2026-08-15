import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isValidWorldSlug } from "@tensorcraft/shared";

/**
 * THE single source of truth for "which worlds may this user access".
 *
 * Tier 1 of docs/audits/scalability-architecture-2026-07-21.md (finding F4).
 * Access used to be decided ad-hoc across ~13 files, roughly half hand-rolling
 * `.contains("world_ids", …)` or a `Set`-membership loop, and the one shared
 * helper carried a "keep this in sync with apps/api" warning - i.e. the
 * manual-sync burden was already real, single-tenant. Enterprise seats will
 * swap the ENTITLEMENT SOURCE from "the user's own purchases" to "worlds
 * granted via an org seat". If access is decided in 13 places, that swap
 * touches 13 places. Funnelled through here, it is one function.
 *
 * To add seat-based entitlement later, this is the ONLY function that changes:
 * union the purchased set with the seat-granted set. Every caller keeps
 * working unchanged. Do not reintroduce direct `purchases.world_ids` reads
 * for access decisions - call `getEntitledWorlds` / `canAccessWorld`.
 *
 * Throws on a genuine lookup failure rather than reporting "no access". A
 * transient DB fault must not silently show a paying customer the paywall
 * (the bug this codebase already fixed once in `hasWorldPurchase`). Callers
 * are server components, so a throw surfaces the nearest error boundary.
 *
 * React.cache: several server components on one page (dashboard, world
 * map) each call this - per-request memoization collapses them into one
 * purchases query per render (fresh-eyes rerun T2-26). cache() is
 * per-request, so entitlement changes still take effect on the next request.
 */
export const getEntitledWorlds = cache(async function getEntitledWorlds(
  userId: string,
): Promise<Set<string>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("world_ids")
    // partially_refunded preserves access by policy; a full refund revokes.
    // This status filter is the entitlement rule; keep it here and nowhere
    // else. The apps/api side has its own reads (credit math needs amounts) -
    // when seats land, align both on the shared rule.
    .eq("user_id", userId)
    .in("status", ["completed", "partially_refunded"]);

  if (error) {
    throw new Error(
      `Entitlement lookup failed for ${userId}: ${error.message}`,
    );
  }

  const worlds = new Set<string>();
  for (const row of data ?? []) {
    const ids = (row as { world_ids: unknown }).world_ids;
    if (!Array.isArray(ids)) continue;
    for (const slug of ids) {
      if (typeof slug === "string" && isValidWorldSlug(slug)) worlds.add(slug);
    }
  }
  return worlds;
});

/** Does this user have access to a single world? Delegates to the one source. */
export async function canAccessWorld(
  userId: string,
  worldSlug: string,
): Promise<boolean> {
  const entitled = await getEntitledWorlds(userId);
  return entitled.has(worldSlug);
}
