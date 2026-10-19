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
            This course is for you if you
          </h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {[
              "Write JavaScript or TypeScript and want to understand how models work, beyond calling an API.",
              "Learn by writing code. Each lesson gives you an exercise with checks that run in your browser.",
              "Want models training in your own browser, with no Python toolchain to install first.",
              "Know array methods, typed arrays, and async code. The lessons use those skills to explain ML concepts.",
            ].map((item) => (
              <li
                key={item}
                className="text-sm text-text-muted leading-relaxed font-sans flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className="text-primary shrink-0"
                ></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-page p-8">
          <h3 className="font-mono text-sm font-bold text-text-muted mb-5 tracking-wide">
            Consider another course if you
          </h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {[
              "Need Python, PyTorch, or scikit-learn. This course teaches ML through JavaScript, mainly with TensorFlow.js.",
              "Prefer video lessons. This course uses illustrated scenes, interactive examples, and coding exercises.",
              "Want a short overview. Deep Orbit has 56 lessons, and later modules build on the earlier ones.",
              "Want to start with mathematical proofs. Here, you work with code first and can open the derivations for more detail.",
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
