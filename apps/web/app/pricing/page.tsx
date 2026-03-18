import Link from "next/link";
import { Suspense } from "react";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import type { Metadata } from "next";
import { PaymentError } from "./payment-error";
import { CheckoutButton } from "./checkout-button";
import { AmbientBackground } from "@/app/components/ambient-background";

export const metadata: Metadata = {
  title: "Pricing | Tensorcraft",
  description:
    "One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts.",
};

const tiers = [
  {
    id: "free" as const,
    features: [
      `${THEME_CONTENT.lessonsPerModule} lessons`,
      "1 module",
      "Full code editor",
      "FE-to-ML bridges",
      "Quizzes included",
    ],
    description:
      "Module 1 of Deep Orbit (5 lessons). Full code editor, bridges, and quizzes.",
    note: "No credit card required",
    cta: "Start Free",
    href: "/themes/deep-orbit",
    recommended: false,
  },
  {
    id: "single" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons`,
      `${THEME_CONTENT.modulesPerTheme} modules`,
      "All exercises",
      "GitHub integration",
      "Lifetime updates",
    ],
    description: `Complete Deep Orbit \u2014 ${THEME_CONTENT.totalLessonsPerTheme} lessons, ${THEME_CONTENT.modulesPerTheme} modules`,
    note: "",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/single",
    recommended: true,
  },
  {
    id: "twoBundle" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons per theme`,
      `${THEME_CONTENT.modulesPerTheme} modules per theme`,
      "All exercises",
      "GitHub integration",
      "Lifetime updates",
      "Choose any 2 themes",
    ],
    description: "Any two themes",
    note: "Save $29 vs buying separately",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/twoBundle",
    recommended: false,
  },
  {
    id: "threeBundle" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons per theme`,
      `${THEME_CONTENT.modulesPerTheme} modules per theme`,
      "All exercises",
      "GitHub integration",
      "Lifetime updates",
      "Choose any 3 themes",
    ],
    description: "Any three themes",
    note: "Save $68 vs buying separately \u2014 best value",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/threeBundle",
    recommended: false,
  },
];

const comparisonRows = [
  {
    feature: "Modules",
    values: [
      "1",
      `${THEME_CONTENT.modulesPerTheme}`,
      `${THEME_CONTENT.modulesPerTheme} \u00d7 2`,
      `${THEME_CONTENT.modulesPerTheme} \u00d7 3`,
    ],
  },
  {
    feature: "Lessons",
    values: [
      `${THEME_CONTENT.lessonsPerModule}`,
      `${THEME_CONTENT.totalLessonsPerTheme}`,
      `${THEME_CONTENT.totalLessonsPerTheme * 2}`,
      `${THEME_CONTENT.totalLessonsPerTheme * 3}`,
    ],
  },
  {
    feature: "Interactive exercises",
    values: [true, true, true, true],
  },
  {
    feature: "GitHub integration",
    values: [false, true, true, true],
  },
  {
    feature: "Lifetime updates",
    values: [false, true, true, true],
  },
];

const columnHeaders = ["Free", "Single", "Two", "Three"];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface relative overflow-hidden">
      <AmbientBackground count={200} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="relative z-10">
        {/* Payment Error Banner */}
        <div className="pt-24 px-6">
          <Suspense fallback={null}>
            <PaymentError />
          </Suspense>
        </div>

        {/* Hero */}
        <section className="pt-28 pb-16 px-6 text-center">
          <div className="inline-flex px-5 py-2 border border-border font-mono text-[13px] text-text-muted tracking-wider mb-8">
            One Payment &middot; Lifetime Access &middot; No Subscriptions
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 text-text-primary font-mono tracking-tight">
            Simple, Fair Pricing
          </h1>
          <p className="text-lg max-w-[520px] mx-auto text-text-muted font-mono">
            One payment. Lifetime access. Every future update included. No
            subscriptions, ever.
          </p>
        </section>

        {/* Pricing Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-[1200px] mx-auto grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => {
              const plan = PRICING[tier.id];
              const isRecommended = tier.recommended;

              return (
                <div
                  key={tier.id}
                  className={`relative p-7 flex flex-col transition-all border hover:border-primary hover:shadow-[4px_4px_0_var(--tc-primary)] ${
                    isRecommended
                      ? "bg-[rgba(107,170,138,0.12)] border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-6 inline-flex items-center px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider bg-primary text-[#1C1C1C]">
                      RECOMMENDED
                    </span>
                  )}

                  <div className={`${isRecommended ? "mt-2" : ""} mb-2`}>
                    <span className="text-5xl font-bold leading-tight text-text-primary font-mono">
                      ${plan.price}
                    </span>
                  </div>
                  <div className="text-lg font-semibold mb-1 text-text-primary font-mono">
                    {plan.label}
                  </div>
                  <p className="text-sm mb-2 leading-relaxed text-text-muted font-mono">
                    {tier.description}
                  </p>
                  {tier.note ? (
                    <p className="text-[13px] mb-6 text-primary font-mono">
                      {tier.note}
                    </p>
                  ) : (
                    <div className="mb-6" />
                  )}

                  <ul className="flex-1 mb-7 space-y-2.5">
                    {tier.features.map((f) => (
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

                  {tier.id === "free" ? (
                    <Link
                      href={tier.href}
                      className="flex items-center justify-center w-full h-[52px] font-mono text-[15px] font-medium transition-all border border-primary text-primary hover:bg-primary hover:text-[#1C1C1C]"
                    >
                      {tier.cta} &rarr;
                    </Link>
                  ) : tier.id === "single" ? (
                    <CheckoutButton
                      planId={tier.id}
                      themeIds={["deep-orbit"]}
                      recommended={isRecommended}
                    >
                      {tier.cta} &rarr;
                    </CheckoutButton>
                  ) : (
                    <CheckoutButton
                      planId={tier.id}
                      themeIds={["deep-orbit"]}
                      recommended={isRecommended}
                      disabled
                      disabledReason="Available when more themes launch"
                    >
                      {tier.cta} &rarr;
                    </CheckoutButton>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="px-6 pb-24">
          <div className="max-w-[960px] mx-auto">
            <div className="h-px max-w-[600px] mx-auto mb-14 bg-border" />
            <p className="text-[13px] uppercase tracking-[0.15em] text-center mb-3 text-text-muted font-mono">
              Compare Plans
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14 text-text-primary font-mono tracking-tight">
              Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Column Headers */}
                <div className="grid grid-cols-5 border-b-2 border-border pb-4 mb-0">
                  <div className="text-[13px] font-semibold uppercase tracking-wider text-text-muted font-mono px-3">
                    Feature
                  </div>
                  {columnHeaders.map((h) => (
                    <div
                      key={h}
                      className="text-center text-[13px] font-semibold uppercase tracking-wider text-text-muted font-mono px-3"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {comparisonRows.map((row, rowIndex) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-5 items-center py-3.5 border-b border-border ${
                      rowIndex % 2 === 0 ? "bg-surface" : "bg-transparent"
                    }`}
                  >
                    <div className="text-sm text-text-primary px-3 font-mono">
                      {row.feature}
                    </div>
                    {row.values.map((val, i) => (
                      <div
                        key={i}
                        className={`text-center text-sm px-3 font-mono ${
                          val === true
                            ? "text-primary font-bold"
                            : val === false
                              ? "text-text-muted"
                              : "text-text-muted"
                        }`}
                      >
                        {val === true
                          ? "\u2713"
                          : val === false
                            ? "\u2717"
                            : val}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-28 px-6 text-center border-t border-border">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary font-mono tracking-tight">
            Your frontend skills are the foundation.
          </h2>
          <p className="text-lg mb-10 text-text-muted font-mono">
            Add machine learning to your engineering toolkit.
          </p>
          <Link
            href="/themes/deep-orbit"
            className="inline-flex items-center font-mono px-9 py-4 text-base font-medium transition-all bg-primary text-[#1C1C1C] border border-primary hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            Explore Deep Orbit &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
