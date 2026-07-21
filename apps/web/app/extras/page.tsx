import Link from "next/link";
import type { Metadata } from "next";
import { getThemeLessons } from "@tensorcraft/content";

export const metadata: Metadata = {
  title: "Extras: Math, Classical ML, Ethics, Python Bridge | Tensorcraft",
  description:
    "Companion modules that go deeper than the main path: math derivations (chain rule, KL divergence, Bayesian updates), classical ML algorithms, ethics framework, Python ↔ JS bridge.",
  alternates: { canonical: "https://tensorcraft.app/extras" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root — wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/extras",
    title: "Extras: Math, Classical ML, Ethics | Tensorcraft",
    images: [
      "/api/og?title=Extras%3A%20Math%2C%20Classical%20ML%2C%20Ethics&theme=deep-orbit&subtitle=Companion%20modules%2C%20free%20to%20read",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Extras: Math, Classical ML, Ethics | Tensorcraft",
    images: [
      "/api/og?title=Extras%3A%20Math%2C%20Classical%20ML%2C%20Ethics&theme=deep-orbit&subtitle=Companion%20modules%2C%20free%20to%20read",
    ],
  },
};

export const revalidate = 3600;

const MODULE_DESCRIPTIONS: Record<string, string> = {
  "math-deep-dive":
    "Partial derivatives, chain rule for backprop, optimization landscape, FFT, KL divergence, Bayesian updates. Verified against tf.grad.",
  "classical-ml":
    "Logistic regression, decision trees, k-NN, ensembles. When NOT to reach for deep learning.",
  "ethics-responsibility":
    "Dataset bias, fairness metrics (and which ones to pick), interpretability, responsible deployment.",
  "python-bridge":
    "Python for JS devs, NumPy ↔ TypedArray, PyTorch ↔ TFJS, pandas, reading ML papers.",
};

export default function ExtrasPage() {
  const lessons = getThemeLessons("shared");
  const byModule: Record<string, typeof lessons> = {};
  for (const l of lessons) {
    (byModule[l.moduleId] ||= []).push(l);
  }

  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Tensorcraft Extras: Companion Modules",
            description:
              "Math derivations, classical ML, ethics, Python bridge. Companion modules that go deeper than the main FE-bridge path.",
            url: "https://tensorcraft.app/extras",
            itemListElement: Object.keys(byModule).map((moduleId, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: moduleId,
              url: `https://tensorcraft.app/extras#${moduleId}`,
            })),
          }),
        }}
      />
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          EXTRAS, companion modules
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-4">
          Beyond the main path.
        </h1>
        <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-3xl font-sans mb-12">
          Each main lesson keeps the FE-bridge framing. These extras drop the
          analogy and go deeper: math you derive by hand, classical ML you
          should reach for first, ethics you must consider before shipping,
          Python you read when fast.ai or Karpathy is the right next step.
        </p>

        <div className="grid gap-8">
          {Object.entries(byModule).map(([moduleId, moduleLessons]) => (
            <section
              key={moduleId}
              className="border border-border bg-surface-raised"
            >
              <div className="px-6 py-5 border-b border-border">
                <h2 className="font-mono text-xl font-bold text-text-primary uppercase tracking-tight mb-2">
                  {moduleId.replace(/-/g, " ")}
                </h2>
                <p className="text-sm text-text-muted font-sans leading-relaxed">
                  {MODULE_DESCRIPTIONS[moduleId] || ""}
                </p>
              </div>
              <ul className="divide-y divide-border">
                {moduleLessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/extras/${moduleId}/${l.slug}`}
                      className="block px-6 py-4 hover:bg-surface transition-colors"
                    >
                      <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
                        {l.estimatedMinutes} min · {l.difficulty}
                      </div>
                      <div className="text-sm text-text-primary font-sans">
                        {l.title}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
