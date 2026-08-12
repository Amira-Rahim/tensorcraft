import Link from "next/link";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "Tensorcraft vs fast.ai vs Karpathy vs Coursera | Course comparison",
  description:
    "Honest comparison: where Tensorcraft wins (FE-developer onboarding, browser-runtime focus, analogies labeled where they break), where the alternatives win (deeper math, larger pretrained ecosystem, formal credentials).",
  alternates: { canonical: "https://tensorcraft.app/compare" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root — wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/compare",
    title: "Tensorcraft vs fast.ai vs Karpathy | Tensorcraft",
    images: [
      "/api/og?title=Tensorcraft%20vs%20fast.ai%20vs%20Karpathy&world=deep-orbit&subtitle=An%20honest%20course%20comparison",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensorcraft vs fast.ai vs Karpathy | Tensorcraft",
    images: [
      "/api/og?title=Tensorcraft%20vs%20fast.ai%20vs%20Karpathy&world=deep-orbit&subtitle=An%20honest%20course%20comparison",
    ],
  },
};

export const revalidate = 86400;

type Row = {
  feature: string;
  tensorcraft: string;
  fastai: string;
  karpathy: string;
  coursera: string;
};

const ROWS: Row[] = [
  {
    feature: "Primary language / runtime",
    tensorcraft: "JavaScript / TensorFlow.js (browser)",
    fastai: "Python / PyTorch (Colab/local)",
    karpathy: "Python / PyTorch (notebooks)",
    coursera: "Python / TensorFlow + Keras",
  },
  {
    feature: "Audience starting point",
    tensorcraft: "FE devs: useState, Array.reduce, Math.max",
    fastai: "Anyone with Python comfort",
    karpathy: "Anyone willing to read math",
    coursera: "Anyone with college calculus",
  },
  {
    feature: "Analogies labeled where they break",
    tensorcraft: "Identity / structural / intuition labels + breaks",
    fastai: "Top-down practice; no formal tier system",
    karpathy: "Bottom-up math; no analogy framing",
    coursera: "Formal definitions, less analogy",
  },
  {
    feature: "Math depth",
    tensorcraft:
      "Chain rule, DFT, cross-entropy derived in optional drawers; KL divergence in the math companion (ELBO, DDPM with future worlds)",
    fastai: "Pragmatic depth, not paper-grade",
    karpathy: "Paper-grade: autograd from scratch, attention from scratch",
    coursera: "Theory + math, exam-grade",
  },
  {
    feature: "Browser-runtime + deployment",
    tensorcraft: "Every exercise grades in real TFJS in a worker",
    fastai: "Notebook-first; deploys free via Hugging Face Spaces / Gradio",
    karpathy: "Notebook only, no deployment story",
    coursera: "Theory; deployment in separate specialization",
  },
  {
    feature: "Capstone artifact you ship",
    tensorcraft:
      "Every component of a browser-side ML system, built and graded piece by piece, pushed to your GitHub (one world live today, four in the pipeline)",
    fastai: "fast.ai notebooks shareable as Hugging Face Spaces",
    karpathy: "Final notebook trained from scratch",
    coursera: "Certificates",
  },
  {
    feature: "Cost (full curriculum)",
    tensorcraft: `$0 preview / $${PRICING.single.price} per world / $${PRICING.allFive.price} for all five (bundle opens once all five launch)`,
    fastai: "Free",
    karpathy: "Free",
    coursera: "$49-79/mo (specialization $200-500)",
  },
  {
    feature: "Credential",
    tensorcraft:
      "Completion certificate + a GitHub repo of every exercise you solved: a record of work, not an accreditation",
    fastai: "None",
    karpathy: "None",
    coursera: "Coursera certificate",
  },
];

export default function ComparePage() {
  const compareJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Tensorcraft vs fast.ai vs Karpathy vs Coursera",
    author: { "@type": "Organization", name: "Tensorcraft" },
    publisher: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    datePublished: "2026-04-25",
    // Bump whenever competitor claims/prices are re-verified; the visible
    // "Prices checked" line below renders this same date.
    dateModified: "2026-07-14",
    description:
      "Honest comparison of Tensorcraft against fast.ai, Karpathy zero-to-hero, and Coursera for frontend developers learning ML.",
    url: "https://tensorcraft.app/compare",
  };

  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
      />
      <article className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          COMPARE
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-8">
          Where each course wins.
        </h1>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mb-12">
          <p>
            Tensorcraft is not the right course for everyone. If you want
            paper-grade autograd internals, Karpathy&apos;s Zero-to-Hero is free
            and excellent. If you want hands-on PyTorch with Hugging Face
            superpowers, fast.ai is free and excellent. If you want a graded
            credential for your CV, Coursera does that and we don&apos;t.
          </p>
          <p>
            Tensorcraft is the right course if you ship in the browser, you
            already know JavaScript, and you want a course that respects what
            you already know without watering down the ML. Every analogy ships
            with a label naming where it stops being literal: the bridge-tier
            system is built directly into each lesson.
          </p>
        </section>

        <div className="overflow-x-auto border border-border">
          <table className="w-full font-mono text-sm">
            <caption className="sr-only">
              Course comparison: Tensorcraft vs fast.ai vs Karpathy zero-to-hero
              vs Coursera, scored across language, audience, math depth,
              deployment, capstone, cost, and credential.
            </caption>
            <thead className="bg-surface-raised">
              <tr>
                <th
                  scope="col"
                  className="text-left p-3 text-text-primary font-bold"
                >
                  Feature
                </th>
                <th
                  scope="col"
                  className="text-left p-3 text-primary font-bold"
                >
                  Tensorcraft
                </th>
                <th
                  scope="col"
                  className="text-left p-3 text-text-primary font-bold"
                >
                  fast.ai
                </th>
                <th
                  scope="col"
                  className="text-left p-3 text-text-primary font-bold"
                >
                  Karpathy
                </th>
                <th
                  scope="col"
                  className="text-left p-3 text-text-primary font-bold"
                >
                  Coursera
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="border-t border-border align-top"
                >
                  <th
                    scope="row"
                    className="text-left p-3 text-text-primary font-bold"
                  >
                    {row.feature}
                  </th>
                  <td className="p-3 text-text-muted">{row.tensorcraft}</td>
                  <td className="p-3 text-text-muted">{row.fastai}</td>
                  <td className="p-3 text-text-muted">{row.karpathy}</td>
                  <td className="p-3 text-text-muted">{row.coursera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mt-12">
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            What we deliberately did not try to be
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <span className="text-text-primary font-mono text-sm">
                A Python ecosystem replacement.
              </span>{" "}
              You will not learn pandas, PyTorch internals, or transformer
              fine-tuning here. fast.ai or Hugging Face NLP Course are better.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                A research methodology course.
              </span>{" "}
              We teach engineering practice, not how to design novel
              experiments. The Karpathy + d2l.ai combo is your friend.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                An accredited credential.
              </span>{" "}
              Your certificate is a completion record, not an accreditation. The
              proof we believe in is the capstone: a deployable browser-ML app
              you can show in an interview, plus the GitHub repo of every
              exercise you solved.
            </li>
          </ul>
        </section>

        <p className="mt-10 font-mono text-xs text-text-muted">
          Competitor prices and claims last checked 2026-07-14. If something
          here is stale, tell us and we&apos;ll fix it.
        </p>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <Link
            href="/worlds"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Start the course →
          </Link>
          <Link
            href="/about"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            Why this exists
          </Link>
        </div>
      </article>
    </main>
  );
}
