# Content Trust Fixes: 2026-07-12 (P0)

Source: 2026-07-12 three-agent content audit (lesson deep-read, prior-audit ledger,
promise-vs-delivery). This doc records the P0 "trust killer" fixes applied the same
day. P1 (exercise rigor), P2 (structure variety), P3 (dramatic-arc devices), and
P4 (value framing) from that audit remain open.

## Fixed (all verified: velite build clean, typecheck 9/9, vitest 121 files / 942 tests green)

1. **First-neuron arithmetic**: `deep-orbit/neural-networks/01-first-neuron.mdx`
   claimed output `0.18`; correct value is `0.26` (0.5·0.4 + 0.8·(−0.2) + 0.2·0.6 + 0.1).
   Both the tf.dot comment and the reduce() comment now say 0.26.
2. **Quantization falsehoods**: `deep-orbit/optimization-edge/02-quantization.mdx`
   no longer claims "inference runs on integer hardware, faster on every device."
   TFJS `quantizationBytes` is storage-only; weights decode back to float32 at load.
   The lesson now teaches this explicitly (new paragraph after the save block,
   TFLite contrast included). All "float16 / int8" labels corrected to uint16 / uint8
   affine storage across frontmatter, objectives, code comments, recall, recap, epilogue.
3. **FFT bin count**: `deep-orbit/signal-processing/02-fourier-transform.mdx` said
   both "N coefficients" and "N/2+1 bins." Now consistent: N complex coefficients in
   the full DFT, conjugate symmetry for real input, rfft keeps N/2+1. Derivation
   drawer gained the conjugate-symmetry note.
4. **Nyquist vs 73.4 Hz**: new canon: the hull sensor array samples at **256 Hz**
   (Nyquist 128 Hz), stated in signal-processing/02 and added to
   `docs/story-style-bible.md` canon facts. Teaching demos may still use 128 Hz.
5. **LSTM wording**: `deep-orbit/recurrent-networks/03-lstm-gates.mdx`: "4 weight
   matrices per gate" corrected to 4 weight-matrix sets (forget/input/output gates +
   candidate state) vs GRU's 3.
6. **Dead autoencoder code**: `deep-orbit/anomaly-detection/02-autoencoders.mdx`:
   the separate encoder/decoder models are now composed
   (`autoencoder.add(encoder); autoencoder.add(decoder)`) instead of an abandoned
   inline rebuild; comment notes `encoder.predict()` bottleneck inspection payoff.
7. **Backprop speedup numbers**: `deep-orbit/training-loop/03-backpropagation.mdx`:
   ARIA's "673x" replaced with the defensible claim (one backward sweep ≈ two forward
   passes, ≈200x); epilogue timings made coherent (27 s naive vs 120 ms
   forward+backward; was 11 ms backward-only).
8. **"Quizzes" promise**: `apps/web/app/pricing/pricing-tiers.tsx` free-tier card:
   "quizzes" → "graded exercises" (Deep Orbit ships 0 Quiz components; RecallPrompts
   are ungraded). Revisit if graded quizzes ship (P1 item 16).
9. **/compare math-depth row**: `apps/web/app/compare/page.tsx`: was "Chain rule,
   softmax, KL, ELBO, DDPM derived" (softmax/ELBO/DDPM not in buyable content).
   Now "Chain rule, DFT, cross-entropy derived in optional drawers; KL divergence
   in the math companion (ELBO, DDPM with future themes)." KL is genuinely taught
   in `extras/math-deep-dive/05-information-theory.mdx`; ELBO/DDPM are not built
   anywhere.
9b. **Extras page ELBO overclaim** (found in recheck): `apps/web/app/extras/page.tsx`
   meta description claimed "chain rule, KL, ELBO" derivations; ELBO has zero
   occurrences in extras content. Now "chain rule, KL divergence, Bayesian updates,"
   matching the actual math-deep-dive module.
10. **Certificate button honesty**:
    `apps/web/app/themes/[slug]/capstone/capstone-client.tsx`: label is now
    "Print Certificate" while `pdf_url` is null (falls back to `window.print()`),
    "Download PDF" only once a real PDF URL exists. Legacy button relabeled.
    Test updated (`__tests__/page.test.tsx`).

## Recheck round (same day)

An adversarial verification pass (independent agent + runtime checks in real TFJS
4.22.0) confirmed fixes 1, 3, 5, 6, 7, 8, 10 solid and found the following holes,
all fixed and re-verified (velite clean, typecheck 9/9, vitest 942, grader 80/80):

