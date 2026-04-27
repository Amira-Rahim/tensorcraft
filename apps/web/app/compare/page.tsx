import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Tensorcraft vs fast.ai, Karpathy, Coursera, Hugging Face | Honest Comparison",
  description:
    "Honest, table-format comparison of Tensorcraft against fast.ai, Karpathy Zero-to-Hero, Coursera DL Specialization, Hugging Face NLP Course, and 3Blue1Brown. Each row names where Tensorcraft loses, not just where it wins.",
  alternates: { canonical: "https://tensorcraft.app/compare" },
};

export const revalidate = 86400;

type Cell = string;
type Row = {
  dimension: string;
  tensorcraft: Cell;
  fastai: Cell;
  karpathy: Cell;
  coursera: Cell;
  huggingface: Cell;
  threeblue: Cell;
  note?: string;
};

const ROWS: Row[] = [
  {
    dimension: "Time to first deployable model",
    tensorcraft: "~25h (one theme, capstone deploys to GitHub Pages)",
    fastai: "~50h (notebook, no deploy guidance)",
    karpathy: "~80–100h (deepest, no deploy)",
    coursera: "~80h × 4 courses (certificate, no deploy)",
    huggingface: "~30h (notebook + Spaces deploy)",
    threeblue: "Not applicable (educational videos, no shipping)",
  },
  {
    dimension: "Math depth (calculus + linalg)",
    tensorcraft: "Companion module — chain rule + tf.grad verification",
    fastai: "Built into main path",
    karpathy: "Derived from scratch in main path",
    coursera: "Extensive — DL Spec was Andrew Ng's strength",
    huggingface: "Light — covers concepts, skips derivations",
    threeblue: "Visual + intuitive — best at chain rule explanation",
  },
  {
    dimension: "Browser-runnable (no Python)",
    tensorcraft: "Yes — TFJS in-page exercises",
    fastai: "No — Colab/Jupyter required",
    karpathy: "No — Python required",
    coursera: "No — Python notebooks",
    huggingface: "Partial — Spaces preview, but practice is Python",
    threeblue: "No code at all",
  },
  {
    dimension: "Primary language",
    tensorcraft: "TypeScript / JavaScript",
    fastai: "Python",
    karpathy: "Python",
    coursera: "Python",
    huggingface: "Python",
    threeblue: "Math notation",
  },
  {
    dimension: "Capstone deliverable",
    tensorcraft: "Deployable web app (DEEP SCAN, etc) per theme",
    fastai: "Notebook",
    karpathy: "GitHub repo (micrograd / nanoGPT)",
    coursera: "Certificate",
    huggingface: "Hugging Face Space",
    threeblue: "None",
  },
  {
    dimension: "Honesty signal — analogy limits",
    tensorcraft:
      "Every structural and intuition bridge labels its failure mode",
    fastai: "No formal analogy-limit system",
    karpathy: "No analogies — derived from math",
    coursera: "Few analogies",
    huggingface: "Few analogies",
    threeblue: "Visual analogies; limits implied by visualization",
  },
  {
    dimension: "Price",
    tensorcraft: "$0 preview, $79–219 lifetime",
    fastai: "Free",
    karpathy: "Free",
    coursera: "$59/mo · ~$236 to complete DL Spec",
    huggingface: "Free",
    threeblue: "Free",
  },
  {
    dimension: "Best fit for",
    tensorcraft: "FE/JS dev who needs to ship browser ML this quarter",
    fastai: "Anyone willing to invest in Python-first ML practice",
    karpathy: "Someone who wants to build models from first principles",
    coursera: "Career-changers wanting structured, accredited path",
    huggingface: "NLP / production model deployment focus",
    threeblue: "Visual learners building intuition before any course",
  },
];

const COL_LABELS = [
  ["tensorcraft", "Tensorcraft"],
  ["fastai", "fast.ai"],
  ["karpathy", "Karpathy Z2H"],
  ["coursera", "Coursera DL"],
  ["huggingface", "HF NLP"],
  ["threeblue", "3Blue1Brown"],
] as const;

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Tensorcraft vs fast.ai, Karpathy, Coursera, Hugging Face: honest comparison",
            description:
              "Honest, table-format comparison across 8 dimensions. Names where Tensorcraft loses, not just where it wins.",
            author: { "@type": "Organization", name: "Tensorcraft" },
            publisher: { "@type": "Organization", name: "Tensorcraft" },
            datePublished: "2026-04-26",
            dateModified: "2026-04-27",
            url: "https://tensorcraft.app/compare",
            mainEntityOfPage: "https://tensorcraft.app/compare",
          }),
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
            // HONEST COMPARISON
          </p>
          <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-4">
            Tensorcraft vs every other ML course we respect.
          </h1>
          <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-3xl font-sans">
            We&apos;re not the right course for everyone. This page names where
            Tensorcraft loses, not just where it wins. If a row points you to
            fast.ai or Karpathy instead, take it. The right course is the one
            that fits your goal, not the one that converts you.
          </p>
        </div>

        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-left font-mono text-xs uppercase tracking-widest text-text-muted px-4 py-3 sticky left-0 bg-surface-raised">
                  Dimension
                </th>
                {COL_LABELS.map(([key, label]) => (
                  <th
                    key={key}
                    className={
                      "text-left font-mono text-xs uppercase tracking-widest px-4 py-3 " +
                      (key === "tensorcraft"
                        ? "text-primary"
                        : "text-text-muted")
                    }
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.dimension}
                  className="border-b border-border align-top"
                >
                  <td className="font-mono text-xs text-text-primary px-4 py-4 sticky left-0 bg-page font-semibold">
                    {row.dimension}
                  </td>
                  {COL_LABELS.map(([key]) => (
                    <td
                      key={key}
                      className={
                        "px-4 py-4 leading-relaxed font-sans text-[13px] " +
                        (key === "tensorcraft"
                          ? "text-text-primary"
                          : "text-text-muted")
                      }
                    >
                      {row[key as keyof Row] as string}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase mb-2">
              When to pick Tensorcraft
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              You write JavaScript day-to-day. You want to ship ML in your web
              app this quarter, not next year. You want analogies that name
              their own limits.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs text-text-muted font-bold tracking-wider uppercase mb-2">
              When to pick fast.ai
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              You want depth on training mechanics — SGD, optimizer internals,
              backprop derivations — built into the main path. You&apos;re fine
              with Python and Colab.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs text-text-muted font-bold tracking-wider uppercase mb-2">
              When to pick Karpathy
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              You want to build models from raw math. micrograd to nanoGPT in
              video form, free, deepest take available. Time investment is
              substantial.
            </p>
          </div>
        </section>

        <div className="mt-20 flex flex-wrap items-center gap-4">
          <Link
            href="/themes"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-page font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            See All 5 Tensorcraft Themes →
          </Link>
          <Link
            href="/pricing"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
