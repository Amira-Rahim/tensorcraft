# Result lifecycle, recovery, and compatibility

Date: November 6, 2026. Source baseline: `8550adf771db`.

This second pass examines steps 2 and 3 of the result-inspection proposal.
It follows the actual exercise, capture, draft, IndexedDB, and project-page
paths. Product code and lesson content remain unchanged. Findings described
as race risks come from source analysis unless a test result appears below.

## Recommended boundary

Keep one exercise instance, one current-result position, and the existing
browser-local store. Add explicit run lifecycle events and a scope-checked
restore registration. Reuse the same decoded report for live inspection and
saved inspection. Save preparation must not delay a useful current report.

Keep one previous inspectable report while a new attempt runs or fails before
useful capture. Collapse it and label it `Previous run`. It remains separate
from the latest attempt's verdict. A new valid report replaces it, including
a valid partial report with failed diagnosis checks. Reset and identity changes
clear transient reports. This is a bounded recovery measure, with no automatic
save or additional history slots.

Keep schema 1 for the three pilot milestones only after freezing the known
readers and establishing a compatible deployment floor. The schema number
alone does not make a new milestone compatible with an old application.

## What the current implementation establishes

| Source | Observed behavior | Consequence |
| --- | --- | --- |
| `packages/ui/src/mdx/exercise.tsx:732` | Run start captures submitted code and assistance, assigns a sequence, and clears ordinary output. Completion checks the active sequence and draft key. | Preserve submitted-source semantics and existing completion callbacks. |
| `exercise.tsx:897` and `:961` | Reset and successful restore invalidate a pending worker result. Restoration preserves the current draft before replacing editor text. | Keep these recovery rules when moving history below the result. |
| `apps/web/app/components/learning-evidence-exercise.tsx:75` | The wrapper hears completed snapshots only. Its preparation sequence changes when another snapshot completes or the wrapper unmounts. | Run start and reset cannot invalidate an already pending hash/preparation operation. |
| `learning-evidence-exercise.tsx:82` | Capture uses a random guest fallback while the store's owner state is null. | Owner resolution should be synchronous and independent of history loading. |
| `apps/web/lib/learning-evidence-store.ts:31` | Owner resolution already returns `guest:browser` or `account:<id>` without accessing browser storage. | A blocked database does not require a substitute identity. |
| `apps/web/app/components/learning-evidence.tsx:104` | Save and the following list refresh share one catch block. Delete does the same. | A committed write followed by a failed refresh currently looks like a failed write. |
| `learning-evidence.tsx:59` | A shared `busy` boolean represents saving and deleting. | Run B can display `Saving…` while run A is saving, or while a record is being deleted. |
| `apps/web/lib/learning-evidence-store.ts:110` | Every read validates the complete owner envelope, including other milestones. | An unknown milestone can prevent all that owner's history from opening. |
| `learning-evidence-store.ts:271` | The first save stays, and each later distinct save replaces the latest slot. | Slot order follows successful writes, independent of run time and model quality. |
| `learning-evidence-store.ts:303` | Deleting first promotes latest to first. | The first slot means earliest retained save. The original first save may already have been deleted. |
| `apps/web/lib/learning-evidence-types.ts:260` | Validation compares stored context with today's registry. | Metadata edits can invalidate historical records unless old descriptors remain available. |
| `apps/web/app/dashboard/project/page.tsx:28` | Paid source lookup follows entitlement. The client receives a starter and current hash, with no grader or authored solution. | Evaluation must follow the same access boundary. |

The fallback-owner issue is a reachable state in the component contract, but
this investigation did not reproduce a human click before initial owner
resolution in a browser. Removing the fallback still follows directly from
the synchronous owner API and eliminates an unnecessary identity mismatch.

## The state model

Execution, report interpretation, storage, and editor state should have
separate fields. One enum for every combination would make valid states
harder to represent.

