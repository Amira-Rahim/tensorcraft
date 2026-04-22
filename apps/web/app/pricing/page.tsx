import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentError } from "./payment-error";
import { PaywallNotice } from "./paywall-notice";
import { PricingAnalytics } from "./pricing-analytics";
import { PricingTiers } from "./pricing-tiers";
import { AmbientBackground } from "@/app/components/ambient-background";

export const metadata: Metadata = {
  title: "ML Course Pricing — From $0 to $219 | Tensorcraft",
  description:
    "One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts. Free preview, $79 per theme, bundles up to $219.",
  alternates: { canonical: "https://tensorcraft.app/pricing" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/pricing",
    siteName: "Tensorcraft",
    title: "Simple, Fair Pricing — Tensorcraft",
    description:
      "One payment. Lifetime access. $0 preview, $79 per theme, bundles up to $219.",
    images: [
      {
        url: "/api/og?title=Simple%2C%20Fair%20Pricing&subtitle=One%20payment.%20Lifetime%20access.&theme=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft — Simple, Fair Pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple, Fair Pricing — Tensorcraft",
    description:
      "One payment. Lifetime access. $0 preview, $79 per theme, bundles up to $219.",
    images: [
      "/api/og?title=Simple%2C%20Fair%20Pricing&subtitle=One%20payment.%20Lifetime%20access.&theme=deep-orbit",
    ],
  },
};

export const revalidate = 3600;

/**
 * Feature comparison matrix — rendered under the tier grid.
 * Each row describes availability across the 5 tiers.
 * `true` = included, `false` = not included, string = descriptive cell value.
 */
type TierKey = "free" | "single" | "twoBundle" | "threeBundle" | "allFive";
const FEATURE_MATRIX: {
  feature: string;
  values: Record<TierKey, boolean | string>;
}[] = [
  {
    feature: "Module 1 access",
    values: {
      free: true,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "All 11 modules",
    values: {
      free: false,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Themes included",
    values: {
      free: "1 preview",
      single: "1",
      twoBundle: "2",
      threeBundle: "3",
      allFive: "All 5",
    },
  },
  {
    feature: "Code exercises",
    values: {
      free: "Limited",
      single: "All",
      twoBundle: "All",
      threeBundle: "All",
      allFive: "All",
    },
  },
  {
    feature: "GitHub push",
    values: {
      free: false,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Capstone project",
    values: {
      free: false,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Certificate",
    values: {
      free: false,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Bridge explorer",
    values: {
      free: true,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Lifetime updates",
    values: {
      free: false,
      single: true,
      twoBundle: true,
      threeBundle: true,
      allFive: true,
    },
  },
  {
    feature: "Priority support",
    values: {
      free: false,
      single: false,
      twoBundle: false,
      threeBundle: false,
      allFive: true,
    },
  },
];

const TIER_COLUMNS: { key: TierKey; label: string; price: string }[] = [
  { key: "free", label: "Free", price: "$0" },
  { key: "single", label: "Single", price: "$79" },
  { key: "twoBundle", label: "Two", price: "$129" },
  { key: "threeBundle", label: "Three", price: "$169" },
  { key: "allFive", label: "All 5", price: "$219" },
];

function renderCell(value: boolean | string) {
  if (value === true) {
    return (
      <span
        className="inline-block text-primary font-bold"
        aria-label="Included"
      >
        &#10003;
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        className="inline-block text-text-muted/50"
        aria-label="Not included"
      >
        &#10007;
      </span>
    );
  }
  return <span className="text-text-primary">{value}</span>;
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <AmbientBackground count={200} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="relative z-10">
        {/* Payment Error / Paywall Context Banner */}
        <div className="pt-24 px-6 space-y-4">
          <Suspense fallback={null}>
            <PaymentError />
          </Suspense>
          <Suspense fallback={null}>
            <PaywallNotice />
          </Suspense>
          <Suspense fallback={null}>
            <PricingAnalytics />
          </Suspense>
        </div>

        {/* Hero */}
        <section className="pt-24 pb-14 px-6 text-center">
          <div className="inline-flex px-5 py-2 border border-border font-mono text-[13px] text-text-muted tracking-wider mb-8 rounded-none">
            // one payment &middot; lifetime access &middot; no subscriptions
          </div>
          <h1
            data-testid="pricing-heading"
            className="text-4xl sm:text-5xl font-bold mb-5 text-text-primary font-mono tracking-tight"
          >
            Simple, Fair Pricing
          </h1>
          <p className="text-base sm:text-lg max-w-140 mx-auto text-text-muted font-sans">
            Each theme is a separate ML specialization. Buy one, bundle a few,
            or all five themes, one payment &mdash; lifetime access.
          </p>
        </section>

        {/* 5-tier Pricing Grid */}
        <PricingTiers />

        {/* Refund guarantee badge */}
        <section
          className="px-6 pt-2 pb-10"
          data-testid="refund-guarantee-section"
        >
          <div className="max-w-4xl mx-auto min-w-0">
            <div
              data-testid="refund-guarantee-badge"
              className="flex items-center gap-3 border border-border bg-surface/60 px-5 py-4 font-mono text-[13px] text-text-muted rounded-none"
            >
              <span
                aria-hidden="true"
                className="text-primary font-bold shrink-0"
              >
                &#10003;
              </span>
              <p className="m-0 text-text-primary leading-relaxed min-w-0">
                <span className="text-primary font-bold">
                  14-day money-back guarantee
                </span>
                <span className="text-text-muted">
                  {" "}
                  &mdash; full refund if you&rsquo;ve used less than 20% of a
                  theme.{" "}
                </span>
                <Link
                  href="/terms#refunds"
                  className="underline underline-offset-[3px] decoration-text-muted/40 hover:text-primary hover:decoration-primary transition-colors"
                >
                  See terms
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-6 pb-24" data-testid="comparison-table-section">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-text-primary font-mono tracking-tight">
              Feature Comparison
            </h2>
            <p className="text-center text-sm text-text-muted font-mono uppercase tracking-wider mb-10">
              // what&rsquo;s included in each tier
            </p>
            <div
              className="overflow-x-auto border border-border rounded-none"
              data-testid="comparison-table"
            >
              <table
                className="w-full min-w-180 border-collapse font-mono"
                aria-label="Pricing tier feature comparison"
              >
                <thead>
                  <tr className="bg-surface">
                    <th
                      scope="col"
                      className="text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted px-4 py-4 border-r border-border"
                    >
                      Feature
                    </th>
                    {TIER_COLUMNS.map((col, idx) => (
                      <th
                        key={col.key}
                        scope="col"
                        data-testid={`comparison-col-${col.key}`}
                        className={`text-center px-4 py-4 ${
                          idx < TIER_COLUMNS.length - 1
                            ? "border-r border-border"
                            : ""
                        } ${col.key === "allFive" ? "bg-primary/10" : ""}`}
                      >
                        <div
                          className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
                            col.key === "allFive"
                              ? "text-primary"
                              : "text-text-muted"
                          }`}
                        >
                          {col.label}
                        </div>
                        <div
                          className={`mt-1 text-base font-bold ${
                            col.key === "allFive"
                              ? "text-primary"
                              : "text-text-primary"
                          }`}
                        >
                          {col.price}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MATRIX.map((row, rowIdx) => (
                    <tr
                      key={row.feature}
                      className={
                        rowIdx % 2 === 0 ? "bg-transparent" : "bg-surface/60"
                      }
                    >
                      <th
                        scope="row"
                        className="text-left text-xs sm:text-sm font-medium text-text-primary px-4 py-3 border-t border-r border-border font-mono"
                      >
                        {row.feature}
                      </th>
                      {TIER_COLUMNS.map((col, idx) => (
                        <td
                          key={col.key}
                          className={`text-center text-sm px-4 py-3 border-t border-border ${
                            idx < TIER_COLUMNS.length - 1 ? "border-r" : ""
                          } ${col.key === "allFive" ? "bg-primary/5" : ""}`}
                        >
                          {renderCell(row.values[col.key])}
                        </td>
                      ))}
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

        {/* CTA Footer */}
        <section className="py-24 px-6 text-center border-t border-border">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-4 text-text-muted font-mono">
            // your frontend is the foundation
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary font-mono tracking-tight">
            Add ML to your engineering toolkit.
          </h2>
          <p className="text-base mb-10 text-text-muted font-sans max-w-130 mx-auto">
            Start with the free preview. Upgrade when you&rsquo;re ready.
          </p>
          <Link
            href="/themes"
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-page border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            Explore All Themes &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
