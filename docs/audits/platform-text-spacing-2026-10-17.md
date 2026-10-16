# Platform text spacing

Date: 2026-10-17

## Cause and fixes

Unlayered `.lesson-prose` defaults took precedence over Tailwind utilities.
The experiment paragraph reset also removed margins supplied by `space-y-*`.
This affected shared lesson rendering across worlds and article prose.

- Moved generic paragraph, heading, list, code, link, and emphasis defaults to
  the `components` layer. Their existing values remain; explicit utilities in
  the later `utilities` layer can now replace them.
- Kept mobile code wrapping, story presentation, visibility, and specialized
  layout rules outside that migration.
- Restricted the tensor status reset to direct paragraph children, protecting
  nested feedback and dialogue spacing.
- Gave multiple challenge instruction/result paragraphs 12px separation while
  keeping single-paragraph snippets compact.
- Rebuilt the Tensor Shapes activity as full-width story, definition,
  numbered stages, readings, prediction, and result areas. CSS grid gaps own
  their spacing. Inputs use 20px text; reading text retains the lesson scale.

## Source audit

Reviewed app/shared lesson CSS, world theme variables, and shared MDX text
components. Dashboard/progress, purchase confirmation, receipt email,
marketing, legal, auth/settings, and tooltips use separate scoped styles or
explicit grid/flex gaps. No matching global prose leak was found there, so
their intentional compact spacing was retained.

The audit distinguishes resets inside a layout with explicit gaps from rules
that flatten nested prose. It does not apply blanket paragraph margins.

## Verification

The CSS regression suite compiles the real Tailwind imports and inspects the
resulting cascade layers. It checks authored utility precedence, unchanged
fallback prose values, mobile code wrapping, nested tensor feedback, and
multi-paragraph challenge spacing. Related component, lesson partition, and
layout tests also pass. The final combined run passed 190 tests across nine
files. Web TypeScript and targeted lint checks pass.

Browser checks cover the Tensor Shapes activity before and after prediction,
its table and sensor comparison, incorrect feedback, and the changed example.
At 320px, the reading area is 280px wide and the page remains 320px wide.
The twelve-value strip and tables scroll locally. The desktop activity now
uses the complete 1416px lesson frame.

Pricing retains its authored spacing. The local blog listing contains no
published articles, and the other-world lesson sampled is not currently
served. Their shared prose behavior is covered by compiled CSS and source
review, not claimed as an end-to-end browser check of those pages.
