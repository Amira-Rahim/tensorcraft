import Link from "next/link";
import type { Metadata } from "next";
import { worlds } from "@tensorcraft/worlds";
import { WORLD_SLUGS, WORLD_CONTENT, isLaunched } from "@tensorcraft/shared";
import { heroPlateSrc } from "@/lib/location-art";
import { FaqSection } from "@/app/components/faq-section";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { LearnHeroScene } from "./learn-hero-scene";
import { TranslationStrip } from "./translation-strip";
import { DemoBand } from "./demo-band";
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
  const liveWorlds = WORLD_SLUGS.filter((slug) => isLaunched(slug));
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
          server JSX. Layering per the five-worlds flagship band. */}
      <section className="relative overflow-hidden border-b border-border">
        <LearnHeroScene />
        <div
          className={`relative z-10 px-10 md:px-20 pt-24 pb-20 md:pt-32 md:pb-28${
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

      {/* The claim, made concrete: three of the pairings as code. */}
      <section className="border-b border-border px-10 md:px-20 py-16 md:py-20">
        <div className="max-w-[880px]">
          <Eyebrow>JS-to-ML bridges</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            You already know more ML than you think
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed mb-10 max-w-[640px]">
            If you understand{" "}
            <code className="text-primary font-mono">useState()</code>, you
            understand model weights. If you can write{" "}
            <code className="text-primary font-mono">array.map()</code>, you can
            do tensor operations. If you have used{" "}
            <code className="text-primary font-mono">fetch()</code>, you know
            what inference looks like. Tensorcraft calls these pairings bridges:{" "}
            {WORLD_CONTENT.lessonBridges} of them map ML concepts to the
            JavaScript you already write, and each one is labeled where the
            analogy breaks.
          </p>
          <TranslationStrip />
        </div>
      </section>

      {/* Proof: the real model, run live. The demo island defers tfjs until
          the band nears the viewport; the framing copy is server text. */}
      <section className="border-b border-border px-10 md:px-20 py-16 md:py-20">
        <div className="max-w-[880px]">
          <Eyebrow>Live demo</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            A real model, running in this tab
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed mb-8 max-w-[640px]">
            The panel below downloads a real 4 KB neural network and scores six
            archived sensor readings, live in your browser. It is the same demo
            you reach at the end of Module 1. Watch the last row: sample 7741
            lands near 51 percent, and 51 percent is not an answer.
          </p>
          <DemoBand />
          <p className="text-base text-text-muted font-sans leading-relaxed mt-8 max-w-[640px]">
            The course teaches you to build the model that can answer.{" "}
            <FreeLessonCtaTracker source="learn_demo">
              <Link
                href={FREE_LESSON}
                data-testid="learn-cta-demo"
                className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Start Module 1 free →
              </Link>
            </FreeLessonCtaTracker>
          </p>
        </div>
      </section>

      {/* How it works: the four mechanics as a numbered grid. */}
      <section
        id="how-it-works"
        className="border-b border-border px-10 md:px-20 py-16 md:py-20"
      >
        <div className="max-w-[880px]">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-10">
            How Tensorcraft works
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {[
              {
                num: "01",
                title: "One story, told in code",
                body: `Deep Orbit, the live course, teaches time-series and signals as a single story across ${WORLD_CONTENT.modulesPerWorld} modules. You are the engineer the crew calls when the data stops making sense.`,
              },
              {
                num: "02",
                title: `${WORLD_CONTENT.lessonBridges} JS-to-ML bridges`,
                body: "Every ML concept is anchored to a JavaScript concept you already use. Each bridge is labeled where the analogy breaks, so it never teaches you something false.",
              },
              {
                num: "03",
                title: "Code in the browser",
                body: "Exercises run real TensorFlow.js against tests, in the page. Nothing to install.",
              },
              {
                num: "04",
                title: "A capstone you can ship",
                body: "The course ends with you building an ML model that runs live in the browser, on any device.",
              },
            ].map((step) => (
              <li key={step.num} className="bg-page p-8">
                <div
                  aria-hidden="true"
                  className="font-mono text-5xl font-black text-primary opacity-20 mb-4"
                  data-decorative="true"
                >
                  {step.num}
                </div>
                <h3 className="font-mono text-lg font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-base text-text-muted font-sans leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* No Python: the operational promise, plain prose. */}
      <section className="border-b border-border px-10 md:px-20 py-16 md:py-20">
        <div className="max-w-[640px]">
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            No Python required
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed">
            The whole course runs TensorFlow.js. You write TypeScript, the
            browser runs it, and the model you finish with works anywhere a
            browser does. The same code runs under Node when you want it on a
            server. There are no notebooks to set up, nothing to pip install,
            and no GPU drivers to fight.
          </p>
        </div>
      </section>

      {/* The offer: start free, and what is live today. */}
      <section className="border-b border-border px-10 md:px-20 py-16 md:py-20">
        <div className="max-w-[880px]">
          <Eyebrow>The course</Eyebrow>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            Start free
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed mb-8 max-w-[640px]">
            Module 1 of Deep Orbit is free in full: the lessons, the exercises,
            and the demo above. No account, no credit card. Open the first
            lesson and start.
          </p>
          <FreeLessonCtaTracker source="learn_start_free">
            <Link
              href={FREE_LESSON}
              data-testid="learn-cta-start-free"
              className={PRIMARY_CTA}
            >
              Start Module 1 free →
            </Link>
          </FreeLessonCtaTracker>

          <h2 className="text-2xl md:text-3xl font-mono font-black tracking-tight mt-14 mb-6">
            Available now
          </h2>
          <ul className="space-y-3">
            {liveWorlds.map((slug) => (
              <li
                key={slug}
                className="border border-border bg-surface px-6 py-5 max-w-[640px]"
              >
                <Link
                  href={`/worlds/${slug}`}
                  className="font-mono text-lg font-bold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  {worlds[slug]?.displayName ?? slug}
                </Link>
                <span className="block mt-1 text-base text-text-muted font-sans">
                  {worlds[slug]?.specialization}
                </span>
                <span className="block mt-2 font-mono text-xs text-text-muted tracking-wide">
                  {WORLD_CONTENT.modulesPerWorld} modules ·{" "}
                  {WORLD_CONTENT.totalLessonsPerWorld} lessons · capstone
                  project
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Coming soon: live scene cards, deliberately inert.
          Names only, no links: coming-soon worlds are inert everywhere
          (worlds/world-cards-grid.tsx precedent). The stubs stay in the
          sitemap for crawlers; the notify path is the card's button. */}
      <section className="border-b border-border px-10 md:px-20 py-16 md:py-20">
        <div className="max-w-[1100px]">
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
            Coming soon
          </h2>
          <p className="text-base md:text-lg text-text-muted font-sans leading-relaxed mb-8 max-w-[640px]">
            {comingCount} more courses are planned. No release dates announced
            yet:
          </p>
          <ComingSoonWorlds />
        </div>
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