| State dimension | Required values or information |
| --- | --- |
| Scope | Authenticated owner or browser guest, exercise identity, instance token. |
| Latest attempt | Idle, running, or settled, with its transient run token. |
| Captured attempt | Immutable submitted source, actual artifacts, checks, assistance, runtime observations, and completion time. |
| Inspectable report | One report whose adapter established useful captured values. It retains the token of its originating attempt. |
| Relation to latest attempt | Current when tokens match, otherwise previous. |
| Relation to editor | Matching source or changed source. Compare exact strings synchronously. |
| Save preparation | Absent, preparing, ready, or failed, keyed by the report's token. |
| History read | Loading, ready, or failed, with the failure category and any previously validated records marked as stale. |
| Mutation | Idle, saving a specific run ID, or deleting a specific run ID. |
| Current-content comparison | Checking, same source version, changed source version, or unavailable. |

The definition of useful capture belongs to each adapter. Normalization needs
coherent values for its explanation. A network report can inspect captured
training information without claiming held-out performance. Evaluation can
inspect valid score cases even when the learner's diagnosis fails. A passed
grader alone does not establish report validity.

The report has at most one retained predecessor during a transition. It does
not become an accumulating in-memory timeline. When the latest settled
attempt has no useful report, its failure remains current and the retained
report stays visibly previous.

### Transition rules

| Event | Current attempt and report | Saving and history |
| --- | --- | --- |
| Open exercise | No attempt. Name the output the task will produce. | Resolve owner immediately, then load its history. |
| Start run A | Allocate A's token before execution. Capture source and assistance. | Existing saved records remain available. |
| A produces useful values | Publish A's report and its captured verdict together. Start bounded save preparation independently. | Saving becomes available when A's immutable snapshot is ready. |
| Edit after A or during A | Keep A tied to its submitted source. Mark changed code. | Saving A still saves A's original source. |
| Start B after inspecting A | B becomes the current attempt. A moves to a collapsed `Previous run` disclosure. | A remains downloadable or savable if it is still retained. |
| B produces a valid partial report | Replace A with B. Show B's missing coverage and failed checks explicitly. | Prepare B once. Previously saved A remains in history. |
| B fails before useful capture | Show B's failure. Keep A collapsed as previous. | A's explicit save remains possible. No automatic save occurs. |
| Reset | Invalidate the active attempt and unpublished preparation. Clear transient reports and selections. | Keep persisted records. Preserve existing draft-recovery behavior. |
| Successful restore of different code | Invalidate the active attempt. Keep a retained report labeled as a prior run when its code differs. | Preserve the replaced draft first. Restoration does not run code or earn credit. |
| Restore refused | Leave the editor, attempt, and recovery copy unchanged. | Explain the concrete refusal through the editor's existing notice. |
| Owner, exercise, or instance changes | Hide old data immediately and invalidate old callbacks. | A previously requested write may finish for its original owner. It cannot update the new owner's visible state. |

A late preparation result may fill the Save action for an already retained,
explicitly identified previous report. It cannot introduce an old report that
the learner never saw, replace the latest report, or recreate a report after
reset. Check the retained token and scope before publishing it.

The simpler alternative clears every transient report at run start. That
matches the first proposal but loses an unsaved useful result when a rerun
fails. Keeping one predecessor provides recovery with a fixed memory bound.
It does not require comparison charts, a new navigation mode, or new storage.

## A small UI package contract

The existing `onRunSnapshot` callback is insufficient by itself because it
cannot report run start or invalidation. Add one optional lifecycle callback
and keep the existing callback working exactly once per accepted completion.
The web wrapper should consume the lifecycle callback for preparation rather
than preparing twice through both callbacks.

The following illustrates the boundary. Exact names can follow repository
conventions during implementation.

```ts
type ExerciseRunEvent =
  | { type: "started"; runToken: string }
  | {
      type: "captured";
      runToken: string;
      snapshot: ExerciseRunSnapshot;
    }
  | {
      type: "invalidated";
      reason: "reset" | "restore" | "scope-change";
    };

type ResultRenderContext = {
  attempt:
    | { status: "idle" }
    | { status: "running"; runToken: string }
    | {
        status: "settled";
        runToken: string;
        snapshot: ExerciseRunSnapshot;
      };
  currentCode: string;
};
```

