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
import { FaqSection } from "@/app/components/faq-section";

// 2026-08-14 (owner directive, screenshot feedback): future product plans are
// not shown to users. The bundle ladder left this page entirely: the
// BundleRoadmap section, the "$0 to $159" title range, and the bundle offers
// in the JSON-LD. Title, descriptions, and structured data name only what is
// buyable today. What to reinstate when more worlds launch is tracked in
// docs/post-launch-backlog.md ("Restore the bundle surfaces").
export const metadata: Metadata = {
  title: `ML Course Pricing: Free Preview, $${PRICING.single.price} per Course | Tensorcraft`,
  description: `One payment. Lifetime access. Learn browser-based ML through JavaScript concepts you already know. Free preview, $${PRICING.single.price} per course.`,
  alternates: { canonical: "https://tensorcraft.app/pricing" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/pricing",
    siteName: "Tensorcraft",
    title: "Buy Once. Keep It Forever. | Tensorcraft",
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per course.`,
    images: [
      {
        url: "/api/og?title=Buy%20Once.%20Keep%20It%20Forever.&subtitle=One%20payment.%20Lifetime%20access.&world=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft: Buy Once. Keep It Forever.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Once. Keep It Forever. | Tensorcraft",
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per course.`,
    images: [
      "/api/og?title=Buy%20Once.%20Keep%20It%20Forever.&subtitle=One%20payment.%20Lifetime%20access.&world=deep-orbit",
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
      "One-payment lifetime-access pricing for the Tensorcraft browser-ML course: free preview and one-time course purchase.",
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

        {/* Hero */}
        <section className="pt-24 pb-14 px-6 text-center">
          {/* Fluid one-liner (owner: "spread across the grid", 2026-08-31,
              same pattern as the landing hero and /learn H1): 24 mono chars
              at 0.575em per char (0.6em advance minus tracking-tight's
              0.025em) fit inside the px-6 gutters from ~640px up. The
              2.25rem floor keeps the old mobile size, where the sentence
              breaks into its two clean halves. */}
          <h1
            data-testid="pricing-heading"
            className="text-[clamp(2.25rem,calc(7vw-0.5rem),6rem)] font-bold mb-6 text-text-primary font-mono tracking-tight"
          >
            Buy once. Keep forever.
          </h1>
          <p className="text-lg sm:text-2xl max-w-[70ch] mx-auto text-text-muted font-sans">
            Each world is a separate ML specialization. Deep Orbit is the one
            available today: buy once, get lifetime access, no subscription, all
            updates included.
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

        {/* Buyable tiers: Free and Single. */}
        {/* Suspense: PricingTiers reads useSearchParams to restore a
            selection carried through the auth roundtrip. */}
        <Suspense fallback={null}>
          <PricingTiers />
        </Suspense>

        {/* Curriculum preview, what a purchase unlocks */}
        <CurriculumPreview />

        {/* FAQ. Objections peak here, not on the landing page, so the same
            answers render on both. Shared component, single-sourced with the
            FAQPage JSON-LD via app/faq-data.ts. */}
        <FaqSection
          testId="pricing-faq"
          eyebrow="Before you buy"
          heading="Common Questions"
          containerClassName="px-6 max-w-4xl mx-auto w-full"
          className="border-t border-border"
        />

        {/* CTA Footer */}
        <section className="py-24 px-6 text-center border-t border-border">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-4 text-text-muted font-mono">
            your javascript is the foundation
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary font-mono tracking-tight">
            Add ML to your engineering toolkit.
          </h2>
          <p className="text-base mb-10 text-text-muted font-sans max-w-130 mx-auto">
            Start with the free module. Buy when you want the other ten.
          </p>
          {/* The close does what the sentence above says: the free start.
              Was "See All 5 Worlds" pointing at /worlds, four of which are
              coming-soon and unbuyable (future plans are not user-facing,
              header comment above). */}
          <Link
            href="/worlds/deep-orbit/foundations/introduction-to-tensors"
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-on-primary border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            Start Module 1 &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
