"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { themes } from "@tensorcraft/themes";
import { LAUNCHED_THEMES, PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { CheckoutButton } from "./checkout-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// V1 scope-revert (2026-05-05): the picker shows only launched themes.
// Bundle tiers (2/3/all) are auto-disabled below when fewer launched themes
// exist than the bundle requires, so the cart can never produce a basket
// the API would reject (`validateThemeIds` → `isLaunched`).
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
            className={`min-h-11 px-3 py-2 text-xs font-mono border rounded-none transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              isOwned
                ? "border-primary/50 bg-primary/5 text-primary/70 cursor-default"
                : isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : isFull
                    ? "border-border text-text-muted/40 cursor-not-allowed"
                    : "border-border text-text-muted hover:border-primary hover:text-text-primary"
            }`}
          >
            {t.name}
            {isOwned && (
              <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">
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
 * PricingTiers, brutalist 5-tier grid (Phase 11 §11d Wave 1).
 *
 * Renders all 5 pricing tiers (Free, Single, Two, Three, All 5) as a
 * responsive grid. The "All 5 Themes" tier is highlighted with a darker
 * primary border and a "BEST VALUE" mono ribbon. Every card is square-edged
 * (`rounded-none`), uses mono for price + tech details, and applies a
 * brutalist offset shadow on hover.
 */
export function PricingTiers() {
  const [singleTheme, setSingleTheme] = useState<string | null>(null);
  const [twoThemes, setTwoThemes] = useState<string[]>([]);
  const [threeThemes, setThreeThemes] = useState<string[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<Set<string>>(new Set());
  const [totalCredit, setTotalCredit] = useState(0);

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
          let credit = 0;
          for (const p of data) {
            for (const t of p.theme_ids) owned.add(t);
            credit += Number(p.amount);
          }
          setOwnedThemes(owned);
          setTotalCredit(credit);
        });
    });
  }, []);

  function adjustedPrice(planPrice: number): number {
    return Math.max(0, planPrice - totalCredit);
  }

  function creditLine(planPrice: number) {
    if (totalCredit <= 0) return null;
    return (
      <p className="mt-1 text-[11px] font-mono text-primary uppercase tracking-wider">
        {adjustedPrice(planPrice) === 0
          ? "covered by credit"
          : `// pay $${adjustedPrice(planPrice)} (credit $${totalCredit})`}
      </p>
    );
  }

  function toggleInList(
    list: string[],
    setList: (v: string[]) => void,
    slug: string,
  ) {
    if (list.includes(slug)) {
      setList(list.filter((s) => s !== slug));
    } else {
      setList([...list, slug]);
    }
  }

  const lessonsPerModule = THEME_CONTENT.lessonsPerModule;
  const totalLessons = THEME_CONTENT.totalLessonsPerTheme;
  const modulesPerTheme = THEME_CONTENT.modulesPerTheme;

  return (
    <section className="px-6 pb-20" data-testid="pricing-tiers">
      <div className="max-w-7xl mx-auto">
        <p className="text-[13px] uppercase tracking-[0.15em] mb-6 text-text-muted font-mono">
          Choose your plan
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
            <Link
              href="/themes/deep-orbit"
              className="flex items-center justify-center w-full h-11 text-[13px] font-medium font-mono uppercase tracking-wider transition-all border border-primary rounded-none text-primary hover:bg-primary hover:text-page focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Start Free &rarr;
            </Link>
          </article>

          {/* ───── TIER 2 · Single Theme ───── */}
          <article
            data-testid="tier-card-single"
            data-plan-id="single"
            className="relative flex flex-col border border-border bg-surface rounded-none p-6 transition-all hover:border-primary hover:brutalist-shadow"
          >
            <div className="mb-4">
              <span className="block text-4xl font-bold leading-none text-text-primary font-mono">
                ${PRICING.single.price}
              </span>
              <p className="mt-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                one theme · lifetime access
              </p>
              {creditLine(PRICING.single.price)}
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

          {/* ───── TIER 3 · Two Themes ───── */}
          <article
            data-testid="tier-card-two"
            data-plan-id="twoBundle"
            className="relative flex flex-col border border-border bg-surface rounded-none p-6 transition-all hover:border-primary hover:brutalist-shadow"
          >
            <div className="mb-4">
              <span className="block text-4xl font-bold leading-none text-text-primary font-mono">
                ${PRICING.twoBundle.price}
              </span>
              <p className="mt-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                ${Math.round(PRICING.twoBundle.price / 2)}/theme · save $
                {PRICING.single.price * 2 - PRICING.twoBundle.price}
              </p>
              {creditLine(PRICING.twoBundle.price)}
            </div>
            <h3 className="text-base font-semibold mb-1 text-text-primary font-mono uppercase tracking-wider">
              Two Themes
            </h3>
            <p className="text-xs mb-5 leading-relaxed text-text-muted font-sans">
              Any two specializations. {totalLessons * 2} lessons total.
            </p>
            <ul className="flex-1 mb-4 space-y-2">
              {[
                "Everything in Single",
                "2 full themes",
                `${totalLessons * 2} lessons`,
                "2 capstone projects",
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
              pick 2 themes
            </p>
            <ThemePicker
              max={2}
              selected={twoThemes}
              onToggle={(slug) => toggleInList(twoThemes, setTwoThemes, slug)}
              ownedThemes={ownedThemes}
            />
            <CheckoutButton
              planId="twoBundle"
              themeIds={twoThemes}
              disabled={launchedThemeCount < 2 || twoThemes.length !== 2}
              disabledReason={
                launchedThemeCount < 2
                  ? "Available when more themes launch"
                  : `Select ${2 - twoThemes.length} more theme${
                      2 - twoThemes.length !== 1 ? "s" : ""
                    }`
              }
            >
              Get Two &rarr;
            </CheckoutButton>
          </article>

          {/* ───── TIER 4 · Three Themes ───── */}
          <article
            data-testid="tier-card-three"
            data-plan-id="threeBundle"
            className="relative flex flex-col border border-border bg-surface rounded-none p-6 transition-all hover:border-primary hover:brutalist-shadow"
          >
            <div className="mb-4">
              <span className="block text-4xl font-bold leading-none text-text-primary font-mono">
                ${PRICING.threeBundle.price}
              </span>
              <p className="mt-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                ${Math.round(PRICING.threeBundle.price / 3)}/theme · save $
                {PRICING.single.price * 3 - PRICING.threeBundle.price}
              </p>
              {creditLine(PRICING.threeBundle.price)}
            </div>
            <h3 className="text-base font-semibold mb-1 text-text-primary font-mono uppercase tracking-wider">
              Three Themes
            </h3>
            <p className="text-xs mb-5 leading-relaxed text-text-muted font-sans">
              Any three specializations. {totalLessons * 3} lessons total.
            </p>
            <ul className="flex-1 mb-4 space-y-2">
              {[
                "Everything in Two",
                "3 full themes",
                `${totalLessons * 3} lessons`,
                "3 capstone projects",
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
              pick 3 themes
            </p>
            <ThemePicker
              max={3}
              selected={threeThemes}
              onToggle={(slug) =>
                toggleInList(threeThemes, setThreeThemes, slug)
              }
              ownedThemes={ownedThemes}
            />
            <CheckoutButton
              planId="threeBundle"
              themeIds={threeThemes}
              disabled={launchedThemeCount < 3 || threeThemes.length !== 3}
              disabledReason={
                launchedThemeCount < 3
                  ? "Available when more themes launch"
                  : `Select ${3 - threeThemes.length} more theme${
                      3 - threeThemes.length !== 1 ? "s" : ""
                    }`
              }
            >
              Get Three &rarr;
            </CheckoutButton>
          </article>

          {/* ───── TIER 5 · All 5 Themes (BEST VALUE) ───── */}
          <article
            data-testid="tier-card-all-five"
            data-plan-id="allFive"
            data-recommended="true"
            className="relative flex flex-col border-2 border-primary bg-surface rounded-none p-6 transition-all hover:brutalist-shadow"
          >
            <span
              aria-hidden="true"
              className="absolute -top-3 left-5 inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-page rounded-none"
            >
              Best Value
            </span>
            <div className="mb-4 mt-1">
              <span className="block text-4xl font-bold leading-none text-primary font-mono">
                ${PRICING.allFive.price}
              </span>
              <p className="mt-1 text-[11px] font-mono text-primary uppercase tracking-wider">
                ${Math.round(PRICING.allFive.price / 5)}/theme · save $
                {PRICING.single.price * 5 - PRICING.allFive.price}
              </p>
              {creditLine(PRICING.allFive.price)}
            </div>
            <h3 className="text-base font-semibold mb-1 text-text-primary font-mono uppercase tracking-wider">
              All 5 Themes
            </h3>
            <p className="text-xs mb-5 leading-relaxed text-text-muted font-sans">
              All five specializations: time-series, vision, NLP, generative,
              edge. {totalLessons * 5} lessons, 5 capstones, one payment.
            </p>
            <ul className="flex-1 mb-6 space-y-2">
              {[
                "Everything in Three",
                "All 5 themes",
                `${totalLessons * 5} lessons`,
                "5 capstone projects",
                "Priority support",
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
            <CheckoutButton
              planId="allFive"
              themeIds={[...LAUNCHED_THEMES]}
              disabled={launchedThemeCount < 5}
              disabledReason={
                launchedThemeCount < 5
                  ? "Available when all 5 themes launch"
                  : undefined
              }
              recommended
            >
              Get All 5 &rarr;
            </CheckoutButton>
          </article>
        </div>
      </div>
    </section>
  );
}
