import { BRIDGES, WORLD_CONTENT } from "@tensorcraft/shared";

/**
 * One bridge, taught in full, on /learn. Server component, zero JS.
 *
 * The gateway page's job is to let a visitor DO the thing, so instead of
 * describing the bridge mechanic it runs one real registry bridge through
 * the lesson grammar: code pair, connection, and the breaks panel. One
 * public bridge follows the landing's precedent (bridge-preview-section);
 * the catalog itself stays paid content, so exactly one, no cycler.
 *
 * Bridge #2 (component state <-> model weights) is the pick because its
 * jsConcept is the page's own first claim ("if you understand useState...").
 * The connection is trimmed to its first two sentences: the registry text
 * goes on to cross-reference bridges #1 and #8, which mean nothing to a
 * visitor who has not opened the course.
 */
const TAUGHT_ID = 2;

export function TaughtBridge() {
  const bridge = BRIDGES.find((b) => b.id === TAUGHT_ID);
  if (!bridge) return null;
  const jsCode = bridge.variants?.react?.jsCode;
  const connection = bridge.connection.split(". ").slice(0, 2).join(". ") + ".";

  return (
    <div
      data-testid="learn-taught-bridge"
      className="border border-border bg-surface"
    >
      {/* The concept pair IS the header; no bookkeeping chrome. ("Tier"
          is course vocabulary a stranger has not been taught, and the
          catalog position is trivia at this point in the funnel.) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
        <p className="font-mono text-sm md:text-base font-bold text-text-primary m-0">
          {bridge.jsConcept}{" "}
          <span aria-hidden="true" className="text-primary">
            ⇄
          </span>{" "}
          {bridge.mlConcept}
        </p>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Bridge {bridge.id} of {WORLD_CONTENT.lessonBridges}
        </span>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* tabIndex + region: the cells scroll sideways when the code
            overflows, and a scrollable region must be keyboard-reachable
            (axe scrollable-region-focusable). */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div
            tabIndex={0}
            role="region"
            aria-label="JavaScript code"
            className="border border-border bg-code-bg px-4 py-3 overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="block font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-1.5">
              JavaScript
            </span>
            <code className="font-mono text-[13px] text-text-primary whitespace-pre">
              {jsCode}
            </code>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Machine learning code"
            className="border border-border bg-code-bg px-4 py-3 overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="block font-mono text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-1.5">
              Machine Learning
            </span>
            <code className="font-mono text-[13px] text-primary whitespace-pre">
              {bridge.mlCode}
            </code>
          </div>
        </div>

        <p className="text-sm md:text-base text-text-muted font-sans leading-relaxed">
          <span className="font-mono text-xs text-primary">bridge:</span>{" "}
          {connection}
        </p>
      </div>

      {/* The differentiator: every bridge records where the analogy stops.
          Dashed separator per the in-course BridgeBreaks grammar; no accent
          bars anywhere (repo ban). */}
      <div className="px-5 py-4 border-t border-dashed border-border">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-text-primary mb-2">
          {"//"} where it breaks
        </p>
        <p className="text-sm md:text-base text-text-muted font-sans leading-relaxed">
          {bridge.breaks}
        </p>
      </div>
    </div>
  );
}
