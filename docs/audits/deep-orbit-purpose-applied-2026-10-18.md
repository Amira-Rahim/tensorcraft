# Deep Orbit purpose audit: LLM integration, optimization, and capstone

Date: 2026-10-18. Scope: 15 lessons, all five sections, nested references, frontmatter/hints, 20 primary and secondary exercises, and three module descriptions. Source ownership was limited to `llm-integration`, `optimization-edge`, and `capstone`. A subsequent parent request also authorized a permanent artifact-coverage check in `packages/ui/src/mdx/exercise-corpus.test.ts`; other shared UI and documentation files remain outside this agent's edits.

## Baseline and preservation

The existing working tree was copied before this pass to `.superpowers/purpose-applied-before/` (38 files, with SHA-256 manifest). That snapshot includes the earlier tone audit; those changes remain intact. This pass changes 15 MDX files and 20 exercise YAML files. The three module descriptions were reviewed and retained.

The purpose check used five questions: What problem does the crew have? What does the learner do? What actual result can they inspect? Who uses it and for what decision? Does the next story action follow from that result, with any additional crew work stated separately?

All 20 exercise YAML changes are confined to `testCode`. Starter code, solution code, exercise instructions, fixtures, and metadata are unchanged. Existing assertions and assertion messages are preserved. Three tests bind existing expressions to local variables for display: `rag-pipeline` binds the claim array, `incident-stale-verdict` binds the entry array, and `gpu-backend` binds the selected name. Capture calls follow the existing assertions. This pass has no assertion-message-only changes and no recall-answer/distractor/index changes; those from the earlier tone pass belong to `.superpowers/tone-audit-applied.md`.

## Findings and fixes

- All 20 exercises previously discarded useful outputs after grading. Added 28 captures from actual returned values, model outputs, or observed calls. Reports and prompts show the actual returned text. No extra network calls, model fits, random draws, or predictions were added.
- Goals often named an operation without saying what the crew could do with it. Briefing and challenge copy now identifies the consumer and decision: evidence review, pruning approval, cache refresh, artifact verification, incident investigation, or handover.
- Several scenes could be read as if a small exercise proved the whole fictional system worked. Source copy now separates controlled fixtures, local checks, device measurements, and the crew's later integration work. Fixed mission timings, model scores, sizes, discoveries, and deployment canon remain unchanged.
- RAG's ending previously repeated the unchecked demonstration after the learner had already built the checker. It now preserves that failure as the earlier incident motivating the checker, including the fourteen-versus-seventeen error and one-hour audit cost.
- The report ending said its omission notice named two unsupported claims, while the assembler only returns withheld section headings. Farah now keeps the claims in review notes; the notice correctly names the missing section.
- No ML necessity was invented for ordinary software work. Prompt builders, report assemblers, cache policies, gates, manifests, and runbooks remain ordinary JavaScript engineering around models. Quantization disagreement is not called accuracy loss; drift is not called proof of failure; deployment probes are not called a deployed application.

## Five-section source coverage

Every cell below was reviewed. “Retained” means its existing connection and evidence limits were adequate, not that the section was skipped. Code examples, hints, recall, and optional references were included in source review; executed validation is reported separately below.

