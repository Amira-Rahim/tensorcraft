import Link from "next/link";
import { Suspense } from "react";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import type { Metadata } from "next";
import { PaymentError } from "./payment-error";

export const metadata: Metadata = {
  title: "Pricing | Tensorcraft",
  description:
    "One payment. Lifetime access. Learn browser-based ML through familiar frontend concepts.",
};

const tiers = [
  {
    id: "free" as const,
    features: [
      `${THEME_CONTENT.lessonsPerModule} lessons`,
      "1 module",
      "Full code editor",
      "FE-to-ML bridges",
      "Quizzes included",
    ],
    description:
      "Module 1 of any launched theme (5 lessons). Full code editor, bridges, and quizzes.",
    note: "No credit card required",
    cta: "Start Free",
    href: "/themes/deep-orbit",
    recommended: false,
  },
  {
    id: "single" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons`,
      `${THEME_CONTENT.modulesPerTheme} modules`,
      "All exercises",
      "GitHub integration",
      "Community access",
      "Lifetime updates",
    ],
    description: `Complete Deep Orbit \u2014 ${THEME_CONTENT.totalLessonsPerTheme} lessons, ${THEME_CONTENT.modulesPerTheme} modules`,
    note: "",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/single",
    recommended: true,
  },
  {
    id: "twoBundle" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons per theme`,
      `${THEME_CONTENT.modulesPerTheme} modules per theme`,
      "All exercises",
      "GitHub integration",
      "Community access",
      "Lifetime updates",
      "Choose any 2 themes",
    ],
    description: "Any two themes",
    note: "Save $29 vs buying separately",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/twoBundle",
    recommended: false,
  },
  {
    id: "threeBundle" as const,
    features: [
      `${THEME_CONTENT.totalLessonsPerTheme} lessons per theme`,
      `${THEME_CONTENT.modulesPerTheme} modules per theme`,
      "All exercises",
      "GitHub integration",
      "Community access",
      "Lifetime updates",
      "Choose any 3 themes",
    ],
    description: "Any three themes",
    note: "Save $68 vs buying separately",
    cta: "Get Started",
    href: "/auth/sign-in?redirectTo=/pricing/checkout/threeBundle",
    recommended: false,
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-[14px] border border-border bg-surface-raised overflow-hidden">
      <summary className="flex items-center justify-between w-full px-6 py-[18px] cursor-pointer text-[15px] font-semibold text-white list-none [&::-webkit-details-marker]:hidden">
        {question}
        <span className="text-text-muted text-sm transition-transform group-open:rotate-180">
          &#9662;
        </span>
      </summary>
      <div className="px-6 pb-5 text-sm text-text-muted leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

export default function PricingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      {/* Payment Error Banner */}
      <div className="pt-24 px-6">
        <Suspense fallback={null}>
          <PaymentError />
        </Suspense>
      </div>

      {/* Hero */}
      <section
        className="pt-28 pb-16 px-6 text-center relative"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0,212,255,0.10), transparent 60%), radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0,212,255,0.06), transparent 50%), var(--tc-bg, #080B16)",
        }}
      >
        <div className="inline-flex px-5 py-2 border border-border rounded-full text-[13px] text-text-muted tracking-wider mb-8">
          One Payment &middot; Lifetime Access &middot; No Subscriptions
        </div>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-5"
          style={{ color: "var(--tc-text, #FFFFFF)", letterSpacing: "-0.02em" }}
        >
          Simple, Fair Pricing
        </h1>
        <p
          className="text-lg max-w-[520px] mx-auto"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          One payment. Lifetime access. Every future update included. No
          subscriptions, ever.
        </p>
      </section>

      {/* Pricing Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-[1200px] mx-auto grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => {
            const plan = PRICING[tier.id];
            return (
              <div
                key={tier.id}
                className="rounded-2xl p-7 flex flex-col transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--tc-surface, #0F1320)",
                  border: tier.recommended
                    ? "1px solid rgba(0,212,255,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {tier.recommended ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider w-fit mb-5"
                    style={{
                      background: "rgba(0,212,255,0.1)",
                      color: "var(--tc-accent, #00D4FF)",
                      border: "1px solid rgba(0,212,255,0.2)",
                    }}
                  >
                    Recommended
                  </span>
                ) : (
                  <div className="min-h-[30px]" />
                )}

                <div
                  className="text-[40px] font-bold leading-tight mb-2"
                  style={{ color: "var(--tc-text, #FFFFFF)" }}
                >
                  ${plan.price}
                </div>
                <div
                  className="text-lg font-semibold mb-1"
                  style={{ color: "var(--tc-text, #FFFFFF)" }}
                >
                  {plan.label}
                </div>
                <p
                  className="text-sm mb-2 leading-relaxed"
                  style={{ color: "var(--tc-muted, #8B92A5)" }}
                >
                  {tier.description}
                </p>
                {tier.note && (
                  <p
                    className="text-[13px] mb-6"
                    style={{ color: "rgba(139,146,165,0.7)" }}
                  >
                    {tier.note}
                  </p>
                )}
                {!tier.note && <div className="mb-6" />}

                <ul className="flex-1 mb-7 space-y-2.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--tc-muted, #8B92A5)" }}
                    >
                      <span
                        className="text-[13px] font-bold flex-shrink-0"
                        style={{ color: "var(--tc-accent, #00D4FF)" }}
                      >
                        &#10003;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className="flex items-center justify-center w-full h-[52px] rounded-full text-[15px] font-medium transition-all"
                  style={
                    tier.recommended
                      ? {
                          border: "1px solid rgba(0,212,255,0.3)",
                          background: "rgba(0,212,255,0.08)",
                          color: "#FFFFFF",
                        }
                      : {
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "#FFFFFF",
                        }
                  }
                >
                  {tier.cta} &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="px-6 pb-24">
        <div className="max-w-[900px] mx-auto">
          <div
            className="h-px max-w-[600px] mx-auto mb-14"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)",
            }}
          />
          <p
            className="text-[13px] uppercase tracking-[0.15em] text-center mb-3"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Compare Plans
          </p>
          <h2
            className="text-3xl sm:text-[40px] font-bold text-center mb-14"
            style={{ color: "var(--tc-text, #FFFFFF)" }}
          >
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <th
                    className="text-left py-4 px-3 text-[13px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--tc-muted, #8B92A5)" }}
                  >
                    Feature
                  </th>
                  {["Free", "Single", "Two", "Three"].map((h) => (
                    <th
                      key={h}
                      className="text-center py-4 px-3 text-[13px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--tc-muted, #8B92A5)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Modules",
                    values: [
                      "1",
                      `${THEME_CONTENT.modulesPerTheme}`,
                      `${THEME_CONTENT.modulesPerTheme} \u00d7 2`,
                      `${THEME_CONTENT.modulesPerTheme} \u00d7 3`,
                    ],
                  },
                  {
                    feature: "Lessons",
                    values: [
                      `${THEME_CONTENT.lessonsPerModule}`,
                      `${THEME_CONTENT.totalLessonsPerTheme}`,
                      `${THEME_CONTENT.totalLessonsPerTheme * 2}`,
                      `${THEME_CONTENT.totalLessonsPerTheme * 3}`,
                    ],
                  },
                  {
                    feature: "Interactive exercises",
                    values: [true, true, true, true],
                  },
                  {
                    feature: "Community access",
                    values: [true, true, true, true],
                  },
                  {
                    feature: "GitHub integration",
                    values: [false, true, true, true],
                  },
                  {
                    feature: "Lifetime updates",
                    values: [false, true, true, true],
                  },
                  {
                    feature: "Choose themes",
                    values: [false, false, true, true],
                  },
                ].map((row) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <td
                      className="py-3.5 px-3"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {row.feature}
                    </td>
                    {row.values.map((val, i) => (
                      <td
                        key={i}
                        className="text-center py-3.5 px-3"
                        style={{
                          color:
                            val === true
                              ? "var(--tc-accent, #00D4FF)"
                              : val === false
                                ? "rgba(139,146,165,0.3)"
                                : "var(--tc-muted, #8B92A5)",
                        }}
                      >
                        {val === true
                          ? "\u2713"
                          : val === false
                            ? "\u2014"
                            : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PPP Note */}
      <section className="px-6 pb-24">
        <div
          className="max-w-[680px] mx-auto rounded-[14px] p-7 text-sm text-center leading-relaxed"
          style={{
            background: "var(--tc-surface, #0F1320)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "var(--tc-muted, #8B92A5)",
          }}
        >
          <strong style={{ color: "var(--tc-text, #FFFFFF)" }}>
            Purchasing Power Parity
          </strong>
          <br />
          We offer 20-70% purchasing power parity discounts automatically. If
          you&apos;re in an eligible country, you&apos;ll see the adjusted price
          at checkout.
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-24">
        <div className="max-w-[720px] mx-auto">
          <p
            className="text-[13px] uppercase tracking-[0.15em] text-center mb-3"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Support
          </p>
          <h2
            className="text-3xl sm:text-[40px] font-bold text-center mb-4"
            style={{ color: "var(--tc-text, #FFFFFF)" }}
          >
            Frequently Asked Questions
          </h2>
          <p
            className="text-lg text-center mb-14 max-w-[560px] mx-auto"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Everything you need to know about purchasing and access
          </p>

          <div className="space-y-3">
            <FAQItem
              question="Can I upgrade later?"
              answer="Absolutely. You can upgrade from any tier at any time. We'll credit the amount you've already paid toward the higher tier, so you only pay the difference."
            />
            <FAQItem
              question="What's included in lifetime access?"
              answer="Lifetime access means you pay once and own the content forever. This includes all future updates to the modules you've purchased, new lessons added to your themes, and continued access to the community."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes. We offer a full refund within 30 days of purchase, no questions asked. If the course isn't right for you, just reach out to our support team."
            />
            <FAQItem
              question="Can I share my account?"
              answer="Individual licenses are for a single user. Team plans are coming soon. Contact us at team@tensorcraft.dev for group access."
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section
        className="py-28 px-6 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,255,0.10), transparent 60%), radial-gradient(ellipse 40% 30% at 50% 0%, rgba(0,212,255,0.06), transparent 50%), var(--tc-bg, #080B16)",
        }}
      >
        <h2
          className="text-2xl sm:text-[32px] font-bold mb-4"
          style={{ color: "var(--tc-text, #FFFFFF)" }}
        >
          Your frontend skills are the foundation.
        </h2>
        <p
          className="text-lg mb-10"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Add machine learning to your engineering toolkit.
        </p>
        <Link
          href="/themes/deep-orbit"
          className="inline-flex items-center rounded-full px-9 py-4 text-[17px] font-medium transition-all"
          style={{
            border: "1px solid rgba(0,212,255,0.3)",
            background: "rgba(0,212,255,0.08)",
            color: "#FFFFFF",
          }}
        >
          Explore Deep Orbit &rarr;
        </Link>
      </section>
    </main>
  );
}
