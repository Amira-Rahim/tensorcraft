# Dependency CI fixes, November 19, 2026

Next.js 16.4.5 clears the production dependency audit. Vite 8.3.8 supplies
the API that React plugin 6.3.0 needs. The lesson checks and browser test
that use esbuild now import it directly.

On Node 22.23.2, the frozen install, lint, format check, typecheck and
production build passed. Vitest passed 4,399 tests. The separate exercise
run passed all 65 cases. Playwright passed 307 tests and skipped 38.

## Search recrawl assessment

The previous and patched local production builds contain the same 30
prerendered pages. Their text, links, titles, descriptions, canonical URLs,
robots directives and structured data match. The builds also produce
identical sitemap and robots files. The remaining changes affect lint and
test coverage. No public URL needs a recrawl for this change.

## Browser runtime lab download

PR #80 updates the converter's msgpack pin to 1.2.3. The repository and
download guides use Python 3.11 on Apple silicon. CI compares the files
inside the learner ZIP with the sources that the packager includes.

The public file affected by this PR is
[`/assignments/browser-runtime-lab-v1.zip`](https://tensorcraft.app/assignments/browser-runtime-lab-v1.zip).
The production URL serves a ZIP and sits outside the sitemap. The lessons
keep the same download link and page content. No search recrawl is needed.
