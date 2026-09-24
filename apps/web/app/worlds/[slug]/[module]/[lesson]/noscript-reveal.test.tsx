import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NoscriptReveal } from "./noscript-reveal";

/**
 * Guards the no-JS reveal against the CSS drifting out from under it.
 *
 * The hiding rules live in globals.css and the override lives here, which is
 * a two-place invariant. If someone renames `data-script-state` or the
 * `.lesson-step-content` hook without touching this file, the lesson body
 * silently goes back to shipping invisible to anything that does not run
 * JavaScript, and nothing would fail.
 */
describe("NoscriptReveal", () => {
  // Rendered through the SERVER renderer on purpose. React only emits
  // noscript children when rendering to markup; a client render produces an
  // empty <noscript> every time. Since this element exists precisely to be in
  // the initial HTML, the server renderer is also the real path.
  function css() {
    return renderToStaticMarkup(<NoscriptReveal />);
  }

  it("renders inside a noscript element", () => {
    expect(css()).toContain("<noscript>");
  });

  it("targets the exact state the SSR markup ships in", () => {
    expect(css()).toContain('[data-script-state="idle"]');
    expect(css()).toMatch(/visibility:\s*visible\s*!important/);
  });

  it("undoes every hiding mechanism, not just the opacity one", () => {
    const style = css();

    // Two different mechanisms hide content: opacity/transform on unshown
    // beats, and display:none on the instructional block. Reverting only the
    // first would leave the actual lesson text invisible.
    expect(style).toMatch(/opacity:\s*1\s*!important/);
    expect(style).toMatch(/display:\s*revert\s*!important/);
  });

  it("covers the cut-to marker, which uses its own !important rule", () => {
    expect(css()).toContain(".tc-cut-to");
  });

  it("lays the Briefing story grid out as one 820 px column", () => {
    // Revealed without JavaScript, the whole teaching body renders in the
    // Briefing's beats column, 544 px beside the picture at 1,440. One
    // column capped like other prose puts the picture above it and reads
    // the body at 820 px.
    expect(css()).toMatch(
      /\.lesson-story-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 820px\)\s*!important;\s*\}/,
    );
  });
});
