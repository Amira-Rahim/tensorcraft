import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";
import { EXTRAS_LESSON_COUNT } from "@tensorcraft/content";
import { BundleRoadmap } from "./bundle-roadmap";
import { CurriculumPreview } from "./curriculum-preview";
import { PaymentError } from "./payment-error";
import { PaywallNotice } from "./paywall-notice";
import { PricingAnalytics } from "./pricing-analytics";
import { PricingTiers } from "./pricing-tiers";
import { buildPricingOffers } from "./pricing-jsonld";
import { AmbientBackground } from "@/app/components/ambient-background";
import { FaqSection } from "@/app/components/faq-section";

// 2026-08-09: the three descriptions below used to end "bundles up to $159".
// With one theme launched, no bundle is purchasable at any price, so a search
// result promising them invited a click the page could not honour. The
// descriptions now name only what is buyable. The TITLE keeps its "$0 to $159"
// range on purpose: a range describes the ladder, which genuinely exists and is
// stated on the page, rather than advertising an unbuyable SKU. Restore the
// bundle clause when LAUNCHED_THEMES grows past one.
export const metadata: Metadata = {
  title: `ML Course Pricing: From $0 to $${PRICING.allFive.price} | Tensorcraft`,
  description: `One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts. Free preview, $${PRICING.single.price} per theme.`,
  alternates: { canonical: "https://tensorcraft.app/pricing" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/pricing",
    siteName: "Tensorcraft",
    title: "Buy a Theme. Keep It Forever. | Tensorcraft",
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per theme.`,
    images: [
      {
        url: "/api/og?title=Buy%20a%20Theme.%20Keep%20It%20Forever.&subtitle=One%20payment.%20Lifetime%20access.&theme=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft: Buy a Theme. Keep It Forever.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy a Theme. Keep It Forever. | Tensorcraft",
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per theme.`,
    images: [
      "/api/og?title=Buy%20a%20Theme.%20Keep%20It%20Forever.&subtitle=One%20payment.%20Lifetime%20access.&theme=deep-orbit",
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
      "One-payment lifetime-access tiers for the Tensorcraft browser-ML course. Per-theme single purchase, multi-theme bundles, and an all-five bundle.",
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
          <div className="inline-flex px-5 py-2 border border-border font-mono text-[13px] text-text-muted tracking-wider mb-8 rounded-none">
            one payment &middot; lifetime access &middot; no subscriptions
          </div>
          <h1
            data-testid="pricing-heading"
            className="text-4xl sm:text-5xl font-bold mb-5 text-text-primary font-mono tracking-tight"
          >
            Buy once. Keep forever.
          </h1>
          {/* 2026-08-09: was "Buy one, bundle a few, or all five themes",
              which offered two actions no buyer can take while one theme is
              launched. Same defect as the metadata above and the tier grid
              below; fixed in the same pass so the page tells one story. */}
          <p className="text-base sm:text-lg max-w-140 mx-auto text-text-muted font-sans">
            Each theme is a separate ML specialization. Buy the one that fits,
            one payment, lifetime access, no subscription.
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
                  14-day money-back guarantee
                </span>
                <span className="text-text-muted">
                  : full refund within 14 days, no questions asked. Email
                  support@tensorcraft.app.{" "}
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

        {/* Buyable tiers: Free and Single. */}
        {/* Suspense: PricingTiers reads useSearchParams to restore a
            selection carried through the auth roundtrip. */}
        <Suspense fallback={null}>
          <PricingTiers extrasLessons={EXTRAS_LESSON_COUNT} />
        </Suspense>

        {/* The bundle ladder, stated rather than sold. It sits BELOW the
            grid on purpose: the buyable product leads, and the prices a
            buyer cannot act on are context, not competition for the CTA. */}
        <BundleRoadmap />

        {/* Curriculum preview, what a purchase unlocks */}
        <CurriculumPreview />

        {/* FAQ. Objections peak here, not on the landing page, so the same
            answers render on both. Shared component, single-sourced with the
            FAQPage JSON-LD via app/faq-data.ts. */}
        <FaqSection
          testId="pricing-faq"
          eyebrow="Before you buy"
          heading="Fair Questions, Honest Answers"
          containerClassName="px-6 max-w-4xl mx-auto w-full"
          className="border-t border-border"
        />

        {/* CTA Footer */}
        <section className="py-24 px-6 text-center border-t border-border">
          <p className="text-[13px] uppercase tracking-[0.15em] mb-4 text-text-muted font-mono">
            your frontend is the foundation
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-text-primary font-mono tracking-tight">
            Add ML to your engineering toolkit.
          </h2>
          <p className="text-base mb-10 text-text-muted font-sans max-w-130 mx-auto">
            Start with the free preview. Upgrade when you&rsquo;re ready.
          </p>
          <Link
            href="/themes"
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-on-primary border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            See All 5 Themes &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
