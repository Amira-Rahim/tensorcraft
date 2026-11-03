# Evaluation inspector visual review

Local prototype for the next Deep Orbit evaluation feature. It uses the current
world tokens, shared lesson/story/dialogue CSS, original artwork, and selected
current lesson passages. The inspector is proposed UI. Production code remains
unchanged.

## Preview and verification

From the repository root:

```sh
node docs/design-previews/evaluation-inspector/serve.cjs
```

Open [the local preview](http://127.0.0.1:8768/docs/design-previews/evaluation-inspector/index.html).
Choose Challenge to inspect the record. Preview settings expose empty, zero-error,
incomplete, stale, and failed-rerun views. The theme button switches appearance.

```sh
node docs/design-previews/evaluation-inspector/verify.cjs
```

The script writes `verification.json` and the `screenshots` directory. It checks
responsive layouts, source labels, case selection, keyboard focus, reduced
motion, image/font loading, accessible controls, preview saving, and download.
Automated accessibility scans supplement visual inspection. They do not replace
screen-reader observation or learner research.

## Data and boundaries

`maintainer-run.json` contains one actual CPU run of the current authored
`deep-scan-eval` solution on TFJS 4.22.0. It retains all 43 cases, exact input
values, supplied labels, scores, metrics, source hashes, and capture time. The
run produced 40 correct predictions, three missed anomalies, and no false alarms.
These values are observations, not required learner outcomes.

`capture.cjs` reproduces the capture process. Re-running it replaces the example
and may change scores because model initialization and training order vary.
Run visual verification again if the capture changes. The source hashes identify
what ran. They do not certify the existing production grader's provenance checks.

The zero-error fixture changes three scores and identifies itself as synthetic.
The incomplete fixture omits three records and withholds whole-run accuracy.
Stale and failed-rerun views simulate interface state around the unchanged
maintainer record. No learner output is fabricated or claimed.

Preview saving uses a dedicated sessionStorage key. It does not touch the
production evidence store, drafts, account data, or progress. Download exports
the displayed preview record with its origin and scenario. The local server
serves only this preview and its explicit public style/font/image dependencies.

The five-section frame contains selected passages for composition review. It
does not render the complete production lesson or exercise editor. The original
scene artwork and Mirza's dialogue precede the proposed Challenge. The epilogue
retains the supervised-prototype decision and explicitly identifies the crew's
fictional 94% and 0.518 separately from the recorded run. Existing concept
experiments, recall grading, cost decisions, and transfer work remain unchanged.

## Visual critique and corrections

The first automated pass succeeded, but screenshot inspection found a tall
mobile plot that separated its controls from the evidence. The revised plot
packs points more closely while preserving exact horizontal score positions.
Category controls now precede the plot, and the caption explains that vertical
stacking only separates overlapping points. Unselected points retain stronger
contrast so the full distribution remains visible.

The 320px navigation needed two rows to keep all five section names distinct.
The revised layout keeps readable labels. Story passages retain the full
content width. Repeated setup copy was shortened, runtime details moved into
the captured-details disclosure, and Challenge now includes the original scene
artwork before the inspector. Compact case-selector labels fit narrow screens,
and Previous case / Next case controls share their height when labels wrap.

The final browser matrix checks 80 layout views at 1440, 1024, 390, and 320px
in both themes. The verification report records interaction/data checks,
18 automated accessibility scans, source hashes, and 32 screenshots. Refer to
`verification.json` for the result of the latest run. Representative views:

- [Desktop inspector](screenshots/inspector-1440-light.png)
- [Mobile inspector](screenshots/inspector-390-dark.png)
- [320px Challenge with story](screenshots/challenge-320-light.png)
- [Briefing](screenshots/briefing-1440-dark.png)
- [Epilogue](screenshots/epilogue-390-light.png)

The remaining production work includes the grader repairs, live exercise
capture, ownership and persistence integration, and a browser review inside
the complete paid lesson. This prototype supplies visual and interaction
evidence, not those implementation results or evidence of learner understanding.