| Lesson | Briefing | Concept and nested references | Challenge | Takeaways | Epilogue |
|---|---|---|---|---|---|
| LLMs for Science | Farah needs a parseable reply before report review; goal clarified. | Drafting workflow, decoder reference, and number-screen limits retained. | Actual parsed fields shown; mock reply and factual-review boundary explicit. | Schema validation versus claim verification retained. | Valid format enables review; the fabricated Band-3 claim still requires Farah's correction. |
| Prompt Engineering | Goal now identifies the reusable request Demir must send. | Reference/current-reading separation, instrument-units drawer, and JSON check retained. | Actual prompt text shown, with no model request or claim of improved answers. | Four-part checklist and validation limits retained. | Both prompt versions are kept and tested; database access remains the next problem. |
| RAG for Signals | Goal names bounded evidence and supported versus unsupported claims. | Retrieval cap, field/source/unit validation, and free-text limitations retained. | Both retrieval and claim-check exercises now expose their actual results and consumers. | Omissions, exact citations, and source-data limits retained; DISPATCH case retained. | Earlier failed demonstration leads to checker integration and further review without erasing its cost. |
| Report Generation | Goal states the approved report Earth can receive. | Section generation and human approval remain separate; story decision preserved. | Actual report text exposes approved sections and withheld headings. | Section review and whole-report consistency retained. | Missing-section notice now matches assembler behavior; review notes hold the unsupported claims. |
| Multi-model Systems | Goal names one result for the watch and failure before alert writing. | Preprocessing contracts, stage validation, and fallback limits retained. | Actual model score, detector result, alert, and stopped invalid-input path shown. | Valid-shaped wrong predictions and complete-system evaluation retained. | Automated measurement alert remains separate from queued language explanation; fictional 14-second/340 MB integration remains labeled. |
| Model Profiling | Baseline is explicitly for Nazari's next-build comparison. | Parameter arithmetic, warmed completed inference, slow calls, and peak-memory limits retained. | Controlled-clock trace and real supplied-model storage are shown separately. | Storage versus time versus runtime memory retained. | Profiling procedure precedes full-build figures; peak-memory check remains open and 211 KB salvage is still not the lost capture. |
| Quantization | Lower precision is tied to changed decisions for Nazari's review. | Affine codes, constant kernel, converter reference, float32 reload, and labeled-evaluation limits retained. | Actual before/after classes and stored kernel codes shown; unlabeled disagreement is explicit. | Stored bytes, integer computation, speed, and accuracy remain distinct. | Engineering load test is explicitly separate from the small exercise; bridge sign-off stays open. |
| Pruning | Goal supplies the per-class evidence absent from Demir's sign-off. | Counterexample, rare-class weighting, Hessian drawer, low-rank drawer, and rescaling example retained. | Actual per-class curves at four sparsity levels; balanced synthetic comparison distinguished from archive scores. | Dense slots, achieved sparsity, per-class errors, and compression retained. | Demir carries the comparison into sign-off; separate mission replay/load results retain the three-hour cost. |
| Caching Strategies | Goal separates saved calls from stale answers. | Actual call being cached, lookup overhead, ownership, optional cache experiment, and policy choice retained. | Repeated-request result and refresh queue both shown with their distinct limits. | Collision, version, TTL, and ownership checks retained. | Next watch receives the checks; no-hit log still cannot establish that the source never repeats. |
| WebGPU Acceleration | Startup recovery is the learner's contribution; timing follows on the selected backend. | Backend registration/failure, completed readback timing, and stack accounting retained. | Observed fallback trace shown as controlled runtime, not device capability/speed. | Available does not mean fastest; completed inference boundary retained. | Checked fallback precedes separate target-device rehearsal; canonical timings and cache consequences retained. |
| System Architecture | Goal names the failed-handoff problem and stage responsibility. | Linear runner versus branched manifest, scheduler, memory ownership, and model compatibility retained. | Actual feature tensor from asynchronous diagnostic chain shown. | Runtime contracts and unresolved branch-scheduler requirement retained. | Checked chain is attached to architecture notes; branch scheduler stays on work list and ARIA fallback remains. |
| CI/CD Pipeline | Goal supplies gate and inventory as parts of a release record, with identity still required. | Complete-artifact fingerprints, exact loaded bytes, required CI, device gates, hosted checks, and rollback retained. | Labeled gate cases, held candidate, reload comparison, and inventory shown. | Identity, quality, publication, and rollback remain separate. | Crew explicitly connects gate/inventory to fingerprint check before correct release goes green. |
| Monitoring | Goal identifies what the watch should investigate. | Score/accuracy distinction, mean-shift limitations, distribution checks, scenario thresholds, and drift choice retained. | Actual drift calculation and percentile results shown; supplied durations labeled. | No-data versus zero, delayed labels, and bounded windows retained; DISPATCH calibration case retained. | Checked calculations are connected to mission thresholds; alerts trigger review, not an accuracy claim. |
| Documentation | Next operator and their decision needs now lead the goal. | Full model card, evaluation gaps, 64-channel/64-sample distinction, API, and runbook retained. | Actual returned card shown with metadata-versus-verification distinction. | Evidence with scores and named operational ownership retained. | Generated card precedes separate runbook review; threshold repair and story consequences remain. |
| Launch | Goal names verification record, candidate evidence, and decision-rule output. | Static/server boundary, artifact inventory, hosting, canary, fictional bridge log, ratio template, and independent project retained. | All three exercises show local check verdicts, actual fit/canary outputs, and final detector/ratio record. | Deployment identity, failure, rollback, and generalization limits retained. | Decision record accompanies classification; fixed 0157 canary, unresolved origin, and final operator-note row preserved. |

