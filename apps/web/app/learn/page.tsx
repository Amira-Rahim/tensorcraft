import Link from "next/link";
import type { Metadata } from "next";
import { WORLD_SLUGS, WORLD_CONTENT, isLaunched } from "@tensorcraft/shared";
import { heroPlateSrc } from "@/lib/location-art";
import { FaqSection } from "@/app/components/faq-section";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { LearnHeroScene } from "./learn-hero-scene";
import { TaughtBridge } from "./taught-bridge";
import { DemoBand } from "./demo-band";
import { CourseMap } from "./course-map";
import { CrewStrip } from "./crew-strip";
import { ComingSoonWorlds } from "./coming-soon-worlds";
import { buildLearnBreadcrumbs, buildLearnCourseList } from "./learn-jsonld";

export const metadata: Metadata = {
  title: "Learn Machine Learning with JavaScript | Tensorcraft",
  description:
    "A JavaScript developer's guide to machine learning. Learn ML through code you already know: useState becomes model weights, Array.map becomes tensor ops. No Python required. Module 1 is free.",
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="w-[7px] h-[7px] bg-primary inline-block"
      />
      {children}
    </div>
  );
}

export default function LearnPage() {
  const comingCount = WORLD_SLUGS.filter((slug) => !isLaunched(slug)).length;
  const hasPlate = Boolean(heroPlateSrc("deep-orbit"));

  return (
    <main className="min-h-screen bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildLearnBreadcrumbs()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildLearnCourseList()),
        }}
      />

      {/* Hero: a briefing over the bridge of the station. Decoration stack
          (plate, orbit scene, scrim) is a client island; every word below is
          server JSX. Layering per the five-worlds flagship band. The min-h
          is load-bearing on wide screens: without it the band's height is the
          copy's, the 3:2 plate crops to a sliver of ceiling, and the page
          opens on a letterbox instead of the bridge (caught on a 3024px
          display, 2026-08-24). */}
      <section className="relative overflow-hidden border-b border-border">
        <LearnHeroScene />
        <div
          className={`relative z-10 flex items-center min-h-[520px] md:min-h-[65svh] xl:min-h-[78svh] px-10 md:px-20 py-20 md:py-24${
            hasPlate ? " tc-on-art" : ""
          }`}
        >
          <div className="max-w-[680px]">
            <Eyebrow>A course for JavaScript engineers</Eyebrow>
            <h1 className="text-4xl md:text-5xl font-mono font-black leading-[1.02] tracking-[-0.03em] mb-6">
              Learn Machine Learning with JavaScript
            </h1>
            <p className="text-lg text-text-muted font-sans leading-relaxed mb-8 max-w-[560px]">
              You already think in arrays, state, and async. Machine learning
              uses the same patterns under different names. Tensorcraft maps
              them with {WORLD_CONTENT.lessonBridges} JavaScript-to-ML bridges
              and teaches them through one story:{" "}
              {WORLD_CONTENT.modulesPerWorld} modules aboard a station in deep
              orbit, written in TypeScript, run in your browser.
            </p>
            <div className="flex gap-4 flex-wrap mb-4">
              <FreeLessonCtaTracker source="learn_hero">
                <Link
                  href={FREE_LESSON}
                  data-testid="learn-cta-hero"
                  className={PRIMARY_CTA}
                >
                  Start Module 1 free →
                </Link>
              </FreeLessonCtaTracker>
              <a href="#how-it-works" className={SECONDARY_CTA}>
                See how it works
              </a>
            </div>
            <p className="font-mono text-xs text-text-muted tracking-wide">
              Module 1 of Deep Orbit, the live course, is free: no account, no
              credit card.
            </p>
          </div>
        </div>
      </section>

      {/* How it works: ONE band, the lesson page's own step grammar. Three
          chapters, each a step label, one line, and its artifact; the
          artifacts are the explanation. (v2 gave every chapter a full band
          of eyebrow + display H2 + paragraph and the page shouted the same
          thing three times; owner ruling 2026-08-24.) */}
      <section
        id="how-it-works"
        className="border-b border-border px-10 md:px-20 py-16 md:py-20"
      >
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-8">
          How it works
        </h2>

        {/* Segmented step rail, the lesson header's grammar. Decorative
            duplicate of the h3s below. */}
        <div
          aria-hidden="true"
          className="grid grid-cols-3 gap-2 mb-14 max-w-[880px] font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"
        >
          <div className="border-t-2 border-primary/40 pt-2">
            <span className="text-primary">01</span> A bridge
          </div>
          <div className="border-t-2 border-primary/40 pt-2">
            <span className="text-primary">02</span> Run it
          </div>
          <div className="border-t-2 border-primary/40 pt-2">
            <span className="text-primary">03</span> The road
          </div>
        </div>

        <div className="space-y-16 md:space-y-20">
          {/* 01: don't describe the bridge mechanic, run one. The breaks
              panel is the differentiator; this is its one public showing. */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-8 xl:gap-20 items-start max-w-[1280px]">
            <div>
              <h3 className="font-mono text-xl md:text-2xl font-bold tracking-tight mb-3">
                <span aria-hidden="true" className="text-primary mr-3">
                  01
                </span>
                A bridge
              </h3>
              <p className="text-base text-text-muted font-sans leading-relaxed max-w-[560px]">
                You already know more ML than you think: every concept in the
                course is anchored to JavaScript you write today, across{" "}
                {WORLD_CONTENT.lessonBridges} bridges, each labeled where the
                analogy breaks. Here is one.
              </p>
            </div>
            <TaughtBridge />
          </div>

          {/* 02: the live model. The demo island defers tfjs until the band
              nears the viewport; its own closing line hands off to the road. */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-8 xl:gap-20 items-center max-w-[1280px]">
            <div>
              <h3 className="font-mono text-xl md:text-2xl font-bold tracking-tight mb-3">
                <span aria-hidden="true" className="text-primary mr-3">
                  02
                </span>
                Run it
              </h3>
              <p className="text-base text-text-muted font-sans leading-relaxed max-w-[560px]">
                A real 4 KB neural network scores six archived sensor readings
                in your tab, the same demo that ends Module 1. Watch sample
                7741: 51 percent is not an answer.
              </p>
            </div>
            <div className="w-full max-w-[560px]">
              <DemoBand />
            </div>
          </div>

          {/* 03: the road, full width. The real curriculum with the free
              door marked; replaces the old feature grid and offer band. */}
          <div>
            <h3 className="font-mono text-xl md:text-2xl font-bold tracking-tight mb-3">
              <span aria-hidden="true" className="text-primary mr-3">
                03
              </span>
              The road
            </h3>
            <p className="text-base text-text-muted font-sans leading-relaxed mb-8 max-w-[560px]">
              The whole course, module by module. Module 1 is free in full: the
              lessons, the exercises, and the demo above. No account, no credit
              card.
            </p>
            <CourseMap />
            <div className="mt-10">
              <FreeLessonCtaTracker source="learn_start_free">
                <Link
                  href={FREE_LESSON}
                  data-testid="learn-cta-start-free"
                  className={PRIMARY_CTA}
                >
                  Start Module 1 free →
                </Link>
              </FreeLessonCtaTracker>
            </div>
          </div>
        </div>
      </section>

      {/* The crew: a quiet interlude, no heading machinery. */}
      <section className="border-b border-border px-10 md:px-20 py-12 md:py-14">
        <p className="text-base text-text-muted font-sans leading-relaxed mb-8 max-w-[640px]">
          Deep Orbit is written as one continuous story: you join the crew of a
          research station and learn each technique when the plot needs it. The
          people you work with:
        </p>
        <CrewStrip />
      </section>

      {/* No Python: the operational promise, set as a broadsheet row
          (heading | body), the FAQ rows' grid so the two rhyme. Heading at
          FAQ-question size, not display size: this is an aside, not an act. */}
      <section className="border-b border-border px-10 md:px-20 py-12 md:py-14">
        <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
          <h2 className="text-xl md:text-2xl font-mono font-bold tracking-tight mb-4 md:mb-0">
            No Python required
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed max-w-[640px]">
            The whole course runs TensorFlow.js. You write TypeScript, the
            browser runs it, and the model you finish with works anywhere a
            browser does. The same code runs under Node when you want it on a
            server. There are no notebooks to set up, nothing to pip install,
            and no GPU drivers to fight.
          </p>
        </div>
      </section>

      {/* Coming soon: live scene cards, deliberately inert.
          Names only, no links: coming-soon worlds are inert everywhere
          (worlds/world-cards-grid.tsx precedent). The stubs stay in the
          sitemap for crawlers; the notify path is the card's button.
          Header in the gutter, cards full-bleed edge to edge (the landing
          five-worlds strip's move). */}
      <section className="border-b border-border">
        <div className="px-10 md:px-20 pt-16 md:pt-20 pb-10">
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            Coming soon
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed max-w-[640px]">
            {comingCount} more courses are planned. No release dates announced
            yet:
          </p>
        </div>
        <ComingSoonWorlds />
      </section>

      {/* FAQ: shared server component; co-emits the FAQPage JSON-LD. */}
      <FaqSection
        testId="learn-faq"
        eyebrow="Before you start"
        heading="Common Questions"
      />

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
          for what each plan includes.
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
