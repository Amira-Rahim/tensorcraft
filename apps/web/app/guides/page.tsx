import type { Metadata } from "next";
import Link from "next/link";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { GUIDES } from "@/lib/guides";
import { SITE_URL } from "@/lib/site-identity";

const title = "JavaScript machine learning guides, Tensorcraft";
const description =
  "Free browser activities for JavaScript developers learning ML. Train a model, predict tensor values, or write and test JavaScript with recorded sensor data.";
const url = `${SITE_URL}/guides`;
const image = `/api/og?title=${encodeURIComponent("JavaScript machine learning guides")}&world=deep-orbit`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    title,
    description,
    url,
    siteName: "Tensorcraft",
    images: [{ url: image, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const practice = [
  {
    label: "Run the room occupancy demo",
    href: "/guides/browser-machine-learning-project#training",
    description:
      "Train a model on room readings with the supplied code. Compare its false alarms and missed detections with a rule that uses only light.",
  },
  {
    label: "Predict a row of sensor readings",
    href: "/worlds/deep-orbit/foundations/tensor-shapes?start=experiment",
    description:
      "Enter the four readings you think belong together. Then try reshape and transpose to see where each value lands.",
  },
  {
    label: "Write and test JavaScript",
    href: "/worlds/deep-orbit/foundations/introduction-to-tensors?start=challenge",
    description:
      "Turn 12 readings into a tensor in the browser editor. Run the tests, then follow each sensor on Demir’s chart.",
  },
];

export default function GuidesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 sm:px-10 md:py-24">
      <h1 className="max-w-3xl font-mono text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
        JavaScript machine learning guides
      </h1>
      <section aria-labelledby="practice" className="mt-10">
        <h2 id="practice" className="font-mono text-2xl font-bold sm:text-3xl">
          Hands-on practice
        </h2>
        <p className="mt-3 leading-relaxed text-text-muted">
          All three activities run in your browser for free. You can start
          without an account or a local install.
        </p>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {practice.map(({ label, href, description }) => {
            const link = (
              <Link
                href={href}
                prefetch={false}
                className="inline-block py-2.5 font-semibold text-primary underline underline-offset-4"
              >
                {label}
              </Link>
            );
            return (
              <li
                key={href}
                className="grid items-baseline gap-x-8 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
              >
                <div>
                  {href.startsWith("/worlds/") ? (
                    <FreeLessonCtaTracker
                      source="guide"
                      guideSlug="guides"
                      targetLesson={SITE_URL + href.split("?")[0]}
                      placement="activity"
                    >
                      {link}
                    </FreeLessonCtaTracker>
                  ) : (
                    link
                  )}
                </div>
                <p className="leading-relaxed text-text-muted">{description}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <h2 className="mt-14 font-mono text-2xl font-bold sm:text-3xl">
        Worked guides
      </h2>
      <ul className="mt-5 border-t border-border">
        {GUIDES.map((guide) => (
          <li key={guide.slug} className="border-b border-border py-8">
            <h3 className="font-mono text-xl font-bold sm:text-2xl">
              <Link href={guide.path} className="underline underline-offset-4">
                {guide.title}
              </Link>
            </h3>
            <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">
              {guide.summary}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-10 leading-relaxed text-text-muted">
        Tensorcraft teaches ML through interactive stories and JavaScript
        exercises.{" "}
        <Link
          href="/worlds/deep-orbit"
          className="text-primary underline underline-offset-4"
        >
          Deep Orbit
        </Link>{" "}
        is the first available world. Its first five lessons are free, with no
        account required.
      </p>
    </main>
  );
}
