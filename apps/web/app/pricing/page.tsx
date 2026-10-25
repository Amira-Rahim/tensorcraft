import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";
import { CurriculumPreview } from "./curriculum-preview";
import { PaymentError } from "./payment-error";
import { PaywallNotice } from "./paywall-notice";
import { PricingAnalytics } from "./pricing-analytics";
import { PricingTiers } from "./pricing-tiers";
import { buildPricingOffers } from "./pricing-jsonld";
import { AmbientBackground } from "@/app/components/ambient-background";

// 2026-08-14 (owner directive, screenshot feedback): future product plans are
// not shown to users. The bundle ladder left this page entirely: the
// BundleRoadmap section, the "$0 to $159" title range, and the bundle offers
// in the JSON-LD. Title, descriptions, and structured data name only what is
// buyable today. What to reinstate when more worlds launch is tracked in
// docs/post-launch-backlog.md ("Restore the bundle surfaces").
export const metadata: Metadata = {
  title: `ML Course Pricing: Free Preview, $${PRICING.single.price} per Course, Tensorcraft`,
  description: `Learn browser-based ML through familiar JavaScript concepts, with lifetime access for one payment. Free preview, $${PRICING.single.price} per course.`,
  alternates: { canonical: "https://tensorcraft.app/pricing" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/pricing",
    siteName: "Tensorcraft",
    title: "Course pricing, Tensorcraft",
    description: `Try the free preview. Lifetime access to the full course costs $${PRICING.single.price}.`,
    images: [
      {
        url: "/api/og?title=Course%20pricing&subtitle=Lifetime%20access%20with%20one%20payment&world=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft course pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course pricing, Tensorcraft",
    description: `Try the free preview. Lifetime access to the full course costs $${PRICING.single.price}.`,
    images: [
      "/api/og?title=Course%20pricing&subtitle=Lifetime%20access%20with%20one%20payment&world=deep-orbit",
    ],
  },
};

export const revalidate = 3600;

export default function PricingPage() {
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Tensorcraft course pricing",
    url: "https://tensorcraft.app/pricing",
    description:
      "Try Module 1 for free, then pay once for lifetime access to the full course.",
    itemListElement: buildPricingOffers(),
  };

  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
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

        {/* Hero. pt-0: the banner container above already carries pt-24, so
            the header-to-title gap is 96px, matched with /worlds and /blog
            (owner, 2026-09-01). */}
        <section className="pt-0 pb-14 px-6 text-center">
          {/* Keep the established two-line heading and fluid type scale.
              The trailing space preserves readable text across the spans. */}
          <h1
            data-testid="pricing-heading"
            className="text-[clamp(2.25rem,calc(13vw-0.5rem),9rem)] leading-[1.02] font-bold mb-6 text-text-primary font-mono tracking-tight"
          >
            <span className="block">Course </span>
            <span className="block">pricing</span>
          </h1>
          <p className="text-lg sm:text-2xl max-w-[70ch] mx-auto text-text-muted font-sans">
            Deep Orbit is available now. One payment gives you lifetime access
            to the course and all its updates.
          </p>
        </section>

        {/* Refund guarantee badge.
            Sits ABOVE the grid on purpose: risk reversal only works if the
            buyer reads it while deciding. Below the tiers it was under the
            fold at exactly the moment the objection fires. */}
        <section
          className="px-6 pt-2 pb-8"
          data-testid="refund-guarantee-section"
        >
          <div className="max-w-5xl mx-auto min-w-0">
            <div
              data-testid="refund-guarantee-badge"
              className="flex items-center gap-3 border border-border bg-surface/60 px-5 py-4 font-mono text-[13px] md:text-[15px] text-text-muted rounded-none"
            >
              <span
                aria-hidden="true"
                className="text-primary font-bold shrink-0"
              >
                &#10003;
              </span>
              <p className="m-0 text-text-primary leading-relaxed min-w-0">
                <span className="text-primary font-bold">
                  A 5-day money-back guarantee.
                </span>{" "}
                <span className="text-text-muted">
                  Full refund, no questions asked.{" "}
                </span>
                <Link
                  href="/terms#refunds"
                  className="underline underline-offset-[3px] decoration-text-muted/60 hover:text-primary hover:decoration-primary transition-colors"
                >
                  See terms
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Buyable tiers: Free and Single. No Suspense on purpose: the grid
            must be in the server HTML, or its late arrival shifts the page
            (CLS 0.359, 2026-10-25). Without a boundary, a useSearchParams
            call added to PricingTiers fails the build instead of quietly
            turning the grid client-only again. */}
        <PricingTiers />

        {/* Curriculum preview, what a purchase unlocks */}
        <CurriculumPreview />

        {/* The Common Questions FAQ block was removed from this page
            2026-09-01 (owner request); the landing page keeps the shared
            FaqSection and its FAQPage JSON-LD. Objection copy on /pricing
            is now the refund badge plus the tier cards themselves. */}

        {/* CTA Footer */}
        <section className="py-24 px-6 text-center border-t border-border">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-4 text-text-muted font-mono">
            tensors, neural networks, and browser exercises
          </p>
          {/* The "Start with the free module..." line was removed
              2026-09-01 (owner request); the h2 takes its bottom margin so
              the CTA keeps its breathing room. Fluid one-liner (same family
              as the page h1): 23 mono chars at 0.575em per char fit the
              px-6 gutters from ~720px up; the 5.5rem ceiling keeps this h2
              subordinate to the 6rem-capped page h1. */}
          <h2 className="text-[clamp(1.5rem,calc(7.5vw-0.25rem),5.5rem)] font-bold mb-10 text-text-primary font-mono tracking-tight">
            The free first module
          </h2>
          {/* The close does what the sentence above says: the free start.
              Was "See All 5 Worlds" pointing at /worlds, four of which are
              coming-soon and unbuyable (future plans are not user-facing,
              header comment above). */}
          <Link
            href="/worlds/deep-orbit/foundations/introduction-to-tensors"
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-on-primary border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            Start Module 1
          </Link>
        </section>
      </div>
    </main>
  );
}
