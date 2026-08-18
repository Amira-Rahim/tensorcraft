interface WhoThisIsForProps {
  /** Test hook. Landing uses `landing-who-for`, paywall uses `paywall-who-for`. */
  testId: string;
  className?: string;
}

/**
 * Audience qualifier.
 *
 * The site previously never said who the course was for. Unqualified visitors
 * had nothing to bounce off, and qualified ones never got the self-recognition
 * beat that precedes a purchase. Naming who it *isn't* for is what makes the
 * "for you" column believable, so the right-hand column is deliberately not
 * softened.
 *
 * Server-rendered, zero JS. Shared by the landing page and /paywall.
 */
export function WhoThisIsFor({
  testId,
  className = "border-b border-border",
}: WhoThisIsForProps) {
  return (
    <section
      data-testid={testId}
      className={`px-10 md:px-20 py-16 ${className}`}
    >
      <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
        <span className="w-[7px] h-[7px] bg-primary inline-block" />
        Before you start
      </div>
      <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-10">
        Who This Is For
      </h2>

      <div className="grid gap-px bg-border md:grid-cols-2 border border-border">
        <div className="bg-page p-8">
          <h3 className="font-mono text-sm font-bold text-primary mb-5 tracking-wide">
            Build this if you
          </h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {[
              "Write JavaScript or TypeScript and want ML to stop being a black box you call through an API.",
              "Learn by building. Every lesson ends in code you run, graded against real TensorFlow.js, not a quiz.",
              "Want models training in your own browser, with no Python toolchain to install first.",
              "Already know the language. Array methods, async, and loops over data are the ramp into tensors, not an obstacle.",
            ].map((item) => (
              <li
                key={item}
                className="text-sm text-text-muted leading-relaxed font-sans flex gap-3"
              >
                <span aria-hidden="true" className="text-primary shrink-0">
                  &rarr;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-page p-8">
          <h3 className="font-mono text-sm font-bold text-text-muted mb-5 tracking-wide">
            Skip it if you
          </h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {[
              "Need Python, PyTorch, or scikit-learn specifically. This is TensorFlow.js end to end, and that is a deliberate constraint, not a stepping stone.",
              "Want to watch rather than type. There is no video track, and the exercises gate progress.",
              "Are looking for a weekend skim. Deep Orbit is 56 lessons and the later modules assume the earlier ones.",
              "Want proofs first. The derivations are here, but they sit in optional drawers under the working code.",
            ].map((item) => (
              <li
                key={item}
                className="text-sm text-text-muted leading-relaxed font-sans flex gap-3"
              >
                <span aria-hidden="true" className="text-text-muted shrink-0">
                  &times;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