## Capture mapping, consumers, and limits

These are captured from tests that already execute the learner's code. Supplied inputs and metadata are labeled as such. Each capture follows that test's existing assertions; an assertion failure before capture leaves that case without an artifact.

| Exercise | Actual captured result | Consumer and enabled decision | Bound and evidence limit |
|---|---|---|---|
| `llm-client` | Returned classification, score, reasoning | Reporting stage accepts structurally usable fields; Farah reviews claims | 3 rows; supplied mock reply, not a network call or verified reasoning |
| `prompt-template` | Returned prompt string | Demir/Farah inspect reference/current-reading context before sending | 6,000 chars; request construction only |
| `retrieve-signals` | Returned rows, matched count, omitted count | Report writer knows which evidence reached the model | 20 rows; supplied archive fixture, not full mission archive |
| `rag-pipeline` | Actual accepted/held membership for source-specific claims | Renderer uses accepted structured fields; reviewer handles unsupported claims | 4 rows, 6 columns; source agreement does not establish source truth |
| `generate-report` | Returned assembled report with withheld headings | Earth can distinguish missing review from absent findings | 6,000 chars; supplied approval flags, no automatic factual approval |
| `model-pipeline` | Returned classification, score, detector flag, alert, plus observed failed-input stop | Watch receives a usable result and failure stays out of alert stage | 5 rows; real supplied TFJS classifier, controlled detector/writer callbacks |
| `profile-model` | Observed warmup/measured durations and returned mean; model layer parameter counts and weight size | Nazari chooses which storage cost to investigate and verifies timing arithmetic | 2 artifacts, 6/4 rows; controlled timings, actual model counts, no app peak memory |
| `quantize-weights` | Existing model outputs before/after learner's mutation; returned codes and scale | Nazari sees changed decisions and quantization representation | 2 artifacts, 40/12 rows; synthetic unlabeled captures, simulated uint8 storage, no packed file |
| `prune-weights` | Returned per-class recall at requested sparsities | Demir sees class-specific harm before selecting a pruning level | 4 points x 5 series; 40 synthetic examples/class, not fictional archive accuracy |
| `inference-cache` | Actual miss/hit values and model-call count | Demir verifies reuse before evaluating lookup cost | 2 rows; repeated input only, not a latency or collision guarantee |
| `incident-stale-verdict` | Actual serve/refresh assignment with source version and age | Watch can refresh rejected entries | 4 rows; supplied clock/version/TTL, not rounded-key validation |
| `gpu-backend` | Observed calls and actual selected backend | Dashboard startup can recover through failure ladder | 4 rows; controlled runtime responses, no device benchmark |
| `pipeline-architecture` | Values from returned feature tensor before disposal | Demir verifies asynchronous stage handoffs | 5 rows; 8-sample composition diagnostic, not complete production graph/scaler |
| `ci-cd-gate` | Actual score/counts over supplied predictions; held-candidate verdict | Nazari can explain why the candidate passes or is held | 2 artifacts, 5/4 rows; labeled fixture, not broad model fitness |
| `export-model-artifact` | Original/reloaded scores and returned tensor/parameter/byte inventory | Release reviewer checks serialization agreement and file accounting | 2 artifacts, 3/3 rows; local saved bytes, no hosted identity/deployment claim |
| `model-monitor` | Returned mean distance and P50/P95/P99 | Watch can investigate input shift or slow calls | 2 artifacts, 1/3 rows; supplied features/durations, not actual browser timings or accuracy |
| `write-model-card` | Returned Markdown card | Next operator sees evaluation context, lowest recall, and input requirements | 6,000 chars; fictional supplied metadata, formatting is not verification |
| `verify-deployment` | Actual returned ordered check records for pass and fail cases | Release caller can hold the candidate and inspect failed probe | 2 artifacts, 3/2 rows; local real TFJS scorer, no hosted action |
| `launch-rehearsal` | Actual returned fit losses/update count and canary scores/gate | Nazari can inspect the local candidate's release decision | 2 artifacts, max64 points/40 rows (fixture has16 canary rows); synthetic local rehearsal |
| `classify-anomaly` | Actual vote count, flags, classification, score difference, and ratios | Farah checks template match; Mirza has a reviewable decision record | 2 artifacts, 5/6 rows; fictional detector values, no origin or calibrated-probability claim |

