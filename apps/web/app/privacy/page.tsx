import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Tensorcraft",
  description:
    "How Tensorcraft collects, uses, and stores account, progress, and analytics data, plus your GDPR and CCPA rights.",
  alternates: { canonical: "https://tensorcraft.app/privacy" },
  openGraph: {
    type: "article",
    url: "https://tensorcraft.app/privacy",
    siteName: "Tensorcraft",
    title: "Privacy Policy | Tensorcraft",
    description:
      "Data practices, third-party services, cookies, retention, and your rights.",
    images: [
      {
        url: "/api/og?title=Privacy%20Policy&subtitle=Tensorcraft%20legal&theme=deep-orbit",
        width: 1200,
        height: 630,
        alt: "Tensorcraft Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Tensorcraft",
    description: "Data practices, third-party services, cookies, and rights.",
    images: [
      "/api/og?title=Privacy%20Policy&subtitle=Tensorcraft%20legal&theme=deep-orbit",
    ],
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-24 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <article className="max-w-[720px] mx-auto relative z-10">
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-primary transition-colors mb-12 inline-block"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-12">Last updated: April 21, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-text-muted">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-3">
              <strong className="text-text-primary">Account data:</strong> When
              you create an account, we collect your email address, display
              name, and avatar URL from your authentication provider (GitHub or
              Google).
            </p>
            <p className="mb-3">
              <strong className="text-text-primary">Usage data:</strong> We
              collect information about your learning progress, including
              lessons completed, exercise scores, and hints used.
            </p>
            <p>
              <strong className="text-text-primary">Analytics data:</strong>{" "}
              When configured, we use privacy-focused analytics tools (PostHog
              and Plausible) to understand how the platform is used. These
              services are only active when explicitly enabled by our team. We
              do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to: (a) provide and improve the Service;
              (b) track your learning progress; (c) process payments; (d) send
              transactional emails (account verification, purchase receipts);
              (e) analyze platform usage to improve the learning experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. Data Storage & Security
            </h2>
            <p>
              Your data is stored in Supabase (PostgreSQL) with row-level
              security policies. Authentication tokens are handled securely via
              industry-standard OAuth 2.0 / PKCE flows. All data transmission
              uses TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong className="text-text-primary">Supabase</strong>:
                Authentication and database
              </li>
              <li>
                <strong className="text-text-primary">Stripe</strong>: Payment
                processing
              </li>
              <li>
                <strong className="text-text-primary">Kit (ConvertKit)</strong>:
                Transactional and lifecycle email delivery
              </li>
              <li>
                <strong className="text-text-primary">Sentry</strong>: Error
                monitoring via DSN; captures errors and stack traces. PII
                (emails, user IDs) is scrubbed via a{" "}
                <code className="font-mono text-text-primary">beforeSend</code>{" "}
                hook before transmission.
              </li>
              <li>
                <strong className="text-text-primary">PostHog</strong>: Product
                analytics on the EU instance (
                <code className="font-mono text-text-primary">
                  eu.posthog.com
                </code>
                ) for GDPR-compliant data residency. Cookie-consent-gated.
              </li>
              <li>
                <strong className="text-text-primary">Plausible</strong>:
                Privacy-first pageview analytics. Cookie-free and EU-hosted.
              </li>
              <li>
                <strong className="text-text-primary">Vercel</strong>: Web
                hosting and deployment
              </li>
              <li>
                <strong className="text-text-primary">Fly.io</strong>: API
                hosting
              </li>
              <li>
                <strong className="text-text-primary">GitHub App</strong>:
                Optional user integration for exercise push flow (only when
                explicitly authorized by you)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Cookies
            </h2>
            <p>
              We use essential cookies for authentication session management.
              When PostHog analytics is active, analytics cookies are only set
              with your explicit consent via our cookie banner. Plausible does
              not use cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. Your Rights (GDPR / CCPA)
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access and export your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of non-essential analytics</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email{" "}
              <a
                href="mailto:privacy@tensorcraft.app"
                className="text-accent hover:underline"
              >
                privacy@tensorcraft.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain your account data and learning progress for as long as
              your account is active. If you delete your account, we will remove
              your personal data within 30 days. Anonymized analytics data may
              be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Tensorcraft is not intended for users under the age of 16. We do
              not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of significant changes via email. The &quot;Last
              updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              10. Contact
            </h2>
            <p>
              Questions about privacy? Contact our data protection team at{" "}
              <a
                href="mailto:privacy@tensorcraft.app"
                className="text-accent hover:underline"
              >
                privacy@tensorcraft.app
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
