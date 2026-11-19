# Web, UI and world audit, November 6, 2026

Scope: every tracked and untracked non-ignored file under apps/web, packages/ui and packages/worlds. Initial inventory contains 771 files: 645 UTF-8 text files and 126 binary files. Exact paths, byte counts, SHA-256 hashes, review methods and integrity observations are in `file-coverage.csv`.

Every file's complete bytes were read. TypeScript source/tests were parsed and checked through the web and UI TypeScript programs, supplemented with repository-wide import, symbol, MDX and CSS references. Every JSON file parsed. Every JavaScript/MJS file passed `node --check`. Every raster asset decoded for dimensions through sips. Every video container/stream was inspected with ffprobe. Every ZIP entry passed CRC verification and was compared with its packager source. All model manifests were parsed, all shards existed, and declared weight byte counts matched the shipped files. This is a source, reference and artifact audit, not a visual review of every raster or a browser walkthrough of every route.

## Confirmed findings

### W01. Public machine-readable product descriptions still advertise the old five-world launch (P1)

- `apps/web/public/llms.txt:11-18` claims five worlds, 275 lessons, 295 exercises, a free module in every world, Next.js 15, and unqualified WCAG 2.1 AA compliance. Lines 38-39 repeat the old 55-lesson offer.
- `apps/web/public/.well-known/ai-plugin.json:6` repeats the five-world/275-lesson offer.
- The current source of truth is Deep Orbit only, 56 lessons, 65 exercises, five free lessons, Next.js 16. The other worlds are draft content with coming-soon routes. Actual screen-reader verification remains owner-deferred in the learning-product release ledger.
- These files are in public, so they continue distributing stale facts even though the visible pricing surfaces were corrected.
- Recommended disposition: rewrite both from launched-world/course inventory, distinguish authored worlds from purchasable courses, and gate key public counts against generated content. Remove the unsupported compliance assertion or qualify its evidence.
- Confidence: confirmed.

### W02. The AI-plugin manifest declares a non-OpenAPI health endpoint as its API specification (P2)

- `apps/web/public/.well-known/ai-plugin.json:8` declares `{type: openapi, url: https://tensorcraft.app/api/health}`.
- The web App Router provides `/api/og`, not `/api/health`, and next.config.ts has no API rewrite. The separate API mounts `/api/health` at `apps/api/src/index.ts:96`; its route is ordinary health JSON, not an OpenAPI document.
- Recommended disposition: retire this manifest if no supported integration consumes it. If keeping it, publish an actual supported API specification at the right host. A health route is not a specification.
- Confidence: confirmed against repository routing. No live network fetch was made.

### W03. The downloadable runtime lab is behind its source package and converter pins (P1)

- `apps/web/public/assignments/browser-runtime-lab-v1.zip` differs from its explicit source map in `scripts/package-runtime-lab.py:6-22` in three entries.
- Archived package.json and package-lock.json still install Transformers 3.8.1 and Vite 7.3.6. `scripts/fixtures/runtime-lab-package/package.json:15-24` and its lock now install Transformers 4.3.0 and Vite 7.3.7.
- Archived converter-requirements.txt still pins Keras 3.10.0, requests 2.32.5 and older supporting packages. Current `scripts/runtime-lab/converter-requirements.txt` pins Keras 3.15.0, requests 2.33.0 and updated packages.
- This means repository-source runtime validation does not establish the behavior learners download.
- Recommended disposition: regenerate the archive from the current explicit file list, validate a clean extraction of that exact archive, and add a source/archive parity check. Do not assume current main-repo dependencies validate the archive.
- Both build-triage-v1.zip and room-occupancy-v1.zip match all source entries byte-for-byte. All three archives pass CRC checks.
- Confidence: confirmed by per-entry byte comparison.

### W04. The replaced hand-rolled TensorFlow mock remains as 463 dead lines in the runner (P2)

- `packages/ui/src/mdx/exercise-runner.ts`, declaration `const TF_MOCK` (line 670 at latest read; initially 665), is an unreferenced 463-line template containing fake tensors, layers and training.
- `buildFullCode` explicitly injects the real `tf` parameter and never interpolates TF_MOCK. WORKER_BODY loads actual pinned TensorFlow.js. The comment immediately before WORKER_BODY says this runtime replaced the old mock.
- Repository search finds only the TF_MOCK declaration. `tsc --noUnusedLocals --noUnusedParameters --incremental false` flags it as unused in both web and UI programs.
- Recommended disposition: delete the unused constant. Retain the active controlled loader/runtime shims, which current authored exercise contracts intentionally use.
- Confidence: confirmed safe source removal candidate, independent of current result-capture WIP.

