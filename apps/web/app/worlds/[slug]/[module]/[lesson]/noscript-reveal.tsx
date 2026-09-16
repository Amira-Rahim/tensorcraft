/**
 * Reveal the lesson body when JavaScript never runs.
 *
 * The scene playback rules in globals.css hide instructional content while
 * `:is([data-script-state="idle"], [data-script-state="playing"])`, and the warm-up initially holds the Briefing in an idle state. So a client without JavaScript, which includes any crawler that
 * does not execute it, receives the lesson text at `opacity: 0` and
 * `display: none` and never sees it revealed.
 *
 * That is cloaking-adjacent on the primary organic surface: the markup says
 * one thing and the rendered page shows another. This undoes it for exactly
 * the case that cannot recover on its own.
 *
 * A `<noscript>` element is the only honest way to express "JS did not run".
 * CSS cannot detect it, and doing it from JS is circular.
 *
 * Server component on purpose: it must be in the initial HTML, since by the
 * time a client component could add it the condition it guards is already
 * false.
 */
export function NoscriptReveal() {
  return (
    <noscript>
      <style
        // Mirrors the three hiding rules in globals.css. Kept as one string
        // so it stays obvious that this is an override and not new styling.
        dangerouslySetInnerHTML={{
          __html: `
[data-script-state="idle"] {
  visibility: visible !important;
}
:is([data-script-state="idle"], [data-script-state="playing"]) [data-script-beat]:not([data-beat-shown]),
:is([data-script-state="idle"], [data-script-state="playing"]) .lesson-step-content[data-story-register="true"] > :not([data-beat-shown]) {
  opacity: 1 !important;
  transform: none !important;
}
:is([data-script-state="idle"], [data-script-state="playing"]) .lesson-step-content[data-story-register="true"] > :where(h2, h3, h2 ~ *, h3 ~ *) {
  display: revert !important;
}
:is([data-script-state="idle"], [data-script-state="playing"]) .tc-cut-to {
  display: revert !important;
}
`,
        }}
      />
    </noscript>
  );
}
