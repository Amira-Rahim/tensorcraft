import { FAQ_ITEMS } from "../faq-data";

interface FaqSectionProps {
  /** Test hook. Landing uses `landing-faq`, pricing uses `pricing-faq`. */
  testId: string;
  /** Small uppercase label above the heading. */
  eyebrow: string;
  heading: string;
  /**
   * Horizontal padding/width classes applied to the header and to every row,
   * so the two stay aligned. Landing runs full-bleed rows (`px-10 md:px-20`);
   * pricing is a centred column and passes a max-width instead.
   */
  containerClassName?: string;
  className?: string;
}

/**
 * Server-rendered FAQ, static two-column rows, zero JS.
 *
 * Shared by the landing page and /pricing. Objections peak on the pricing
 * page, but the FAQ used to render only on the landing page, so the one
 * screen where a buyer is actively deciding answered nothing. Rendering it
 * in both places (rather than moving it) keeps objection handling on the
 * highest-traffic page too.
 *
 * This component also EMITS the FAQPage JSON-LD (moved here from the root
 * layout 2026-07-25, Tier 1-OPS): schema markup belongs on the pages that
 * visibly render the FAQ, not on every route sitewide - and co-locating it
 * with the render makes page-content/schema drift structurally impossible.
 */
export function FaqSection({
  testId,
  eyebrow,
  heading,
  containerClassName = "px-10 md:px-20",
  className = "border-b border-border",
}: FaqSectionProps) {
  return (
    <section data-testid={testId} className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <div className={`${containerClassName} pt-16 pb-10`}>
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
          <span className="w-[7px] h-[7px] bg-primary inline-block" />
          {eyebrow}
        </div>
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
          {heading}
        </h2>
      </div>
      {/* Was a <details> accordion until 2026-08-14. An accordion answer can
          only hang below its full-width question row in one capped column,
          which left the right half of every open row empty on wide screens.
          Four short answers don't earn a click to reveal, so each row is now
          a static question | answer grid: the answer column doubles as the
          reading measure, so no separate max-w cap is needed. */}
      <div className="border-t border-border divide-y divide-border">
        {FAQ_ITEMS.map((item) => (
          <div
            key={item.q}
            className={`${containerClassName} py-10 md:py-12 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16`}
          >
            <h3 className="font-mono text-xl md:text-2xl font-bold text-text-primary leading-snug mb-4 md:mb-0">
              {item.q}
            </h3>
            <p className="text-base md:text-lg text-text-muted leading-relaxed font-sans">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
