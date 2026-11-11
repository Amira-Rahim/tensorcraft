import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

const title = "JavaScript machine learning guides, Tensorcraft";
const description =
  "Worked machine learning examples for JavaScript developers, with inspectable data, runnable code, and links to free Tensorcraft lessons.";
const url = "https://tensorcraft.app/guides";
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

export default function GuidesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 sm:px-10 md:py-24">
      <h1 className="max-w-3xl font-mono text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
        JavaScript machine learning guides
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
        Worked examples from Tensorcraft for JavaScript engineers learning ML.
        Each guide explains the data, shows the result, and connects to an
        activity you can try yourself.
      </p>
      <ul className="mt-14 border-t border-border">
        {GUIDES.map((guide) => (
          <li key={guide.slug} className="border-b border-border py-8">
            <h2 className="font-mono text-2xl font-bold sm:text-3xl">
              <Link href={guide.path} className="underline underline-offset-4">
                {guide.title}
              </Link>
            </h2>
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
