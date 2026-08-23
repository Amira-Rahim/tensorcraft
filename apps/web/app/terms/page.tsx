import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Tensorcraft",
  description:
    "Read the Tensorcraft Terms of Service covering account use, one-time course purchases, refunds, intellectual property, and acceptable use.",
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
        url: "/api/og?title=Terms%20of%20Service&subtitle=Tensorcraft%20legal&world=deep-orbit",
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
      "/api/og?title=Terms%20of%20Service&subtitle=Tensorcraft%20legal&world=deep-orbit",
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
        <p className="text-text-muted mb-12">Last updated: August 16, 2026</p>

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
              education platform designed for JavaScript engineers. The Service
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
              access full course content and track progress, you need an
              account, created with GitHub, Google, or email authentication.
              Purchases require an account. You must be at least 16 years old to
              hold an account. You are responsible for maintaining the security
              of your account credentials.
            </p>
          </section>

          <section id="refunds">
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Purchases & Refunds
            </h2>
            <p>
              A world is one complete course track, such as Deep Orbit. World
              purchases are one-time payments that grant lifetime access to the
              purchased world content. All prices are in USD. Refunds are
              available within 5 days of purchase, no questions asked: email
              support@tensorcraft.app.
            </p>
            <p className="mt-3">
              Purchases are currently available to buyers in the United States
              only. If you are in the European Union or the United Kingdom you
              can still create a free account and read the free module, and you
              can ask us to email you when paid access opens in your region.
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
              creates a repository on your GitHub account per world and pushes
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
              significant changes via email. Continued use of the Service after
              changes constitutes acceptance of the new terms.
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

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              11. Governing Law
            </h2>
            <p className="mb-2">
              These terms are governed by the laws of the State of Delaware,
              United States, without regard to its conflict of law rules. Any
              dispute will be brought in the state or federal courts located in
              Delaware.
            </p>
            <p>
              If you are a consumer in the European Union or the United Kingdom,
              this section does not take away the protections of your local
              consumer law. Those apply whatever this agreement says.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