### W05. A retired dashboard world-grid and its tests have no runtime consumers (P2)

- `apps/web/app/dashboard/world-cards.tsx:39` exports WorldCards, but its only import is `apps/web/app/dashboard/__tests__/world-cards.test.tsx:3`.
- `apps/web/app/dashboard/notify-me-button.tsx` is consumed only by that retired WorldCards component.
- The active dashboard page renders DashboardView, and DashboardView uses MissionJourney. The old WorldCards component still carries the removed bundle summary, coming-soon grid and legacy owned/locked card behavior.
- The three-file island contains 645 lines: 411 component lines, 33 button lines, 201 test lines. The tests still use 55-lesson fixtures and full-bundle ownership.
- Recommended disposition: remove this isolated island together, update its stale references in globals.css comments and old implementation docs, and keep active worlds/world-cards-grid.tsx, NewsletterModal and dashboard MissionJourney coverage.
- Confidence: confirmed runtime dead code and outdated tests.

### W06. Old visual and journey CSS still ships without corresponding markup (P2)

- `apps/web/app/components/lesson-visuals/lesson-visuals.css:82-175` retains iv-reading-chart, iv-worked-example, iv-example-step, iv-example-code, iv-creation-line and iv-creation-shape rules. None of these names occur in application or lesson markup. Additional `.iv-example-code` overrides remain in `deep-orbit-lessons.css:307`.
- `lesson-visuals.css:1514-1729` retains an earlier tensor investigation's location/workspace/packet/response/findings/result/interpretation/reference/consequence layout. The current TensorInvestigation source uses opening/request/purpose/console and the shared ExerciseOutput component instead. These obsolete names have zero source/MDX occurrences outside CSS.
- `apps/web/app/components/lesson-visuals/lesson-investigation.css:404-490` retains tensor-investigation-practice, practice-control, practice-heading, practice-note, comparison and comparison-runs blocks with no markup consumer.
- `apps/web/app/globals.css:1302-1315` still ships ticker-scroll/ticker-track. Lines 1356-1379 still ship tc-journey-conn and tc-journey-row-scene from the removed journey ring. None of those class names occur in current source. `animate-slide-up` is also unused, but keep the slide-up keyframes because lesson-drawer-panel still uses them directly.
- Recommended disposition: remove verified unused selector blocks, preserving shared selectors that still occur and dynamic iv-case/iv-code token classnames. This is a concrete cleanup list, not a blanket delete of lesson CSS.
- Confidence: confirmed for the named selectors through complete repository source/MDX/classname scans. Browser coverage remains necessary after a CSS cleanup.

### W07. Two progress lookup APIs have zero consumers (P3)

- `apps/web/lib/progress-client.ts:231-247`, getLessonStatus, is exported but never referenced anywhere else in source or tests.
- `apps/web/lib/progress.ts:39-54`, isLessonCompleted, is likewise unreferenced. Current route logic uses getUserProgress, getPassedExercises and isModuleCompleted.
- Recommended disposition: remove these two unused functions. Keep hasWorldPurchase: it is a wrapper with real current consumers, despite its deprecation-style comment.
- `lookupFreePrompt` at free-recall-prompts.ts:117 is a weaker cleanup candidate: tests consume it, but runtime code consumes FREE_RECALL_PROMPTS directly. Either make it the runtime lookup or remove its test-only API. Do not delete the free prompt table or its paid-content boundary tests.
- Confidence: confirmed unused runtime APIs, test-only case explicitly separated.

### W08. Capstone model documentation contradicts actual shipped model contracts (P2)

- `docs/capstone-models.md:70-73` says detector/classifier accept 224x224 RGB, detector emits boxes and the classifier is a MobileNet head. Actual detector/model.json and classifier/model.json are copies of the same small 24x24 CNN ending in Dense(4). Their declared byte manifests match the shipped weights.
- Lines 78-83 claim a BiLSTM, vocabulary near 5000, sequence length 256 and about 8M parameters for diagnostic-one-v1. Actual JSON declares vocabulary 100, sequence length 32, Embedding(16), GlobalAveragePooling1D, Dense(16), Dense(3).
- Lines 107-112 claim Terra's Dense(64)/Dense(16)/Dense(64) and public grid training data, while the shipped model is Dense(16)/Dense(8)/Dense(16)/Dense(24), and the same document identifies synthetic training at the top.
- The Nova summary table at line 16 still calls it a dense bottleneck, while the actual artifact and its detailed section describe the convolutional VAE with a custom ReparamLayer.
- The document's assurance that copied lesson blocks become runnable against these URLs is unsupported for the mismatched future-world shapes and custom layer registration. These draft-world artifacts can remain as intentional authoring assets, but they must be labeled with actual current contracts and separate target architectures.
- Recommended disposition: generate a compact artifact-contract table from topology/manifest data, distinguish shipped demonstration models from future intended models, and remove the stale readiness assurance. Coordinate with future-world content review.
- Confidence: confirmed by topology inspection, shard validation and duplicate hashes.

