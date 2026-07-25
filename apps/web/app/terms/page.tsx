import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Tensorcraft",
  description:
    "Read the Tensorcraft Terms of Service covering account use, one-time theme purchases, refunds, intellectual property, and acceptable use.",
  alternates: { canonical: "https://tensorcraft.app/terms" },
  openGraph: {
    type: "article",
    url: "https://tensorcraft.app/terms",
    siteName: "Tensorcraft",
    title: "Terms of Service | Tensorcraft",
    description:
      "Terms covering accounts, purchases, refunds, IP, and acceptable use.",
    images: [
      {
        url: "/api/og?title=Terms%20of%20Service&subtitle=Tensorcraft%20legal&theme=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Tensorcraft",
    description: "Accounts, purchases, refunds, IP, and acceptable use.",
    images: [
      "/api/og?title=Terms%20of%20Service&subtitle=Tensorcraft%20legal&theme=deep-orbit",
    ],
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-24">
      <article className="max-w-[720px] mx-auto">
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-primary transition-colors mb-12 inline-block"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-12">Last updated: March 10, 2026</p>

        <div className="prose-custom space-y-8 text-[15px] leading-relaxed text-text-muted">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Tensorcraft (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              2. Description of Service
            </h2>
            <p>
              Tensorcraft is an interactive, browser-based machine learning
              education platform designed for frontend engineers. The Service
              provides story-driven courses, code exercises, and learning
              materials accessible through a web browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. Accounts
            </h2>
            <p>
              You may browse Module 1 content without creating an account. To
              access full course content, track progress, and make purchases,
              you must create an account using GitHub, Google, or email
              authentication. You are responsible for maintaining the security
              of your account credentials.
            </p>
          </section>

          <section id="refunds">
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Purchases & Refunds
            </h2>
            <p>
              Theme purchases are one-time payments that grant lifetime access
              to the purchased theme content. All prices are in USD. Refunds are
              available within 14 days of purchase, no questions asked: email
              support@tensorcraft.app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Intellectual Property
            </h2>
            <p>
              All course content, code examples, narratives, and materials are
              the intellectual property of Tensorcraft. Code you write during
              exercises belongs to you. You may not redistribute, resell, or
              publicly share course content without written permission.
            </p>
          </section>

          <section id="github">
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. GitHub Integration
            </h2>
            <p>
              Connecting GitHub is optional. If you connect it, Tensorcraft
              creates a repository on your GitHub account per theme and pushes
              your passing exercise solutions to it. These repositories are
              created <strong className="text-text-primary">public</strong> on
              your account; you can make them private or delete them in GitHub
              at any time. Your GitHub access token is stored so pushes work
              across sessions and is removed when you disconnect GitHub in
              Settings. The code pushed is your own work and belongs to you (see
              Section 5).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              7. Acceptable Use
            </h2>
            <p>
              You agree not to: (a) share your account credentials with others;
              (b) attempt to bypass payment requirements or access controls; (c)
              scrape, crawl, or automatically download course content; (d) use
              the Service for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind. Tensorcraft shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              9. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. We will notify you of
              significant changes via email or in-app notification. Continued
              use of the Service after changes constitutes acceptance of the new
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              10. Contact
            </h2>
            <p>
              Questions about these terms? Contact us at{" "}
              <a
                href="mailto:legal@tensorcraft.app"
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                legal@tensorcraft.app
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