- **int8 mislabel residue** beyond lesson 02: `quantize-weights.yaml` title and
  instructions (0-255 range is uint8, not int8), `03-pruning.mdx` (3 spots),
  `05-webgpu-acceleration.mdx` (1 spot), plus one "int8 quantization" comment in
  lesson 02 itself, now "8-bit". Only sanctioned int8 mention left: the TFLite
  contrast sentence.
- **Spectrograms lesson contradicted the new 256 Hz canon and was broken**:
  `03-spectrograms.mdx` computed the 73.4 Hz anomaly bin with sampleRate=128
  (aliased) and got bin 147, out of range for a 256-sample rfft (129 bins), so the
  `findAnomalyWindows` example silently returned empty. Whole example chain moved
  to 256 Hz hull data: 1024 samples, 7 windows, bin 73; window-tradeoff comments
  recomputed (0.25s/4Hz, 2s/0.5Hz, 1s/1Hz). Runtime-verified: anomaly now detected
  at windows [3,4,5,6].
- **Extras page ELBO overclaim** (see 9b above).
- **rfft precision**: fourier lesson line "The FFT transforms... into N/2+1 bins"
  now attributed to `rfft` for real signals, not "the FFT".
- **ARIA speedup precision**: "near 200x" tightened to "roughly 225x", matching
  both theory (674 passes vs ~3 forward-equivalents) and the epilogue measurement
  (27 s / 120 ms = 225).
- **Legacy `--` em-dash surrogates** in autoencoders recap/bridge replaced.
- **Internal doc promises aligned**: `docs/prd.md` free-preview row and
  `docs/tech-spec.md` core-layer description no longer say "quizzes." Remaining
  quiz mentions in prd/tech-spec are historical design-spec sections describing
  the deprecated `<Quiz>` component, left as-is.
- Runtime checks (scratchpad, real TFJS): neuron 0.26 exact; rfft(128) = 65 bins,
  magnitudes 64.0/19.2 as printed in the lesson; nested
  `sequential().add(encoder/decoder)` builds, trains, and `encoder.predict()`
  returns the [_, 4] bottleneck; spectrogram example detects the anomaly.

## Launch-gate exhaustive audit (round 3, same day)

Seven parallel fact-check agents covered EVERY built lesson (all 56 Deep Orbit +
all ~20 extras), every module.yaml, every exercise/incident yaml, the full
bridges registry (51: clean), the glossary (~110 defs: clean), and every
user-facing marketing surface. 23 further confirmed errors found and fixed, every
new number proven by executing it against real TFJS 4.22 (19/19 runtime checks):

