import Link from "next/link";
import type { Metadata } from "next";
import { AmbientBackground } from "@/app/components/ambient-background";

/**
 * Dedicated paywall / upsell page — Phase 11 §11d Wave 3.
 *
 * Separate from `/pricing?locked=<slug>` (which is a contextual banner shown
 * when a learner is redirected from a gated lesson). This page is the
 * hard-sell landing target for:
 *   - direct marketing campaigns (email, social)
 *   - "end of Module 1" prompt after a learner finishes the free preview
 *   - any other surface that wants to pitch the paid course without forcing
 *     a specific theme context
 *
 * The CTA points at `/pricing` so the plan picker + Stripe flow stay in one
 * place. This page focuses on (1) framing the value, (2) a tight free vs
 * paid comparison, and (3) social proof.
 */

export const metadata: Metadata = {
  title: "Continue Your ML Journey | Tensorcraft",
  description:
    "Unlock all 11 modules, the capstone, certificate, and GitHub push flow. One payment, lifetime access — from $79.",
  // Gated-content upsell page; not an SEO target.
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

type ComparisonRow = {
  feature: string;
  free: string | false;
  paid: string | true;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Module 1 preview", free: "Included", paid: true },
  { feature: "All 11 modules", free: false, paid: true },
  { feature: "55 lessons", free: false, paid: true },
  { feature: "Code exercises (all)", free: false, paid: true },
  { feature: "GitHub push flow", free: false, paid: true },
  { feature: "Capstone project", free: false, paid: true },
  { feature: "Certificate of completion", free: false, paid: true },
  { feature: "Discord community access", free: false, paid: true },
  { feature: "Lifetime updates", free: false, paid: true },
];

type Testimonial = {
  quote: string;
  attribution: string;
  role: string;
};

// V0.5 placeholder testimonials — swap for real beta quotes post-launch.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The frontend bridges finally made tensors click. I stopped translating ML into React and started reading ML directly.",
    attribution: "BETA_USER_01",
    role: "Senior FE Engineer",
  },
  {
    quote:
      "Shipped my first ONNX model to production in week three. The course structure mirrors how I already ship shipping features.",
    attribution: "BETA_USER_02",
    role: "Full-stack Developer",
  },
  {
    quote:
      "Dense, but never hand-wavy. Every lesson has a runnable exercise and a bridge to something I already know.",
    attribution: "BETA_USER_03",
    role: "Staff Frontend Engineer",
  },
];

function renderFreeCell(value: ComparisonRow["free"]) {
  if (value === false) {
    return (
      <span
        className="inline-block text-text-muted/60 font-mono"
        aria-label="Not included"
      >
        &#10007;
      </span>
    );
  }
  return <span className="text-text-primary font-mono text-sm">{value}</span>;
}

function renderPaidCell(value: ComparisonRow["paid"]) {
  if (value === true) {
    return (
      <span
        className="inline-block text-primary font-bold font-mono"
        aria-label="Included"
      >
        &#10003;
      </span>
    );
  }
  return <span className="text-text-primary font-mono text-sm">{value}</span>;
}

export default function PaywallPage() {
  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <AmbientBackground count={180} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6 text-center">
          <div className="inline-flex px-5 py-2 border border-border font-mono text-[13px] text-text-muted tracking-wider mb-8 rounded-none">
            // module 1 complete &middot; the real work starts here
          </div>
          <h1
            data-testid="paywall-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-text-primary font-mono tracking-tight leading-tight"
          >
            Continue Your ML Journey
          </h1>
          <p className="text-base sm:text-lg max-w-160 mx-auto text-text-muted font-sans leading-relaxed">
            You&rsquo;ve seen the bridge. Modules 2&ndash;11 are where you stop
            translating and start shipping &mdash; tensors, backprop, transfer
            learning, and a capstone you run in production.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/pricing"
              data-testid="paywall-primary-cta"
              className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-page border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
            >
              See Plans &rarr;
            </Link>
            <Link
              href="/themes/deep-orbit"
              className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider text-text-primary border border-border rounded-none hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-colors"
            >
              Replay Module 1
            </Link>
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.15em] text-text-muted font-mono">
            // one payment &middot; lifetime access &middot; from $79
          </p>
        </section>

        {/* Free vs Paid Comparison */}
        <section className="px-6 pb-20" data-testid="comparison-section">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-text-primary font-mono tracking-tight">
              Free vs Paid
            </h2>
            <p className="text-center text-sm text-text-muted font-mono uppercase tracking-wider mb-10">
              // what you unlock when you upgrade
            </p>
            <div
              className="overflow-x-auto border border-border rounded-none"
              data-testid="comparison-table"
            >
              <table
                className="w-full min-w-140 border-collapse font-mono"
                aria-label="Free vs paid feature comparison"
              >
                <thead>
                  <tr className="bg-surface">
                    <th
                      scope="col"
                      className="text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted px-4 py-4 border-r border-border"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      data-testid="comparison-col-free"
                      className="text-center px-4 py-4 border-r border-border"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                        Free
                      </div>
                      <div className="mt-1 text-base font-bold text-text-primary">
                        $0
                      </div>
                    </th>
                    <th
                      scope="col"
                      data-testid="comparison-col-paid"
                      className="text-center px-4 py-4 bg-primary/10"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                        Paid
                      </div>
                      <div className="mt-1 text-base font-bold text-primary">
                        From $79
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={
                        idx % 2 === 0 ? "bg-transparent" : "bg-surface/60"
                      }
                    >
                      <th
                        scope="row"
                        className="text-left text-xs sm:text-sm font-medium text-text-primary px-4 py-3 border-t border-r border-border font-mono"
                      >
                        {row.feature}
                      </th>
                      <td className="text-center text-sm px-4 py-3 border-t border-r border-border">
                        {renderFreeCell(row.free)}
                      </td>
                      <td className="text-center text-sm px-4 py-3 border-t border-border bg-primary/5">
                        {renderPaidCell(row.paid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] text-text-muted font-mono uppercase tracking-wider">
              // scroll horizontally on small screens
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section
          className="px-6 pb-24 border-t border-border pt-20"
          data-testid="social-proof-section"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-text-primary font-mono tracking-tight">
              Frontend Engineers Who Shipped ML
            </h2>
            <p className="text-center text-sm text-text-muted font-mono uppercase tracking-wider mb-12">
              // placeholder quotes during beta &middot; real testimonials
              post-launch
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.attribution}
                  data-testid={`testimonial-${t.attribution.toLowerCase()}`}
                  className="flex flex-col justify-between border border-border bg-surface/40 p-6 rounded-none"
                >
                  <blockquote className="text-sm text-text-primary font-sans leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="pt-4 border-t border-border">
                    <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-primary">
                      {t.attribution}
                    </div>
                    <div className="mt-1 text-xs font-mono text-text-muted">
                      {t.role}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 text-center border-t border-border">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-4 text-text-muted font-mono">
            // ready when you are
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary font-mono tracking-tight">
            Pick a plan. Own it forever.
          </h2>
          <p className="text-base mb-10 text-text-muted font-sans max-w-130 mx-auto">
            Single theme, a bundle, or all five &mdash; no subscriptions, no
            expiring access.
          </p>
          <Link
            href="/pricing"
            data-testid="paywall-footer-cta"
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-page border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            See Plans &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