All captures stay below the shared collector limits: 4 artifacts per exercise, 40 table rows, 12 columns, 64 points, 8 series, 6,000 text characters. The largest artifact here is the 40-row quantization comparison. The largest series has the rehearsal loss history capped at 64 points. Copies are plain values; no tensor handles cross the capture boundary. Existing disposal and restoration paths remain.

## Executed verification

- `pnpm --filter @tensorcraft/content build:content`: passed. Log: `.superpowers/purpose-applied-build.log`.
- All 20 owned exercises passed `node scripts/validate-exercises.mjs <slug> --starters --cheats`: **233 solution tests**, **29 known-cheat attempts rejected**, all untouched starters rejected, and no starter received partial test credit. No failures or allowlisted warnings.
- CLI/browser assertion parity: the validator reported the same 35 assertion fixtures for both harnesses on every invocation.
- The shared collector validates captured shapes, finite numbers, strings, row widths, and bounds during these runs; no capture validation errors occurred.
- Compiled source inventory confirms 20 exercises and 28 `recordResult` calls. Output data comes from existing test execution, not a reference solution injected for display.
- YAML comparison against the snapshot confirms only `testCode` changed in all 20 exercise files. `git diff --check` for the three modules passed.
- Individual logs: `.superpowers/purpose-<exercise-slug>.log`. Counts: `.superpowers/purpose-applied-validation-counts.json`. Most run statuses: `.superpowers/purpose-applied-validation.json` (the separately run `llm-client` is in its own log).

## Remaining boundaries and handoff

No unresolved source/grader failure was found in this scope. This is source review plus executed exercise checks, not a claim that every MDX reference example, downloadable lab, hosted endpoint, or device backend was re-executed during this pass.

The source still uses existing synthetic diagnostics and controlled service/runtime fixtures where the course does not ship the fictional five-class artifact or 85 MB language component. Those sources and limitations are explicit. They should not be silently renamed as actual mission recordings, nor should an exercise pass be used to certify the story's whole-system measurements.

Browser rendering, keyboard/reduced-motion behavior, stale-output handling after edits, and shared visual integration belong to the parent's UI validation. The last source-only change corrected Farah's omission-notice line after the successful build; include it in the parent's final content build. Exercise YAML did not change after validation.


## Whole-course shipped-worker verification

The parent subsequently requested a permanent runtime artifact gate. Updated `packages/ui/src/mdx/exercise-corpus.test.ts` inside its existing `EXERCISE_CORPUS=1` opt-in suite. It identifies Deep Orbit exercises through compiled lesson metadata, runs each authored solution through the shipped worker source and real TFJS Node adapter, checks the existing grader results, requires at least one output, validates the transported artifact schema, rejects empty text/title output, and retains the existing starter rejection check. This does not replace the authored numerical assertions.

Executed:

```sh
EXERCISE_CORPUS=1 pnpm vitest run packages/ui/src/mdx/exercise-corpus.test.ts --disableConsoleIntercept --silent=false
```

Result: **65/65 exercises passed**, **575 authored solution checks**, all 65 starters rejected, and **86 captured artifacts**: 70 tables, 12 series, and 4 text documents. Every exercise produced at least one valid artifact; no nonfinite numeric value, malformed table, unmatched series axis, or size-limit failure reached the host. Run duration: **16.11 seconds**. The initial run also passed, but the default reporter hid the count log; the second run exposed the evidence without changing grader behavior.