Content: foundations/05 z-score outputs were fabricated (now [-0.80..1.71] /
[-1.40..1.27]) + "handles outliers gracefully" softened; foundations/02 "first
hour" rate contradiction removed; nn/03 "weights"→"parameters"; training-loop/01
MSE 0.188→0.268 AND sigmoidCrossEntropy now fed logits (was probabilities; same
double-sigmoid bug fixed in training-loop/03's code block); training-loop/02
gradient-descent trace was fabricated (never converges to 3.000 at lr=0.1; now
the real 2.214/0.966 → 2.916/0.011) + lerp bridge loss gains the ½ factor that
makes "0.1 is the learning rate" exact; batch sweet spot unified at 32-512;
sp/01 sampled the 73.4 Hz anomaly at 100 Hz (aliases to 26.6 Hz; whole demo
moved to 256 Hz, printed values recomputed); sp/05's ENTIRE leakage demo was
inverted (10 Hz fits the window exactly = zero leakage; rewritten at 10.5 Hz
with measured numbers 41.7/39.9/14.5/1.6 raw vs 5.6/0/0 Hann, honest
main-lobe-vs-sidelobe framing) + false COLA claim (rectangular @50% DOES
satisfy COLA; example now Blackman) + stft demo call produced 0 windows (now
64/32: 3 windows); spectrograms window-span wording unified; recurrent/04
"50 time steps"→80 (matches SignalBuffer(80) and lesson 05); recurrent/05
"47 minutes"→"47 steps"; anomaly/03 feature errors scaled so the mean actually
equals the 0.062 / 12x score (was sum-vs-mean incoherent); ats/02 attention
weights de-swapped (step 85 = 0.15 peak in both blocks); ats/03 trust[0]
0.985→1.0 and drift direction fixed (pulse arrives EARLY, matching the
accelerating-interval canon and the lesson's own epilogue); ats/05 variance
cut by N (error by sqrt N); llm/01+04 totals 12,000→12,001; optimization-edge/03
frontmatter 94%→92.1% (its own table's number); webgpu lesson now notes the
required backend-package imports; remaining " -- " em-dash surrogates purged
from built prose.

Extras: classical-ml/01 sigmoid outputs 0.88/0.14→0.99/0.21 (z=4.7/-1.35);
ethics/02 equalized-odds objective no longer defines equal opportunity;
math/04 circulant qualifier on the DFT-diagonalization claim; math/06 prior
Normal(0, 1/(2λ)) + CAPTCHA posterior printed honestly ([0.1834, 0.8166]).

Marketing/app: `totalLessonsPerTheme` 55→56 (Deep Orbit real count; also
tightens the certificate gate, which previously issued at 55/56); paywall
"50 more lessons"→51; /learn "50 analogies"→51; /about's "315 exercises...
in your browser" overclaim now "80 live today... 315 authored across the
roadmap"; /about JSON-LD no longer multiplies unbuilt themes; "8 KB" model
claims corrected to the real ~4 KB download (demo, hero comment, landing stat,
e2e comment); prd/tech-spec free-tier rows aligned; hero + certificate tests
updated (55→56 expectations).

Verified after all fixes: velite clean, typecheck 9/9, vitest 121 files /
942 tests, exercise grader 80/80 on real TFJS, 19/19 numeric runtime checks.

Known-open, deliberately NOT in P0 scope (tracked in P1-P4): exercise rigor
(compute-fft gameability etc.), incident-false-alarm-storm 20-50 ratio spec gap,
globalAveragePooling-as-"simple attention" gloss, structure/boss-beat/DISPATCH
items, synthetic capstone data, 22h itemization, Kit emails.

## Round 4 (launch gate, same day): fix-verification + renderer + e2e

Three new attack surfaces, none previously covered:

**1. Adversarial review of every round-3 fix (full git diff, all numbers
recomputed independently): 0 confirmed errors.** First zero-error round.
Three low-severity notes only: "12,000 classified" dialogue is exact (12,000
classified + 1 unclassified = 12,001 total), lstm-gates/03 keeps its
standalone [50,3] teaching example (04/05 pipeline = 80), backprop drawer
teaches its own MSE+sigmoid loss (self-contained, correct).

**2. Render-path verification found the real launch blockers (pre-existing,
not content):**
- `DerivationDrawer` was missing from the live MDX component map in
  `lesson-content.tsx` (survived only in a dead object after a refactor).
  Every compiled body referencing it threw `_missingMdxReference`, crashing
  **8 built lessons to the error page from step 0** (all of training-loop +
  signal-processing/02,03,05). Unit tests missed it because they stub the
  component. FIXED: added to the map + `CODE_LEFT` step set.
- `BossBeat` and `DispatchTease` were registered but in no step's visibility
  set: the capstone's only boss beat and its dispatch tease **silently never
  rendered**. FIXED: BossBeat → Briefing set, DispatchTease → Consequence set.
- Regression test added (`lesson-content.test.tsx`): a compiled body
  referencing the full production component roster must render without
  throwing, and DerivationDrawer must show/hide by step set.
- Also retired `nextLessonTeaser` for real (schema field, renderer block,
  test, fixtures) per style bible "delete on touch."
- Known renderer behavior documented, deferred (P2): loose prose duplicates
  across up to 4 steps and is invisible on Takeaways/Consequence;
  DeepScanDemo/KeyTakeaways/Quiz/StrategyThread remain unmapped to any step
  (no built lesson uses them outside an Epilogue).

**3. Cross-module consistency matrix + stale sweep: 0 technical errors; 11
copy/punctuation stragglers fixed:** hardcoded "55 lessons" in
`paywall/page.tsx` and `pricing/paywall-notice.tsx` → 56; "(50 bridges)"
comment → 51; 7 remaining " -- " surrogates in llm-integration/capstone prose
→ semicolons/parens; 12 em-dash code comments in apps/web → colons. Canon
matrix (256 Hz, 73.4 Hz/s, params, sizes, accuracy ladder, counts, pricing,
pulse ladder) verified consistent across every surface; velite output fresh.

**4. Full Playwright e2e against the running app: 85 passed / 0 failed.**
(The first run's ~70 "failures" were an environment artifact: port 3000 was
occupied by an unrelated Ops Portal dev server and `reuseExistingServer`
pointed the tests at the wrong app. On a clean port with the renderer fixes:
all green, including lesson viewer, live DeepScanDemo inference at ~51%,
pricing, script playback, and axe accessibility audits.)

Final state: velite clean, typecheck 9/9, vitest 121 files / 944 tests,
grader 80/80, e2e 85/85, all round-3 numbers independently recomputed by a
second agent with zero discrepancies.

## Do not regress

- 256 Hz hull sample rate is now canon (style bible).
- Quantization-as-storage-format is now taught content, same load-bearing class as
  the `tf.quantize()`-does-not-exist hint.
- Pricing/compare/cert copy must not re-inflate ahead of shipped features.