Use an instance identifier plus a monotonically increasing run sequence for
the token. A sequence alone repeats after remount. A draft key alone repeats
when an old instance unmounts and another instance opens the same exercise.
Keep the active scope in the registration and reject stale completions.

The outer `Exercise` owns the latest immutable raw attempt used by ordinary
output and the render slot. The host owns the supported definition, adapter,
retained useful report, and storage preparation. The result slot must receive
idle/running/settled changes as well as snapshots so that prior presentation
cannot remain implicitly current.

Clone mutable arrays before asynchronous work. Avoid adapting, hashing, or
allocating a new persisted run ID during render. Prepare each captured token
once and retain that snapshot for repeated Save attempts. The current creator
allocates a new UUID on every call, so calling it separately from live and
saved components would manufacture duplicate identities for one execution.

Keep ordinary output as an explicit fallback when the host has no definition
or cannot produce a semantic report. Distinguish an absent host renderer from
an adapter that rejects a specific capture. The latter needs an explanation
beside the safe raw output. Rendering failure must not change check results,
completion, assistance, or the worker outcome.

The shared UI package does not need the web registry, IndexedDB, world lore,
or entitlement logic. Its existing snapshot type can remain in UI for this
slice. Move types to shared only when a concrete additional dependency needs
them, and keep the dependency direction valid.

### Runtime cancellation and status

The current UI invalidates reset/restore results but does not cancel the
worker. `parseAndRunTests` owns worker termination and exposes a Promise with
no external abort signal. Its timeout and completion paths eventually
terminate the worker. A learner can reset and start another run while the old
worker still consumes resources.

The initial viewer release keeps result invalidation and makes no promise that
Reset cancels an executing worker. If a later release adds cancellation, add an
optional abort signal through the runner and exercise in one reviewed change. Terminate once,
clear timers, and distinguish cancellation from learner error. Test abort
before spawn resolves, after runtime loading, during fit, and after completion.
Do not turn cancelled work into a failed attempt or an earned result.

Similarly, the current first-run label uses a warm-runtime boolean. It does
not expose the runner's actual runtime/execution phases. A phase-specific
indicator requires a runner event and should not be inferred from elapsed
time or that boolean.

## The restore bridge

Move the existing saved-runs footer below current inspection while keeping
one Sandpack provider. A small inner component registers the editor's restore
closure with the outer exercise. No second editor or lesson activity should
mount to obtain the action.

Each registration needs a unique registration ID and the active scope token.
The outer command dispatches only if both still match. Cleanup clears its own
registration only, so an older cleanup cannot remove a newer registration.
Keep the closure current when editor text, stash state, starter, assistance,
or storage availability changes. An unavailable bridge disables Restore.

Preserve the existing restoration order:

1. If the saved code already equals the editor, retain solution exposure and
   report that no text change was needed.
2. If a recovery copy already exists, refuse another replacement and direct
   the learner to `Restore My Code`.
3. Build the draft containing the requested saved code and the current code
   as its recovery copy. Preserve the accumulated solution-viewed flag.
4. Write that draft successfully before changing Sandpack or invalidating an
   active run. A storage failure leaves the current editor untouched.
5. Update the editor, clear current check/log decorations as today, and make
   the retained report's source relationship explicit. Do not rerun code.

The UI should distinguish `restored`, `unchanged`, and `refused` if the bridge
is given a richer return type. The existing boolean remains sufficient for
safety, but it cannot distinguish those outcomes without rereading code.
The footer can move safely with the existing boolean contract.

The draft limit is 400,000 JavaScript string characters. Saved source has a
256 KiB UTF-8 byte limit. A restore draft contains saved source, current
source, and starter source together. Therefore a valid saved record can still
exceed the draft-recovery limit. Preserve the refusal and code/download
recovery. Do not promise that every valid saved run can always be restored.

## Saving, deletion, and history refresh

