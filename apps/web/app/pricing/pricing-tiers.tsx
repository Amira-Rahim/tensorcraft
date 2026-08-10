"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import {
  LAUNCHED_THEMES,
  PRICING,
  THEME_CONTENT,
  isValidThemeSlug,
} from "@tensorcraft/shared";
import { CheckoutButton } from "./checkout-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// V1 scope-revert (2026-05-05): the picker shows only launched themes, so the
// cart can never produce a basket the API would reject (`validateThemeIds` →
// `isLaunched`). The bundle tiers that used to sit alongside these two are
// gone entirely (see <BundleRoadmap />); this grid renders only what a buyer
// can actually put money on.
const themeList = LAUNCHED_THEMES.map((slug) => ({
  slug,
  name: themes[slug].displayName,
}));
const launchedThemeCount = LAUNCHED_THEMES.length;

function ThemePicker({
  max,
  selected,
  onToggle,
  ownedThemes,
}: {
  max: number;
  selected: string[];
  onToggle: (slug: string) => void;
  ownedThemes?: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {themeList.map((t) => {
        const isOwned = ownedThemes?.has(t.slug) ?? false;
        const isSelected = isOwned || selected.includes(t.slug);
        const isFull = selected.length >= max && !isSelected;
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => !isOwned && !isFull && onToggle(t.slug)}
            disabled={isOwned || isFull}
            // Selection was conveyed ONLY by colour (border/background/weight),
            // so a screen-reader user building a $99-$159 bundle had no way to
            // know which themes were in their basket, and the state was
            // invisible to anyone who cannot distinguish the accent. This is
            // purchasing information, not decoration. WCAG 4.1.2 and 1.4.1.
            aria-pressed={isSelected}
            // Owned and basket-full are different reasons for the same
            // disabled state; without this they are indistinguishable.
            aria-label={
              isOwned
                ? `${t.name} (already owned)`
                : isFull
                  ? `${t.name} (unavailable, plan is full)`
                  : t.name
            }
            className={`min-h-11 px-3 py-2 text-xs font-mono border rounded-none transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              isOwned
                ? "border-primary/50 bg-primary/5 text-primary cursor-default"
                : isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : isFull
                    ? "border-border text-text-muted/40 cursor-not-allowed"
                    : "border-border text-text-muted hover:border-primary hover:text-text-primary"
            }`}
          >
            {t.name}
            {isOwned && (
              <span className="ml-1.5 text-[10px] uppercase tracking-wider">
                OWNED
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * PricingTiers, brutalist grid of the tiers a buyer can actually buy.
 *
 * Was a 5-card grid (Free, Single, Two, Three, All 5). With one theme
 * launched, three of those five cards could only render as disabled cards
 * with dead CTAs, which cost the page twice: the only live PAID card was the
 * second cheapest of five, so $59 read as a stripped entry tier when $59 is
 * the entire product; and the dead CTAs read "Available when more themes
 * launch", which implies a schedule the theme-2 gate (launch + a paying-user
 * threshold) does not promise.
 *
 * Now the grid holds Free and Single only. The bundle prices did not vanish,
 * they moved to <BundleRoadmap /> below, stated as information with no
 * purchase affordance at all. Prices themselves are unchanged; PRICING is
 * untouched and the server diff is zero.
 *
 * Every card is square-edged (`rounded-none`), uses mono for price + tech
 * details, and applies a brutalist offset shadow on hover.
 */
export function PricingTiers({ extrasLessons }: { extrasLessons: number }) {
  // Preselect when exactly one theme is launched: a one-option picker
  // that starts empty just disables the page's most important button
  // behind a pointless click (2026-07-14 UX audit).
  const [singleTheme, setSingleTheme] = useState<string | null>(
    LAUNCHED_THEMES.length === 1 ? LAUNCHED_THEMES[0] : null,
  );
  // No picker reads these while the bundle cards are gone, but the
  // auth-roundtrip restore below still writes them, so the plumbing survives
  // intact for whenever bundles become buyable. Value bindings are elided
  // rather than left dangling.
  const [, setTwoThemes] = useState<string[]>([]);
  const [, setThreeThemes] = useState<string[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<Set<string>>(new Set());
  const [purchases, setPurchases] = useState<
    { themeIds: string[]; amount: number }[]
  >([]);

  // Restore a selection carried through the auth roundtrip. CheckoutButton
  // sends signed-out buyers to /auth with redirectTo=/pricing?plan=...&themes=...;
  // nothing ever read those params back, so the buyer returned to an
  // unselected picker (audit run #7). Only canonical slugs are accepted.
  const searchParams = useSearchParams();
  useEffect(() => {
    const plan = searchParams.get("plan");
    const restored = (searchParams.get("themes") ?? "")
      .split(",")
      .filter((s) => isValidThemeSlug(s));
    if (!plan || restored.length === 0) return;
    if (plan === "single") setSingleTheme(restored[0]);
    else if (plan === "twoBundle") setTwoThemes(restored.slice(0, 2));
    else if (plan === "threeBundle") setThreeThemes(restored.slice(0, 3));
    // allFive needs no selection state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("purchases")
        .select("theme_ids, amount")
        .eq("user_id", session.user.id)
        .in("status", ["completed", "partially_refunded"])
        .then(({ data }) => {
          if (!data || data.length === 0) return;
          const owned = new Set<string>();
          for (const p of data) {
            for (const t of p.theme_ids) owned.add(t);
          }
          setOwnedThemes(owned);
          setPurchases(
            data.map((p) => ({
              themeIds: p.theme_ids as string[],
              amount: Number(p.amount),
            })),
          );
        });
    });
  }, []);

  /**
   * Credit for a specific basket, computed with the SERVER's rule
   * (payments.ts checkout): only purchases whose themes OVERLAP the basket
   * count. This used to sum every completed purchase regardless of overlap,
   * so a customer buying a non-overlapping theme was shown "covered by
   * credit" and then charged full price by Stripe (audit run #7; latent
   * until a second theme launches). The number rendered here must be the
   * number the server will charge against.
   */
  function creditFor(planThemeIds: string[]): number {
    let credit = 0;
    for (const p of purchases) {
      if (p.themeIds.some((id) => planThemeIds.includes(id))) {
        credit += p.amount;
      }
    }
    return credit;
  }

  function creditLine(planPrice: number, planThemeIds: string[]) {
    const credit = Math.min(creditFor(planThemeIds), planPrice);
    if (credit <= 0) return null;
    const pay = Math.max(0, planPrice - credit);
    return (
      <p className="mt-1 text-[11px] font-mono text-primary uppercase tracking-wider">
        {pay === 0 ? "covered by credit" : `pay $${pay} (credit $${credit})`}
      </p>
    );
  }

  const lessonsPerModule = THEME_CONTENT.lessonsPerModule;
  const totalLessons = THEME_CONTENT.totalLessonsPerTheme;
  const modulesPerTheme = THEME_CONTENT.modulesPerTheme;

  return (
    <section className="px-6 pb-16" data-testid="pricing-tiers">
      {/* Two cards, so the row narrows with them. At max-w-7xl a two-card
          grid stretches each card to ~40rem of mostly empty space; 4xl
          matches the refund badge above and still gives the feature lists
          room to breathe, which a fifth of a row never did. */}
      <div className="max-w-4xl mx-auto">
        <p className="text-[13px] uppercase tracking-[0.15em] mb-6 text-text-muted font-mono">
          Choose your plan
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* ───── TIER 1 · Free Preview ───── */}
          <article
            data-testid="tier-card-free"
            data-plan-id="free"
            className="relative flex flex-col border border-border bg-surface rounded-none p-6 transition-all hover:border-primary hover:brutalist-shadow"
          >
            <div className="mb-4">
              <span className="block text-4xl font-bold leading-none text-text-primary font-mono">
                $0
              </span>
              <p className="mt-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                no card required
              </p>
            </div>
            <h3 className="text-base font-semibold mb-1 text-text-primary font-mono uppercase tracking-wider">
              Free Preview
            </h3>
            <p className="text-xs mb-5 leading-relaxed text-text-muted font-sans">
              Module 1 of Deep Orbit. {lessonsPerModule} lessons, full code
              editor, bridges, graded exercises.
            </p>
            <ul className="flex-1 mb-6 space-y-2">
              {[
                `${lessonsPerModule} lessons`,
                "Code editor",
                "FE-to-ML bridges",
                "Graded exercises",
                // The free module carries its own scene plates, so the funnel
                // shows the production value rather than only describing it.
                "Illustrated scenes",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-xs text-text-muted font-mono"
                >
                  <span className="text-primary font-bold" aria-hidden="true">
                    &#10003;
                  </span>
                  {f}
                </li>
              ))}
              {/* Advertised free content must be findable from the ad
                  (2026-07-14 UX audit: /extras had zero inbound links). */}
              <li className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <span className="text-primary font-bold" aria-hidden="true">
                  &#10003;
                </span>
                <Link
                  href="/extras"
                  className="underline underline-offset-4 hover:text-text-primary transition-colors"
                >
                  {extrasLessons} bonus deep-dive lessons
                </Link>
              </li>
            </ul>
            <Link
              href="/themes/deep-orbit"
              className="flex items-center justify-center w-full h-11 text-[13px] font-medium font-mono uppercase tracking-wider transition-all border border-primary rounded-none text-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Start Free &rarr;
            </Link>
          </article>

          {/* ───── TIER 2 · Single Theme ─────
              The only paid tier on the page, and the whole product today.
              The `< 5` guard stays so the ribbon retires itself if the
              bundle cards ever come back to this grid. */}
          <article
            data-testid="tier-card-single"
            data-plan-id="single"
            data-recommended={launchedThemeCount < 5 ? "true" : undefined}
            className={`relative flex flex-col border-2 ${launchedThemeCount < 5 ? "border-primary" : "border-border"} bg-surface rounded-none p-6 transition-all hover:border-primary hover:brutalist-shadow`}
          >
            {launchedThemeCount < 5 && (
              <span
                aria-hidden="true"
                className="absolute -top-3 left-5 inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-on-primary rounded-none"
              >
                Available Now
              </span>
            )}
            <div className="mb-4">
              <span className="block text-4xl font-bold leading-none text-text-primary font-mono">
                ${PRICING.single.price}
              </span>
              <p className="mt-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                one theme · lifetime access
              </p>
              {creditLine(
                PRICING.single.price,
                singleTheme ? [singleTheme] : [],
              )}
            </div>
            <h3 className="text-base font-semibold mb-1 text-text-primary font-mono uppercase tracking-wider">
              Single Theme
            </h3>
            <p className="text-xs mb-5 leading-relaxed text-text-muted font-sans">
              Complete one theme: {totalLessons} lessons, {modulesPerTheme}{" "}
              modules, capstone.
            </p>
            <ul className="flex-1 mb-4 space-y-2">
              {[
                `${totalLessons} lessons`,
                `${modulesPerTheme} modules`,
                // Coverage, not a count. Every briefing carries a scene plate,
                // so this stays true as lessons are added; "63 scenes" would
                // go stale the way the "21 bonus lessons" literal did. Pinned
                // by packages/content/__tests__/scene-art-coverage.test.ts.
                "Every lesson illustrated",
                "Capstone project",
                "GitHub push",
                "Certificate",
                "Lifetime updates",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-xs text-text-muted font-mono"
                >
                  <span className="text-primary font-bold" aria-hidden="true">
                    &#10003;
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">
              pick 1 theme
            </p>
            <ThemePicker
              max={1}
              selected={singleTheme ? [singleTheme] : []}
              onToggle={(slug) =>
                setSingleTheme(singleTheme === slug ? null : slug)
              }
              ownedThemes={ownedThemes}
            />
            <CheckoutButton
              planId="single"
              themeIds={singleTheme ? [singleTheme] : []}
              disabled={!singleTheme}
              disabledReason="Select a theme above"
            >
              Get Single &rarr;
            </CheckoutButton>
          </article>
        </div>
      </div>
    </section>
  );
}