Evidence: `.superpowers/purpose-worker-corpus.log` and `.superpowers/purpose-worker-corpus.json`, including actual counts and kinds for each of the 65 exercises. No registered cheats were rerun for this whole-course check. Scoped ESLint on the permanent corpus test passed. This exercises CPU TFJS and the shipped worker/host transport, not Chromium rendering or a WebGL fallback.

After the collector owner finished sparse-array rejection and extreme-value rendering fixes, the full worker corpus was rerun against the stable collector. Final result is unchanged: **65/65 exercises, 575 solution checks, 86 valid artifacts**, all starters rejected, **25.25 seconds**. Final evidence: `.superpowers/purpose-worker-corpus-final.log` and `.superpowers/purpose-worker-corpus-final.json`. Runtime artifact counts also match authored capture calls for every exercise (86 of 86). This rerun supersedes the earlier runtime evidence.

## Shared entry consistency review

At the parent's request, reviewed all 15 owned lessons' `LESSON_HANDOFFS` and `DEEP_ORBIT_VISUALS` entries. Four targeted inconsistencies were found and corrected. The parent fixed RAG's handoff to describe an omitted-match count rather than a list of missing records. The remaining three became the shared-flow follow-up below. The other 12 entries' conceptual scope and evidence limits match the lesson sources.


## Shared-flow follow-up

The parent assigned the prompt/report/multi-model corrections in `deep-orbit-visuals.ts`, `flow-investigations.ts`, and their relevant tests. Before editing, saved the three existing files in `.superpowers/purpose-shared-before/`.

- **Prompt Engineering:** the reference diagram now requests `classification`, `confidence`, and `reasoning`, matching the authored prompt exercise and existing interactive prompt builder.
- **Report Generation:** the overview no longer gates assembly on every section being approved. The activity now filters supplied review decisions, displays the actual approved section text in order, and displays a Withheld block naming rejected headings. It also handles a report with zero approved sections. Neither an approval flag nor the assembler is presented as automatic factual verification; Farah's final consistency review remains.
- **Multi-model Systems:** both overview and activity now follow the exercise's classifier -> detector -> alert-writer chain. The two inputs are the exercise's existing example readings. Controlled callbacks make the call trace inspectable and keep each stage's original raw input visible. The learner can cause an invalid classifier score, an unsupported label mapped to unknown, a non-boolean detector reply, a skipped writer, or rejected blank alert text. No model is run in this concept activity, and the supplied scores are explicitly not calibrated probabilities.
- **Document presentation:** with the parent's approval, added an opt-in prose layout for cell graphics. The report's actual Markdown blocks each occupy one full-width, left-aligned cell, with preserved line breaks and a separately labeled omission block. Ordinary numeric cells and stage pipelines keep their existing presentation. Supporting changes are limited to the graphic type/renderer/CSS plus a targeted render test.

The contract tests compare **48 controlled multi-model states** with the actual authored `pipeline` solution, including raw-array identity, callback order, returned fields, and stopped runs. Four report scenarios execute the displayed assembler and compare exact text with the actual `assembleReport` solution. The render tests change review controls and confirm that approved text and withheld headings appear separately, rejected text stays out of the report, and all-withheld output remains readable.

Final shared-flow verification:

- Scoped Prettier completed for all seven changed flow/render files before validation.
- `pnpm vitest run` on flow contracts, lesson investigation invariants, report rendering, and existing interactive lesson rendering: **105 tests passed in 4 files**, 1.89 seconds. This includes the 48-state comparison within its contract test. Log: `.superpowers/purpose-shared-flow-tests.log`.
- Web TypeScript check (`pnpm --filter @tensorcraft/web exec tsc --noEmit`): passed. Log: `.superpowers/purpose-shared-typecheck.log`.
- Scoped ESLint on the six TypeScript/TSX files: passed. Log: `.superpowers/purpose-shared-eslint.log`.
- Scoped `git diff --check`: passed; no U+2014 in the touched flow copy/tests or this report.
- No exercise, authored solution, grader, fixture, or worker transport changed during this shared-flow follow-up. The previously completed 65-exercise worker proof remains applicable. Browser layout and interaction checks remain with the parent; the render tests verify DOM structure/content, not screenshots.
