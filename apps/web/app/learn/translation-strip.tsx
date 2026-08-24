/**
 * Zero-JS translation strip for /learn: the page's own three analogies
 * (useState, array.map, fetch) rendered in the JS | ⇄ | ML panel grammar of
 * bridge-preview-section.tsx. Server component, fully indexable.
 *
 * Deliberately hardcoded, NOT sourced from the 51-bridge registry: the
 * catalog is paid content and stays off public browsing surfaces (owner
 * ruling recorded in bridge-preview-section.tsx). No cycler, no tabs.
 */

interface StripRow {
  js: string;
  ml: string;
  bridge: string;
}

const ROWS: StripRow[] = [
  {
    js: "const [w, setW] = useState(0.4)",
    ml: "const w = tf.variable(0.4)",
    bridge:
      "A weight is state: you set it, read it, and update it until the output looks right.",
  },
  {
    js: "readings.map((x) => x * 2)",
    ml: "tf.tensor(readings).mul(2)",
    bridge: "A tensor op is a map that runs on every element at once.",
  },
  {
    js: 'await fetch("/api/predict")',
    ml: "await model.predict(input).data()",
    bridge:
      "Inference is a function call: input in, prediction out, await the result.",
  },
];

export function TranslationStrip() {
  return (
    <div data-testid="learn-translation-strip" className="space-y-6">
      {/* Column heads, one row for the whole strip (hidden when cells stack) */}
      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
          JavaScript
        </div>
        <div aria-hidden="true" className="font-mono text-text-muted px-2">
          ⇄
        </div>
        <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
          Machine Learning
        </div>
      </div>

      {ROWS.map((row) => (
        <div key={row.js}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center">
            <div className="border border-border bg-code-bg px-4 py-3 overflow-x-auto">
              <span className="md:hidden block font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-1.5">
                JavaScript
              </span>
              <code className="font-mono text-[13px] text-text-primary whitespace-nowrap">
                {row.js}
              </code>
            </div>
            <div
              aria-hidden="true"
              className="hidden md:block font-mono text-primary px-2"
            >
              ⇄
            </div>
            <div className="border border-border bg-code-bg px-4 py-3 overflow-x-auto">
              <span className="md:hidden block font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-1.5">
                Machine Learning
              </span>
              <code className="font-mono text-[13px] text-primary whitespace-nowrap">
                {row.ml}
              </code>
            </div>
          </div>
          <p className="mt-2 text-sm text-text-muted font-sans leading-relaxed">
            <span className="font-mono text-xs text-primary">bridge:</span>{" "}
            {row.bridge}
          </p>
        </div>
      ))}
    </div>
  );
}
