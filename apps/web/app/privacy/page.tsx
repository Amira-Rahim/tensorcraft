import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Tensorcraft",
  description: "Tensorcraft Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-24">
      <article className="max-w-[720px] mx-auto">
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-primary transition-colors mb-12 inline-block"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-12">Last updated: March 10, 2026</p>

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
              <strong className="text-text-primary">Analytics data:</strong> We
              use privacy-focused analytics (PostHog EU, Plausible) to
              understand how the platform is used. We do not sell your data to
              third parties.
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
                <strong className="text-text-primary">Supabase</strong> —
                Authentication and database
              </li>
              <li>
                <strong className="text-text-primary">Stripe</strong> — Payment
                processing
              </li>
              <li>
                <strong className="text-text-primary">PostHog (EU)</strong> —
                Product analytics (GDPR-compliant)
              </li>
              <li>
                <strong className="text-text-primary">Plausible</strong> —
                Marketing analytics (cookie-free)
              </li>
              <li>
                <strong className="text-text-primary">Vercel</strong> — Hosting
                and deployment
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Cookies
            </h2>
            <p>
              We use essential cookies for authentication session management.
              Analytics cookies (PostHog) are only set with your explicit
              consent. Plausible does not use cookies.
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
                href="mailto:privacy@tensorcraft.dev"
                className="text-accent hover:underline"
              >
                privacy@tensorcraft.dev
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
                href="mailto:privacy@tensorcraft.dev"
                className="text-accent hover:underline"
              >
                privacy@tensorcraft.dev
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
