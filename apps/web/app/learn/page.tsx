import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { WORLD_CONTENT } from "@tensorcraft/shared";
import { heroPlateSrc } from "@/lib/location-art";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { LearnHeroScene } from "./learn-hero-scene";
import { TrailerHero } from "./trailer-hero";
import { CrewStrip } from "./crew-strip";
import { buildLearnBreadcrumbs, buildLearnVideo } from "./learn-jsonld";

export const metadata: Metadata = {
  title: "Learn Machine Learning with JavaScript | Tensorcraft",
  description:
    "Machine learning for JavaScript developers. Every lesson is TypeScript that runs in your browser with TensorFlow.js. No Python required. Module 1 is free.",
  alternates: {
    canonical: "https://tensorcraft.app/learn",
  },
  // An images-only openGraph REPLACES the root block (Next shallow-merges
  // metadata objects), silently dropping og:url/type/siteName and inheriting
  // the homepage twitter card - every share of this page presented as the
  // site root (R3-7). Declare the full block.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/learn",
    title: "Learn Machine Learning with JavaScript | Tensorcraft",
    images: [
      "/api/og?title=Learn%20ML%20with%20JavaScript&world=deep-orbit&subtitle=A%20JavaScript%20developer%27s%20guide",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn Machine Learning with JavaScript | Tensorcraft",
    images: [
      "/api/og?title=Learn%20ML%20with%20JavaScript&world=deep-orbit&subtitle=A%20JavaScript%20developer%27s%20guide",
    ],
  },
};

export const revalidate = 3600;

// The canonical free-lesson destination, hardcoded like every other call
// site (landing hero, landing final CTA, bridge preview, pricing footer).
const FREE_LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

const PRIMARY_CTA =
  "rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page";

const SECONDARY_CTA =
  "rounded-none inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page";

export default function LearnPage() {
  const hasPlate = Boolean(heroPlateSrc("deep-orbit"));
  // The trailer hero ships only once the pipeline's review gate has
  // produced the assets (scripts/marketing/tour-video/); until then the
  // plate hero stands. Checked at build/revalidate, never per-request, so
  // the page stays static.
  const hasTrailer = fs.existsSync(
    path.join(process.cwd(), "public/media/learn-trailer.mp4"),
  );

  return (
    <main className="min-h-screen bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildLearnBreadcrumbs()),
        }}
      />
      {hasTrailer && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildLearnVideo()),
          }}
        />
      )}

      {/* The film IS the hero (owner ruling 2026-08-27): no text over
          the video, one CTA in the overlay, and the whole surface plays
          the trailer with sound. The plate composition stands in until
          trailer assets exist. */}
      <section className="relative overflow-hidden border-b border-border min-h-[calc(100svh-3.75rem)]">
        {hasTrailer ? <TrailerHero /> : <LearnHeroScene />}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex justify-center pb-12 md:pb-16 pointer-events-none${
            hasPlate || hasTrailer ? " tc-on-art" : ""
          }`}
        >
          <FreeLessonCtaTracker source="learn_hero">
            <Link
              href={FREE_LESSON}
              data-testid="learn-cta-hero"
              className={`${PRIMARY_CTA} pointer-events-auto`}
            >
              Start Module 1 free →
            </Link>
          </FreeLessonCtaTracker>
        </div>
      </section>

      {/* Below the film: the page's words. The H1 keeps the search
          identity; the free-module line carries the canonical Deep Orbit
          link; the details block is the indexable transcript. */}
      <section className="border-b border-border px-10 md:px-20 py-14 md:py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-mono font-black leading-[1.05] tracking-[-0.03em] mb-5 max-w-[720px] mx-auto">
          Learn Machine Learning with JavaScript
        </h1>
        <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed mb-4 max-w-[640px] mx-auto">
          You already think in arrays, state, and async. Machine learning uses
          the same patterns under different names. Tensorcraft maps those
          patterns with {WORLD_CONTENT.lessonBridges} JavaScript-to-ML bridges
          and teaches them through one story: {WORLD_CONTENT.modulesPerWorld}{" "}
          modules aboard a station in deep orbit. Every lesson is TypeScript
          that runs in your browser.
        </p>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-10 max-w-[640px] mx-auto">
          Module 1 of{" "}
          <Link
            href="/worlds/deep-orbit"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Deep Orbit
          </Link>
          , the live course, is free: no account, no credit card.
        </p>
        <div className="flex justify-center">
          <CrewStrip />
        </div>

        <details className="mt-10 max-w-[720px] mx-auto text-left border border-border bg-surface">
          <summary className="cursor-pointer px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            About this video
          </summary>
          <div className="px-5 pb-5 pt-2 space-y-4 text-base text-text-muted font-sans leading-relaxed">
            <p>
              Tensorcraft teaches machine learning in TypeScript, in the
              browser. Every lesson runs real TensorFlow.js against tests as you
              read, so there is nothing to install, and the model you finish
              with works anywhere a browser does. No Python required.
            </p>
            <p>
              The teaching mechanic is the JavaScript-to-ML bridge:{" "}
              {WORLD_CONTENT.lessonBridges} of them anchor ML concepts to code
              you already write, each labeled where the analogy breaks.
            </p>
            <p>
              Deep Orbit, the live course in the video, is one continuous story:
              a research station is tracking a sensor reading that its model
              cannot classify, and you are the engineer they bring in. Across{" "}
              {WORLD_CONTENT.modulesPerWorld} modules it teaches neural
              networks, training and gradient descent, signal processing, and
              anomaly detection, and ends with a capstone model you ship. Module
              1 is free in full: no account, no credit card.
            </p>
          </div>
        </details>
      </section>

      {/* Close: the one symmetric moment on the page. */}
      <section className="px-10 md:px-20 py-20 md:py-24 text-center">
        <p className="text-base text-text-muted font-sans leading-relaxed mb-8 max-w-[560px] mx-auto">
          Module 1 is free. After that, each course is a one-time purchase: see{" "}
          <Link
            href="/pricing"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            pricing
          </Link>{" "}
          for what&apos;s included.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <FreeLessonCtaTracker source="learn_footer">
            <Link
              href={FREE_LESSON}
              data-testid="learn-cta-footer"
              className={PRIMARY_CTA}
            >
              Start Module 1 free →
            </Link>
          </FreeLessonCtaTracker>
          <Link href="/worlds" className={SECONDARY_CTA}>
            See all 5 courses →
          </Link>
        </div>
      </section>
    </main>
  );
}