The store already has the right core mutation pattern. It reads and verifies
the owner outside a write transaction, then compares that verified state with
the transaction's current state before mutating. It retries up to eight times
when another tab changed the record. Keep asynchronous hashing outside the
active transaction. IndexedDB transactions alternate between active and
inactive tasks and can commit when requests are exhausted.
[MDN's transaction documentation](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)
describes that behavior.

Separate the transaction's outcome from the following history refresh. After
the write Promise resolves, the save has committed even if listing records
subsequently fails. Say the run was saved and history could not refresh.
Apply the same distinction to deletion. A return value containing the
committed selected records is one possible optimization, but it is not
required to make these messages truthful.

Track mutation kind, run ID, and owner scope. Disable conflicting mutations
within the same panel, while keeping inspection and download usable. If save
A finishes while B is current, update A's history entry. Never set B's action
to `Run saved` because some save operation succeeded. Delete must display its
own pending state rather than changing the current Save label to `Saving…`.

Do not represent a read failure as an empty history. Empty means a successful
read returned zero records. Previously validated in-memory records may remain
visible after a refresh failure, with a clear stale-history notice. An initial
failure should offer Retry and the current run's download where available.

Use small typed failure categories rather than parsing exception text. At
minimum distinguish unavailable storage, unsupported history, invalid history,
owner capacity, and concurrent-update exhaustion. Their recovery differs.
An unsupported/corrupt owner cannot be repaired through the current delete
API because deletion validates that same owner first. Avoid telling that
learner to delete a record that the application cannot safely read.

### Meaning of first and latest

The current slots have precise, limited meanings:

- The first successful save becomes `first`.
- A different saved run becomes `latest`, replacing the earlier latest slot.
- Saving the identical retained run ID and bytes again is an idempotent no-op.
- Reusing a retained run ID with different contents fails.
- Deleting `latest` leaves `first` alone.
- Deleting `first` promotes `latest` and clears `latest`.
- Deleting the only record removes that milestone. The next save starts again.
- Saving an old execution later can make it the latest save. No score, passing
  status, or execution timestamp determines slot order.

Use `Saved run` for a sole record. With two records, use `Earlier saved run`
and `Latest saved run`. These labels describe the retained save order after
deletion and promotion. Explain the two-slot replacement policy near Save.
Keep the internal `first` and `latest` field names to avoid a migration for
presentation wording.

`capturedAt` records execution completion. Schema 1 has no `savedAt` timestamp.
Display `Run from …` beside the timestamp. Do not label it `Saved on …`, sort
retention by it, or reconstruct save time from it. Add a versioned saved-time
field only if an actual product requirement needs that information.

Concurrent saves follow committed store order. Click order across tabs can
differ from that order.
The transaction and retry policy keep both milestone writes intact when
possible. A conflict that exceeds the retry limit should ask for another
explicit attempt. Do not retry indefinitely in the background.

### Aggregate capacity

Keep the 2 MiB owner ceiling and count exact UTF-8 bytes of the final serialized
owner after applying replacement and deduplication. The budget includes every
milestone, code, artifacts, duplicated selected values, check messages, and
metadata. A per-record estimate cannot decide whether the write fits.

Three milestones with two maximum-size code/artifact payloads each already
consume 1.875 MiB before the remaining fields. Six saves therefore do not have
a guaranteed fit. Check messages can add substantial size. The all-course
40.6 MiB calculation in the main proposal also covers code and artifacts only.

Keep a failed capacity write atomic and preserve earlier records. Offer a
download of the current snapshot and a route to visible saved records that
the learner can remove. Do not silently evict another milestone, remove the
first slot, or truncate captured diagnostics to make room. Review real
serialized fixture sizes before any retention expansion.

### Concurrent-tab visibility

Correct transactions do not make another mounted panel refresh. The current
project component listens for `storage` only to reread the editor draft.
That event concerns localStorage/sessionStorage. IndexedDB history changes
need a separate refresh trigger.
[MDN's storage-event documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
confirms its scope.

The smallest adequate addition is an explicit Retry/Refresh action and a
scope-guarded refresh when the page becomes visible again. Defer refresh
while a mutation is active, then run one pending refresh. Do not use a polling
loop. Preserve an open report and its selection if its run still exists.

If immediate updates between visible tabs become necessary, add a small
BroadcastChannel invalidation message after commit. Send an owner/milestone
identifier, with no source or artifacts. Receivers revalidate from IndexedDB.
The channel does not carry authoritative records or grant access. It also
needs local same-document notification and the visibility fallback.
[MDN's BroadcastChannel documentation](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
describes the cross-document channel. This can follow the initial slice.

## Frozen descriptors and historical readers

Separate the current authoring registry from historical decoding. Use explicit
immutable descriptors for the two existing schema-1 contracts and the new
evaluation contract. Resolve a reader using the complete supported identity
and fixture version, then verify its frozen metadata and artifact contract.
Do not select historical meaning through today's exercise slug alone.

Replace the current `selectedInputs` network-versus-normalization branch with
an explicit decoder dispatch before adding evaluation. Its present fallback
assumes normalization for every other registered exercise. Adding a context
entry alone would leave that assumption in place.

For normalization and network records, schema 1 lacks an explicit result
definition ID. Their known full context maps deterministically to the frozen
legacy reader. That compatibility mapping is application knowledge. It does
not establish previously unobserved source provenance or fit history.

Evaluation can carry its explicit definition/version in its bounded Run
context artifact as the main proposal specifies. The envelope identifies the
assigned exercise. The decoder separately verifies observed source and case
data. Keep the context key set and value types fixed and machine-readable.

Use the following validation order:

1. Check owner, schema, basic field types, and structural bounds.
2. Resolve a supported frozen descriptor and reject unknown contracts.
3. Validate exact envelope context and artifact structure against that
   descriptor. Decode supported partial states without inventing values.
4. Verify hashes and consistency before treating a saved record as usable.
5. Compare its source hash with the current authorized exercise separately.
   A mismatch makes it historical. An unavailable current hash remains unknown.

`exerciseVersion` hashes the starter and grader hashes. It does not identify
the renderer release or semantic definition by itself. A presentation change
can keep a reader. A change to units, feature meaning, fixture identity, or
sampling rules needs a new contract with the older reader retained.

Keep the legacy owner-envelope conversion read-only until a successful atomic
write, as the current store already does. Freeze representative old JSON
fixtures before changing validators. A migration must not fill absent
observations from current fixture values or rehash a historical run as though
it used today's exercise.

The current owner validation policy is acceptable for this bounded slice,
provided its consequence is explicit. Unknown milestones and structurally
invalid records block all history and mutations for that owner. A selected
milestone read verifies that milestone's hashes, while every mutation verifies
all retained records. A hash failure elsewhere can therefore block a write
even when this milestone's history opens successfully.

The current UI has no general raw-owner export or salvage API. It can still
download a valid current or previously loaded snapshot. Do not promise export
of inaccessible records. Per-record quarantine and recovery need a separate
storage design.

## Deployment compatibility and rollback

Adding evaluation under schema 1 still changes what an owner may contain.
An older bundle rejects an unknown milestone before returning any records,
including normalization and network. Incrementing the host schema while
writing into the same owner envelope would not solve that problem.

Use a reader-first release sequence:

1. Release frozen legacy readers plus the evaluation reader with evaluation
   saving disabled. Test current, legacy, unknown, and malformed fixtures.
2. Establish that release as the oldest supported rollback target. Keep its
   reader available even if evaluation UI or writing is disabled later.
3. Enable evaluation writes through a separately controllable feature flag.
4. If the feature needs rollback, disable new writes and retain the compatible
   readers. Do not revert to a bundle that rejects already stored evaluation.

Reader-first deployment reduces the incompatible-client window. It cannot
guarantee every long-lived tab has refreshed. Old tabs can remain open across
both releases, and their existing code cannot be retroactively given a version
check. Such tabs may fail to open that owner's history until reload. Their
strict validation prevents an unsafe replacement write.

A lightweight application-version check on visibility and before writes can
reduce this problem for clients that include the check. It should disable
unsupported mutations and offer reload while allowing code recovery. It
cannot force already deployed baseline clients to cooperate. A service-worker
update alone also does not establish that every old tab has replaced its code.

If uninterrupted operation of every old bundle becomes a hard requirement,
separate new-version storage from the old envelope or first ship an
unknown-record-preserving reader. Either choice changes migration, mutation,
and aggregate-budget design. That work exceeds the minimal schema-1 slice.
Document the temporary old-tab limitation instead of claiming compatibility
that the current validator cannot provide.

## Ownership, guest work, and access

Resolve owner scope from the trusted activity identity before starting capture.
History loading and storage availability remain independent. Key the activity
subtree by owner and exercise, and keep an instance token for async guards.
Account switching must hide the old editor, reports, and history before any
new async read finishes.

Retain the project's `LearningActivityScope` server-identity guard. When client
identity differs from the identity used to authorize server props, show its
refresh state and unmount those props. Evaluation must not resolve or send a
paid starter, grader, or solution to an unentitled account. An imported or
locally stored result never grants lesson access or assessment credit.

The browser guest scope is shared by visitors using that browser profile. It
is not an account identity. Sign-in must not silently move guest records or
drafts into an account, and sign-out must not expose the previous account's
records in the guest panel. Preserve the existing separation.

Guest adoption remains outside this release. A later explicit adoption flow
needs a reviewable record selection, destination account, conflict rules,
capacity preflight, and atomic failure behavior. It must define identity and
provenance for a copied record, avoid duplicate adoption on retry, and decide
when guest copies remain. Schema 1 has no adoption provenance fields, and
there is no current general import path. Do not add a hidden owner rewrite
while implementing evaluation saving.

The current project page omits paid milestone panels when entitlement is
absent. Preserve that access behavior for this slice. Whether a former member
gets a separate export-only view of their own local paid-work records is a
distinct product decision. No record should be erased automatically because
entitlement changes.

## Verification and implementation sequence

The existing focused command passed on November 6 with 37 tests across five
files:

```sh
pnpm exec vitest run apps/web/lib/learning-evidence-types.test.ts apps/web/lib/learning-evidence-store.test.ts apps/web/app/components/learning-evidence.test.tsx apps/web/app/components/learning-evidence-project.test.tsx packages/ui/src/mdx/exercise-saved-runs.test.tsx --reporter=dot
```

These tests establish existing mocked capture, assistance, owner isolation,
and restore behavior. They do not validate the proposed render slot or full
browser concurrency. In particular, worker completion after reset already
has coverage. Hash preparation after a completed worker followed by reset
does not have that coverage.

| Implementation step | Required evidence before proceeding |
| --- | --- |
| Lifecycle and render slot | One accepted completion callback, explicit start/reset/restore events, raw fallback, report tied to submitted source, delayed A unable to replace B, reset unable to resurrect A. |
| Retained previous report | Running and failed B keep A collapsed as previous. A valid partial B replaces A. Previous A never supplies B's verdict or credit. |
| Restore registration | Old cleanup cannot erase new registration. Same-key remount rejects an old closure. Recovery writes precede editor replacement. Failed preservation and existing stash leave editor intact. |
| Save state | Save A during B, delete during new capture, failed refresh after committed save/delete, duplicate retry, replaced latest run saved again, and scope switch during write. |
| Historical readers | Frozen legacy JSON, legacy flat owner shape, current evaluation, changed current source, unknown contract, malformed context, and unsupported owner failure with no write. |
| Real IndexedDB | Concurrent different-milestone saves, same-milestone saves, save/delete races, conflict exhaustion, exact capacity failure, no partial migration, and another-tab refresh. |
| Access and rollout | Guest/account/account transitions, delayed old-owner work, unentitled project props, reader-first flag behavior, compatible rollback with saved evaluation, and old-tab failure/reload behavior. |

Use deterministic synthetic fixture records for these checks. No private
learner history is needed. After the correctness seams pass, inspect the full
lesson in both themes and on phone/desktop. Story, editor, current result,
history, and the next authored task must remain in the intended reading order.

The smallest release does not need a new global state library, per-point
persisted selection, automatic save, server synchronization, arbitrary JSON
import, a general migration framework, or a charting dependency. Each would
add contracts without resolving the concrete lifecycle gaps above.
