import Link from "next/link";
import { Suspense } from "react";
import { THEME_CONTENT } from "@tensorcraft/shared";
import type { Metadata } from "next";
import { PaymentError } from "./payment-error";
import { PricingTiers } from "./pricing-tiers";
import { AmbientBackground } from "@/app/components/ambient-background";

export const metadata: Metadata = {
  title: "ML Course Pricing — From $0 to $219 | Tensorcraft",
  description:
    "One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts.",
  alternates: { canonical: "https://tensorcraft.app/pricing" },
};

export const revalidate = 3600;

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
          <p className="text-lg max-w-[520px] mx-auto text-text-muted font-sans">
            Each theme teaches a different ML specialization. Buy what you need.
            Lifetime access, every future update included.
          </p>
        </section>

        {/* Free Preview */}
        <section className="px-6 pb-16">
          <div className="max-w-[800px] mx-auto">
            <div className="relative p-7 flex flex-col border border-border bg-surface hover:border-primary hover:shadow-[4px_4px_0_var(--tc-primary)] transition-all">
              <div className="mb-2">
                <span className="text-5xl font-bold leading-tight text-text-primary font-mono">
                  $0
                </span>
              </div>
              <div className="text-lg font-semibold mb-1 text-text-primary font-mono">
                Free Preview
              </div>
              <p className="text-sm mb-2 leading-relaxed text-text-muted font-sans">
                Module 1 of any theme (5 lessons). Full code editor, bridges,
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
                href="/themes"
                className="flex items-center justify-center w-full h-13 font-mono text-[15px] font-medium transition-all border border-primary text-primary hover:bg-primary hover:text-[#1C1C1C]"
              >
                Start Free &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Paid Tiers — Single + Bundles */}
        <PricingTiers />

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
          <p className="text-lg mb-10 text-text-muted font-sans">
            Add machine learning to your engineering toolkit.
          </p>
          <Link
            href="/themes"
            className="inline-flex items-center font-mono px-9 py-4 text-base font-medium transition-all bg-primary text-[#1C1C1C] border border-primary hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            Explore All Themes &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
