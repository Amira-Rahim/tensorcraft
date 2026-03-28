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
            Each theme teaches a different ML specialization. Buy what you need.
            Lifetime access, every future update included.
          </p>
        </section>

        {/* Active Pricing — Free + Single */}
        <section className="px-6 pb-16">
          <div className="max-w-[800px] mx-auto grid gap-5 sm:grid-cols-2">
            {/* Free */}
            <div className="relative p-7 flex flex-col border border-border bg-surface hover:border-primary hover:shadow-[4px_4px_0_var(--tc-primary)] transition-all">
              <div className="mb-2">
                <span className="text-5xl font-bold leading-tight text-text-primary font-mono">
                  $0
                </span>
              </div>
              <div className="text-lg font-semibold mb-1 text-text-primary font-mono">
                Free Preview
              </div>
              <p className="text-sm mb-2 leading-relaxed text-text-muted font-mono">
                Module 1 of Deep Orbit (5 lessons). Full code editor, bridges,
                and quizzes.
              </p>
              <p className="text-[13px] mb-6 text-primary font-mono">
                No credit card required
              </p>
              <ul className="flex-1 mb-7 space-y-2.5">
                {[
                  `${THEME_CONTENT.lessonsPerModule} lessons`,
                  "1 module",
                  "Full code editor",
                  "FE-to-ML bridges",
                  "Quizzes included",
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
              <Link
                href="/themes/deep-orbit"
                className="flex items-center justify-center w-full h-13 font-mono text-[15px] font-medium transition-all border border-primary text-primary hover:bg-primary hover:text-[#1C1C1C]"
              >
                Start Free &rarr;
              </Link>
            </div>

            {/* Single Theme — $79 */}
            <div className="relative p-7 flex flex-col border border-primary bg-[rgba(107,170,138,0.12)] hover:shadow-[4px_4px_0_var(--tc-primary)] transition-all">
              <span className="absolute -top-3 left-6 inline-flex items-center px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider bg-primary text-[#1C1C1C]">
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
              <div className="mb-6" />
              <ul className="flex-1 mb-7 space-y-2.5">
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
              <CheckoutButton
                planId="single"
                themeIds={["deep-orbit"]}
                recommended
              >
                Get Started &rarr;
              </CheckoutButton>
            </div>
          </div>
        </section>

        {/* Bundle Savings — Future Teaser */}
        <section className="px-6 pb-24">
          <div className="max-w-[960px] mx-auto">
            <div className="border border-border p-8 sm:p-10 bg-surface">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="flex-1">
                  <p className="text-[13px] uppercase tracking-[0.15em] mb-3 text-text-muted font-mono">
                    // Multi-theme bundles
                  </p>
                  <h3 className="text-2xl font-bold mb-3 text-text-primary font-mono tracking-tight">
                    Stack Your Skills, Save More
                  </h3>
                  <p className="text-sm text-text-muted font-mono leading-relaxed mb-5">
                    When more themes launch, bundle pricing kicks in. Buy 2
                    themes for ${PRICING.twoBundle.price} (save $
                    {PRICING.single.price * 2 - PRICING.twoBundle.price}) or 3
                    for ${PRICING.threeBundle.price} (save $
                    {PRICING.single.price * 3 - PRICING.threeBundle.price}).
                    Already own a theme? You&apos;ll only pay the difference.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-5">
                    {[
                      {
                        label: "2 Themes",
                        price: PRICING.twoBundle.price,
                        perTheme: Math.round(PRICING.twoBundle.price / 2),
                      },
                      {
                        label: "3 Themes",
                        price: PRICING.threeBundle.price,
                        perTheme: Math.round(PRICING.threeBundle.price / 3),
                      },
                      {
                        label: "All 5",
                        price:
                          PRICING.threeBundle.price +
                          PRICING.twoBundle.price -
                          PRICING.single.price,
                        perTheme: Math.round(
                          (PRICING.threeBundle.price +
                            PRICING.twoBundle.price -
                            PRICING.single.price) /
                            5,
                        ),
                      },
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="border border-border px-4 py-3 font-mono text-xs"
                      >
                        <span className="text-text-primary font-semibold">
                          {b.label}
                        </span>
                        <span className="text-text-muted"> &mdash; </span>
                        <span className="text-primary font-bold">
                          ${b.price}
                        </span>
                        <span className="text-text-muted">
                          {" "}
                          (${b.perTheme}/theme)
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-text-muted font-mono">
                    Bundle pricing will be available when additional themes
                    launch. Upgrade credit (pay only the difference) is planned
                    but not yet implemented &mdash; join the waitlist to be
                    notified when bundles go live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison — Simplified */}
        <section className="px-6 pb-24">
          <div className="max-w-[700px] mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-text-primary font-mono tracking-tight">
              Free vs Paid
            </h2>
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="grid grid-cols-3 border-b-2 border-border pb-4">
                  <div className="text-[13px] font-semibold uppercase tracking-wider text-text-muted font-mono px-3">
                    Feature
                  </div>
                  <div className="text-center text-[13px] font-semibold uppercase tracking-wider text-text-muted font-mono px-3">
                    Free
                  </div>
                  <div className="text-center text-[13px] font-semibold uppercase tracking-wider text-primary font-mono px-3">
                    Single ($79)
                  </div>
                </div>
                {[
                  { feature: "Modules", free: "1", paid: "11" },
                  { feature: "Lessons", free: "5", paid: "55" },
                  { feature: "Exercises", free: "Limited", paid: "All" },
                  { feature: "GitHub integration", free: false, paid: true },
                  { feature: "Capstone project", free: false, paid: true },
                  {
                    feature: "Completion certificate",
                    free: false,
                    paid: true,
                  },
                  { feature: "Lifetime updates", free: false, paid: true },
                ].map((row, i) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-3 items-center py-3.5 border-b border-border ${
                      i % 2 === 0 ? "bg-surface" : "bg-transparent"
                    }`}
                  >
                    <div className="text-sm text-text-primary px-3 font-mono">
                      {row.feature}
                    </div>
                    <div className="text-center text-sm px-3 font-mono text-text-muted">
                      {row.free === true
                        ? "\u2713"
                        : row.free === false
                          ? "\u2717"
                          : row.free}
                    </div>
                    <div
                      className={`text-center text-sm px-3 font-mono ${
                        row.paid === true
                          ? "text-primary font-bold"
                          : "text-text-muted"
                      }`}
                    >
                      {row.paid === true
                        ? "\u2713"
                        : row.paid === false
                          ? "\u2717"
                          : row.paid}
                    </div>
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
