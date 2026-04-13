"use client";

import { useState } from "react";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { CheckoutButton } from "./checkout-button";

const themeList = themeSlugs.map((slug) => ({
  slug,
  name: themes[slug].displayName,
  color: themes[slug].palette.primary,
}));

function ThemePicker({
  max,
  selected,
  onToggle,
}: {
  max: number;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {themeList.map((t) => {
        const isSelected = selected.includes(t.slug);
        const isFull = selected.length >= max && !isSelected;
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => !isFull && onToggle(t.slug)}
            disabled={isFull}
            className={`px-3 py-1.5 text-xs font-mono border transition-all ${
              isSelected
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : isFull
                  ? "border-border text-text-muted/40 cursor-not-allowed"
                  : "border-border text-text-muted hover:border-primary/50 hover:text-text-primary"
            }`}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

export function PricingTiers() {
  const [singleTheme, setSingleTheme] = useState<string | null>(null);
  const [twoThemes, setTwoThemes] = useState<string[]>([]);
  const [threeThemes, setThreeThemes] = useState<string[]>([]);

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

  return (
    <>
      {/* Single Theme — $79 */}
      <section className="px-6 pb-16">
        <div className="max-w-[800px] mx-auto">
          <div className="relative p-7 flex flex-col border border-primary bg-[rgba(107,170,138,0.12)] hover:shadow-[4px_4px_0_var(--tc-primary)] transition-all">
            <span className="absolute -top-3 left-6 inline-flex items-center px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider bg-primary text-[#1C1C1C]">
              RECOMMENDED
            </span>
            <div className="mt-2 mb-2">
              <span className="text-5xl font-bold leading-tight text-text-primary font-mono">
                ${PRICING.single.price}
              </span>
            </div>
            <div className="text-lg font-semibold mb-1 text-text-primary font-mono">
              Single Theme
            </div>
            <p className="text-sm mb-2 leading-relaxed text-text-muted font-mono">
              Complete any one theme &mdash;{" "}
              {THEME_CONTENT.totalLessonsPerTheme} lessons,{" "}
              {THEME_CONTENT.modulesPerTheme} modules, one full ML
              specialization.
            </p>
            <div className="mb-4" />
            <ul className="mb-6 space-y-2.5">
              {[
                `${THEME_CONTENT.totalLessonsPerTheme} lessons`,
                `${THEME_CONTENT.modulesPerTheme} modules`,
                "All exercises + capstone project",
                "GitHub integration",
                "Lifetime updates",
                "Completion certificate",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-text-muted font-mono"
                >
                  <span className="text-[13px] font-bold flex-shrink-0 text-primary">
                    &#10003;
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Choose your theme
            </p>
            <ThemePicker
              max={1}
              selected={singleTheme ? [singleTheme] : []}
              onToggle={(slug) =>
                setSingleTheme(singleTheme === slug ? null : slug)
              }
            />
            <CheckoutButton
              planId="single"
              themeIds={singleTheme ? [singleTheme] : []}
              recommended
              disabled={!singleTheme}
              disabledReason="Select a theme above"
            >
              Get Started &rarr;
            </CheckoutButton>
          </div>
        </div>
      </section>

      {/* Bundle Pricing */}
      <section className="px-6 pb-24">
        <div className="max-w-[960px] mx-auto">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-6 text-text-muted font-mono">
            // Multi-theme bundles &mdash; save more
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {/* 2 Themes */}
            <div className="border border-border p-6 bg-surface flex flex-col">
              <div className="mb-2">
                <span className="text-3xl font-bold text-text-primary font-mono">
                  ${PRICING.twoBundle.price}
                </span>
                <span className="text-sm text-text-muted font-mono ml-2">
                  (${Math.round(PRICING.twoBundle.price / 2)}/theme)
                </span>
              </div>
              <div className="text-base font-semibold mb-1 text-text-primary font-mono">
                2 Themes
              </div>
              <p className="text-xs text-primary font-mono mb-4">
                Save ${PRICING.single.price * 2 - PRICING.twoBundle.price}
              </p>
              <div className="flex-1">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                  Choose 2 themes
                </p>
                <ThemePicker
                  max={2}
                  selected={twoThemes}
                  onToggle={(slug) =>
                    toggleInList(twoThemes, setTwoThemes, slug)
                  }
                />
              </div>
              <CheckoutButton
                planId="twoBundle"
                themeIds={twoThemes}
                disabled={twoThemes.length !== 2}
                disabledReason={`Select ${2 - twoThemes.length} more theme${2 - twoThemes.length !== 1 ? "s" : ""}`}
              >
                Get 2 Themes &rarr;
              </CheckoutButton>
            </div>

            {/* 3 Themes */}
            <div className="border border-border p-6 bg-surface flex flex-col">
              <div className="mb-2">
                <span className="text-3xl font-bold text-text-primary font-mono">
                  ${PRICING.threeBundle.price}
                </span>
                <span className="text-sm text-text-muted font-mono ml-2">
                  (${Math.round(PRICING.threeBundle.price / 3)}/theme)
                </span>
              </div>
              <div className="text-base font-semibold mb-1 text-text-primary font-mono">
                3 Themes
              </div>
              <p className="text-xs text-primary font-mono mb-4">
                Save ${PRICING.single.price * 3 - PRICING.threeBundle.price}
              </p>
              <div className="flex-1">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                  Choose 3 themes
                </p>
                <ThemePicker
                  max={3}
                  selected={threeThemes}
                  onToggle={(slug) =>
                    toggleInList(threeThemes, setThreeThemes, slug)
                  }
                />
              </div>
              <CheckoutButton
                planId="threeBundle"
                themeIds={threeThemes}
                disabled={threeThemes.length !== 3}
                disabledReason={`Select ${3 - threeThemes.length} more theme${3 - threeThemes.length !== 1 ? "s" : ""}`}
              >
                Get 3 Themes &rarr;
              </CheckoutButton>
            </div>

            {/* All 5 */}
            <div className="border border-primary p-6 bg-primary/5 flex flex-col">
              <div className="mb-2">
                <span className="text-3xl font-bold text-text-primary font-mono">
                  ${PRICING.allFive.price}
                </span>
                <span className="text-sm text-text-muted font-mono ml-2">
                  (${Math.round(PRICING.allFive.price / 5)}/theme)
                </span>
              </div>
              <div className="text-base font-semibold mb-1 text-text-primary font-mono">
                All 5 Themes
              </div>
              <p className="text-xs text-primary font-mono mb-4">
                Save ${PRICING.single.price * 5 - PRICING.allFive.price} &mdash;
                best value
              </p>
              <p className="flex-1 text-sm text-text-muted font-mono mb-5">
                Every theme, every specialization. Complete ML mastery across
                all 5 domains.
              </p>
              <CheckoutButton planId="allFive" themeIds={[...themeSlugs]}>
                Get All 5 &rarr;
              </CheckoutButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
