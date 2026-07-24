import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isValidThemeSlug } from "@tensorcraft/shared";

/**
 * THE single source of truth for "which themes may this user access".
 *
 * Tier 1 of docs/audits/scalability-architecture-2026-07-21.md (finding F4).
 * Access used to be decided ad-hoc across ~13 files, roughly half hand-rolling
 * `.contains("theme_ids", …)` or a `Set`-membership loop, and the one shared
 * helper carried a "keep this in sync with apps/api" warning — i.e. the
 * manual-sync burden was already real, single-tenant. Enterprise seats will
 * swap the ENTITLEMENT SOURCE from "the user's own purchases" to "themes
 * granted via an org seat". If access is decided in 13 places, that swap
 * touches 13 places. Funnelled through here, it is one function.
 *
 * To add seat-based entitlement later, this is the ONLY function that changes:
 * union the purchased set with the seat-granted set. Every caller keeps
 * working unchanged. Do not reintroduce direct `purchases.theme_ids` reads
 * for access decisions — call `getEntitledThemes` / `canAccessTheme`.
 *
 * Throws on a genuine lookup failure rather than reporting "no access". A
 * transient DB fault must not silently show a paying customer the paywall
 * (the bug this codebase already fixed once in `hasThemePurchase`). Callers
 * are server components, so a throw surfaces the nearest error boundary.
 */
export async function getEntitledThemes(userId: string): Promise<Set<string>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("theme_ids")
    // partially_refunded preserves access by policy; a full refund revokes.
    // This status filter is the entitlement rule; keep it here and nowhere
    // else. The apps/api side has its own reads (credit math needs amounts) —
    // when seats land, align both on the shared rule.
    .eq("user_id", userId)
    .in("status", ["completed", "partially_refunded"]);

  if (error) {
    throw new Error(
      `Entitlement lookup failed for ${userId}: ${error.message}`,
    );
  }

  const themes = new Set<string>();
  for (const row of data ?? []) {
    const ids = (row as { theme_ids: unknown }).theme_ids;
    if (!Array.isArray(ids)) continue;
    for (const slug of ids) {
      if (typeof slug === "string" && isValidThemeSlug(slug)) themes.add(slug);
    }
  }
  return themes;
}

/** Does this user have access to a single theme? Delegates to the one source. */
export async function canAccessTheme(
  userId: string,
  themeSlug: string,
): Promise<boolean> {
  const entitled = await getEntitledThemes(userId);
  return entitled.has(themeSlug);
}