### W09. Several smaller unused declarations remain in otherwise active files (P3)

An opt-in compiler audit, not the normal project typecheck, reported:

- lesson-visuals.test.tsx:26 FIRST_PACKET import.
- components/mdx/concept.tsx:106 color local.
- lesson-content.tsx:198 mdxComponents object, a 28-line registry duplicated by the actual memoized component map.
- lesson-steps.tsx:304 prevLesson destructuring, and :1043 highlightTitle function.
- capstone/__tests__/page.test.tsx:198 single parameter.
- capstone/capstone-client.tsx:10 and :140 bg parameters.
- lib/character-art.test.ts:6 aria fixture.

Normal typechecks pass because noUnusedLocals/noUnusedParameters are not enabled. These findings do not justify imposing those flags repo-wide without reviewing all packages. Remove the obsolete values during focused cleanup. Line numbers can shift under concurrent result-inspection work.

### W10. Browser-backend test-double drift was repaired during the audit (resolved observation)

- At root's initial test snapshot, all five browser worker backend-pin tests fail because fakeTf at exercise-runner.test.ts:81 supplies only the backend API.
- New evaluation-capture-source.mjs dereferences tf.LayersModel.prototype.evaluate/predict at construction, and applyShims constructs that capture unconditionally before running the tests. The fake runtime has no LayersModel.
- The test comment claims applyShims guards all other members, which is now false. Update the fake's contract or initialize the capture only when supported. Keep the actual backend pin assertions.
- The independent result-capture recompilation regression is being edited concurrently. Do not describe it as an established obsolete test or remove it. Root is rerunning the focused tests against the final snapshot.
- Root's final focused rerun passed all 45 tests across exercise-runner, evaluation-capture and evaluation-result. The six failures in the initial broad snapshot were repaired by concurrent external work and are not outstanding audit findings.
- This is user-owned uncommitted work. No files were changed by this audit.

## Intentional retained material and false positives

- The four coming-soon world manifests, source content and their model assets are planned product work, not automatically dead code.
- Quiz and KeyTakeaways have no launched Deep Orbit use, but 51/219 future lessons still use them. DispatchTease and StrategyThread also have future authored consumers. Retain or migrate them with those worlds, not in a blind export purge.
- Character expression files, patches and scene stills are dynamically resolved from manifests and lesson slugs. A literal filename search alone would falsely mark most of them unused.
- ARIA raster portraits are used, despite an old world-types comment claiming isAI expressions are procedural.
- deep-scan, deep-scan-v1 and deep-scan-preview are intentionally distinct models. deep-scan-v1 supports the learner's capstone source contract even though no active app component loads it.
- Legacy lesson-phase storage conversion and historical story decisions preserve real compatibility contracts. Their age does not establish safe removal.
- The first-lesson twelve-value recap mismatch and guest signed-in endpoint calls remain real, already recorded backlog items. By contrast, shared prose defaults have already moved into `@layer components`, so the roadmap's directive to move them is partly stale.

## Checks and limitations

- Web and UI compiler programs checked with `--noUnusedLocals --noUnusedParameters --incremental false`. They exit 2 because of the unused declarations listed above, not type failures.
- Root ran the broad unit suite, normal typechecks and other project-level checks. This sub-audit does not duplicate their result counts.
- All three archives pass CRC checks. Two are source-exact; runtime lab has three stale entries.
- All 15 model topologies/manifests parse, have existing shards, and match exact declared weight lengths. This does not establish scientific accuracy or learner outcomes.
- All 105 raster files decode for metadata. All three videos parse; world trailer duration is exactly 88s and matches world-trailer.ts. Learn trailer is 72s, loop 24s. No visual correctness claim follows from container integrity.
- Every file is present in coverage. Semantic inspection was targeted by reference graphs, product contracts and compiler results; the ledger does not claim line-by-line human review or a browser check for every file.
