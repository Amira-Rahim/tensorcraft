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
        url: "/api/og?title=Privacy%20Policy&subtitle=Tensorcraft%20legal&world=deep-orbit",
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
      "/api/og?title=Privacy%20Policy&subtitle=Tensorcraft%20legal&world=deep-orbit",
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
        <p className="text-text-muted mb-12">Last updated: August 16, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-text-muted">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              1. Who We Are
            </h2>
            {/* OPEN (owner decision, 2026-08-16): GDPR Art. 13(1)(a)
                requires the controller's legal identity here. The owner
                removed the placeholder pending that decision; add the
                legal entity (or sole trader) name and a registered
                address when settled. Tracked in post-launch-backlog §7. */}
            <p>
              Tensorcraft is a browser-based machine learning course for
              JavaScript engineers. Tensorcraft is the data controller for
              everything this policy describes. For any question about this
              policy, or to exercise any right in section 8, email{" "}
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
              2. Information We Collect
            </h2>
            <p className="mb-3">
              <strong className="text-text-primary">Account data:</strong> your
              email address, display name, and avatar, from GitHub, Google, or
              the email address you sign up with. Onboarding also records your
              JavaScript background, experience level, and learning goal. An
              account is required to buy.
            </p>
            <p className="mb-3">
              <strong className="text-text-primary">Learning data:</strong>{" "}
              lessons completed, exercise attempts and scores, hints used, your
              run of consecutive active days, the code you write in exercises
              and in arena challenges (timed coding challenges inside the
              course), and certificates you earn. A certificate page shows your
              display name and avatar to anyone who has its link, so share that
              link deliberately.
            </p>
            <p className="mb-3">
              <strong className="text-text-primary">Purchase data:</strong>{" "}
              payment happens on Stripe, and card numbers never reach our
              servers. We keep the plan, amount, payment status, your billing
              country, a VAT or tax ID if you entered one, and the customer
              reference Stripe assigns you, which lets us match a payment to
              your account without holding card details.
            </p>
            <p className="mb-3">
              <strong className="text-text-primary">Bug reports:</strong> the
              description you write, your email address, the page URL, your
              browser version, and a screenshot if you attach one.
            </p>
            <p className="mb-3">
              <strong className="text-text-primary">
                Waitlist and newsletter:
              </strong>{" "}
              your email address and whether you asked for the weekly digest.
            </p>
            <p>
              <strong className="text-text-primary">Technical data:</strong>{" "}
              your IP address, held for up to two minutes to rate-limit abusive
              traffic, and error reports with personal fields stripped (section
              4).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              3. How We Use It
            </h2>
            <p className="mb-2">
              Each purpose below names its legal basis under the GDPR:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Running the course: accounts, progress, certificates (contract)
              </li>
              <li>
                Processing payments and keeping tax records (contract; legal
                obligation)
              </li>
              <li>
                Sending sign-in links, receipts, and the emails you opted into
                (contract; consent)
              </li>
              <li>Rate limiting and abuse prevention (legitimate interest)</li>
              <li>Error monitoring (legitimate interest)</li>
              <li>
                Product analytics, only after you accept the cookie banner
                (consent)
              </li>
            </ul>
            <p className="mt-3">We do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              4. Analytics & Error Monitoring
            </h2>
            <p className="mb-3">
              No analytics run until you choose &quot;Accept all&quot; on the
              cookie banner. With your consent: PostHog (EU servers) records
              pageviews and product events keyed to a random account ID, never
              your name or email; Plausible and Vercel Analytics count pageviews
              without cookies; Vercel Speed Insights measures page load times,
              also without cookies. Declining the banner, or ignoring it, keeps
              all four off. You can change your answer any time via &quot;Cookie
              settings&quot; in the footer.
            </p>
            <p>
              Sentry, our error monitor, runs without consent so we can see
              crashes: our legitimate interest in a working product. Before an
              error report leaves your browser, Sentry strips emails, user IDs,
              IP addresses, and auth headers. Session recording is off.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              5. Third-Party Services
            </h2>
            <p>Your data passes through these processors:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong className="text-text-primary">Supabase</strong>:
                authentication, database, and file storage
              </li>
              <li>
                <strong className="text-text-primary">Stripe</strong>: payment
                processing
              </li>
              <li>
                <strong className="text-text-primary">Resend</strong>: sends the
                weekly digest and support notifications
              </li>
              <li>
                <strong className="text-text-primary">Kit (ConvertKit)</strong>:
                lifecycle emails, like the welcome sequence
              </li>
              <li>
                <strong className="text-text-primary">Sentry</strong>: error
                monitoring (section 4)
              </li>
              <li>
                <strong className="text-text-primary">PostHog</strong>: product
                analytics on EU servers, consent-gated
              </li>
              <li>
                <strong className="text-text-primary">Plausible</strong>:
                cookie-free pageview analytics, consent-gated
              </li>
              <li>
                <strong className="text-text-primary">Vercel</strong>: web
                hosting, plus consent-gated pageview analytics and page speed
                metrics
              </li>
              <li>
                <strong className="text-text-primary">Fly.io</strong>: API
                hosting
              </li>
              <li>
                <strong className="text-text-primary">Upstash</strong>: rate
                limiting; sees your IP address for up to two minutes
              </li>
              <li>
                <strong className="text-text-primary">jsDelivr</strong>: backup
                CDN. If our bundled copy of TensorFlow.js fails to load, your
                browser fetches it from jsDelivr, which sees your IP address
                like any web request.
              </li>
              <li>
                <strong className="text-text-primary">GitHub</strong>: optional,
                only if you connect your account to push exercise code
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              6. Cookies & Local Storage
            </h2>
            <p className="mb-3">
              Cookies we set: a session cookie that keeps you signed in
              (essential); <code className="font-mono">tc_world</code>, which
              remembers the world you picked, for one year; a ten-minute
              security cookie during GitHub sign-in; and, only after consent, a
              PostHog analytics cookie.
            </p>
            <p>
              Local storage on your device holds your cookie choice, color
              scheme, lesson progress, and drafts of your exercise code. That
              data stays in your browser until a feature you use sends it to us,
              like finishing a lesson while signed in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              7. International Transfers
            </h2>
            <p>
              Some of our providers, including Stripe, Vercel, Fly.io, Sentry,
              Resend, and Kit, process data in the United States. PostHog and
              Plausible stay on EU servers. Where your data leaves the EU, it
              moves under each provider&apos;s EU-approved safeguards: Data
              Privacy Framework certification or standard contractual clauses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              8. Your Rights (GDPR / CCPA)
            </h2>
            <p>You can:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                download everything we hold about you as JSON, from Settings
              </li>
              <li>
                correct your display name and avatar in Settings, or email us
                for anything else
              </li>
              <li>
                delete your account and data from Settings (section 9 lists the
                exceptions)
              </li>
              <li>
                opt out of analytics: decline the cookie banner, or change your
                answer under &quot;Cookie settings&quot; in the footer
              </li>
              <li>
                unsubscribe from any email via its unsubscribe link or in
                Settings
              </li>
              <li>withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              If you are in the EU or UK, you can also lodge a complaint with
              your data protection authority. For anything not covered by a
              Settings control, email{" "}
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
              9. Data Retention
            </h2>
            <p className="mb-2">
              Your account and learning data stay while your account is active.
              Deleting your account removes them within 30 days, with three
              exceptions:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Purchase and tax records are kept up to ten years, as tax law
                requires. They are unlinked from your identity: the record keeps
                the sale, not the person.
              </li>
              <li>
                Bug reports are kept as operational records, with your email,
                account link, and screenshot removed.
              </li>
              <li>
                Analytics events are keyed to a random ID and are kept in that
                pseudonymous form.
              </li>
            </ul>
            <p className="mt-3">
              Waitlist and newsletter emails are separate from your account. We
              keep them until you unsubscribe, or for 24 months without
              engagement, whichever comes first.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              10. Children&apos;s Privacy
            </h2>
            <p>
              Tensorcraft is not intended for users under the age of 16, and our
              Terms of Service require account holders to be 16 or older. We do
              not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of significant changes via email. The &quot;Last
              updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              12. Contact
            </h2>
            <p>
              Questions about privacy? Email{" "}
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
