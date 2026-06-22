import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LAUNCHED_THEMES, PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { CurriculumPreview } from "./curriculum-preview";
import { PaymentError } from "./payment-error";
import { PaywallNotice } from "./paywall-notice";
import { PricingAnalytics } from "./pricing-analytics";
import { PricingTiers } from "./pricing-tiers";
import { AmbientBackground } from "@/app/components/ambient-background";

export const metadata: Metadata = {
  title: `ML Course Pricing: From $0 to $${PRICING.allFive.price} | Tensorcraft`,
  description: `One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts. Free preview, $${PRICING.single.price} per theme, bundles up to $${PRICING.allFive.price}.`,
  alternates: { canonical: "https://tensorcraft.app/pricing" },
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/pricing",
    siteName: "Tensorcraft",
    title: "Buy a Theme. Keep It Forever. | Tensorcraft",
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per theme, bundles up to $${PRICING.allFive.price}.`,
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
    description: `One payment. Lifetime access. $0 preview, $${PRICING.single.price} per theme, bundles up to $${PRICING.allFive.price}.`,
    images: [
      "/api/og?title=Buy%20a%20Theme.%20Keep%20It%20Forever.&subtitle=One%20payment.%20Lifetime%20access.&theme=deep-orbit",
    ],
  },
};

export const revalidate = 3600;

// A bundle Offer is only InStock once enough themes have launched to fill it
// (mirrors the cart gating in pricing-tiers.tsx). Until then it is a genuine
// pre-order, so the structured data must say PreOrder rather than overclaim
// InStock on a basket the checkout would reject.
const IN_STOCK = "https://schema.org/InStock";
const PRE_ORDER = "https://schema.org/PreOrder";
const availabilityFor = (themes: number) =>
  LAUNCHED_THEMES.length >= themes ? IN_STOCK : PRE_ORDER;

export default function PricingPage() {
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Tensorcraft course pricing",
    url: "https://tensorcraft.app/pricing",
    description:
      "One-payment lifetime-access tiers for the Tensorcraft browser-ML course. Per-theme single purchase, multi-theme bundles, and an all-five bundle.",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Free preview",
        price: String(PRICING.free.price),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description:
          "Module 1 of Deep Orbit free: lessons and exercises, no account required. The other four themes ship in waves with per-theme waitlists.",
      },
      {
        "@type": "Offer",
        name: "Single theme",
        price: String(PRICING.single.price),
        priceCurrency: "USD",
        availability: availabilityFor(PRICING.single.themes),
        description: `One full theme: ${THEME_CONTENT.totalLessonsPerTheme} lessons across ${THEME_CONTENT.modulesPerTheme} modules, capstone, lifetime access.`,
      },
      {
        "@type": "Offer",
        name: "Two-theme bundle",
        price: String(PRICING.twoBundle.price),
        priceCurrency: "USD",
        availability: availabilityFor(PRICING.twoBundle.themes),
        description: "Any two themes bundled, lifetime access.",
      },
      {
        "@type": "Offer",
        name: "Three-theme bundle",
        price: String(PRICING.threeBundle.price),
        priceCurrency: "USD",
        availability: availabilityFor(PRICING.threeBundle.themes),
        description: "Any three themes bundled, lifetime access.",
      },
      {
        "@type": "Offer",
        name: "All five themes",
        price: String(PRICING.allFive.price),
        priceCurrency: "USD",
        availability: availabilityFor(PRICING.allFive.themes),
        description:
          "All five themes (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid). Lifetime access.",
      },
    ],
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
          <p className="text-base sm:text-lg max-w-140 mx-auto text-text-muted font-sans">
            Each theme is a separate ML specialization. Buy one, bundle a few,
            or all five themes, one payment, lifetime access.
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
                  : full refund if you&rsquo;ve used less than 20% of a
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

        {/* Curriculum preview, what a purchase unlocks */}
        <CurriculumPreview />

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
            className="inline-flex items-center font-mono px-8 py-4 text-sm font-medium uppercase tracking-wider transition-all bg-primary text-page border border-primary rounded-none hover:brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover"
          >
            See All 5 Themes &rarr;
          </Link>
        </section>
      </div>
    </main>
  );
}
