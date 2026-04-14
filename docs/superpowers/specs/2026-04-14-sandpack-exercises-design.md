# Sandpack Interactive Exercises — Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

The exercise system is 75% built — the Sandpack editor, test result UI, scoring, and persistence all work. But exercises aren't truly interactive because:

1. The test harness is synchronous — can't `await` async exercise functions
2. The TensorFlow.js mock is skeleton-level — methods exist but don't compute real values
3. Import statements in starter code (`import * as tf`) don't resolve in the vanilla sandbox

## Solution

Three targeted fixes in `packages/ui/src/mdx/exercise.tsx` — no other files change.

## Changes

### 1. Async test execution

**Current:** `parseAndRunTests()` is synchronous. The `it(name, fn)` function calls `fn()` directly. If `fn` returns a Promise, the test "passes" immediately without waiting for the assertion.

**Fix:** Make the test runner async:
- `parseAndRunTests()` becomes `async parseAndRunTests()`
- `it(name, fn)` becomes `it(name, async fn)` — detects if `fn` returns a Promise and awaits it
- The entire test execution wraps in an async IIFE: `(async () => { ... })()`
- The `handleRun` click handler awaits the result
- **Replace the existing `setTimeout`-based timeout in `handleRun`** (lines 382-391) with the `Promise.race` approach inside `parseAndRunTests`. The current `setTimeout` pattern creates a race condition when the runner is async — both the timeout and the resolved promise could call `onResults`. Move timeout logic into `parseAndRunTests` via `Promise.race([execution, timeoutPromise])` so there's a single resolution path.
- Add a try/catch around each test's await to capture async assertion failures
- **`describe(name, fn)` must also be async-aware**: since it contains `it` calls that are now async, `describe`'s `fn` must be awaited. Collect all `it` promises within a describe block and await them before moving to the next describe.

### 2. Expand TensorFlow.js mock

**Current:** Mock has ~50 methods. Some compute real values (element-wise add/sub/mul/div with Float32Array), but many return dummy objects. Missing: proper MockTensor class, tensor1d/2d shorthands, axis-aware reductions, real matMul, randomNormal/linspace/range, arraySync/array, and model shape tracking.

**Fix:** Extend the existing mock (~300 lines total) with a proper MockTensor class and additional APIs. Preserve existing working behavior — this is an extension, not a replacement:

**Tensor class:**
```
class MockTensor {
  data: Float32Array
  shape: number[]
  rank: number
  dtype: string

  // Methods that return real values:
  dataSync() → Float32Array
  data() → Promise<Float32Array>
  array() → Promise<nested arrays>
  arraySync() → nested arrays
  print() → console.log formatted
  reshape(shape) → new MockTensor with same data, different shape
  dispose() → no-op
}
```

**Creation functions:**
- `tf.tensor(values, shape?)` — creates MockTensor with real Float32Array data
- `tf.tensor1d(values)` — 1D shorthand
- `tf.tensor2d(values, shape?)` — 2D shorthand
- `tf.scalar(value)` — 0D tensor
- `tf.zeros(shape)` — fills with 0s
- `tf.ones(shape)` — fills with 1s
- `tf.randomNormal(shape)` — fills with random values
- `tf.linspace(start, stop, num)` — evenly spaced values
- `tf.range(start, limit, delta?)` — range of values

**Math operations (element-wise on MockTensor):**
- `tf.add(a, b)`, `tf.sub(a, b)`, `tf.mul(a, b)`, `tf.div(a, b)`
- `tf.matMul(a, b)` — real matrix multiplication with shape validation (throws `Error: matMul inner dimensions must match` if a.shape[1] !== b.shape[0])
- `tf.sum(tensor, axis?)`, `tf.mean(tensor, axis?)`
- `tf.abs(tensor)`, `tf.sqrt(tensor)`, `tf.exp(tensor)`, `tf.log(tensor)`
- `tf.argMax(tensor, axis?)`, `tf.argMin(tensor, axis?)`

**Activations:**
- `tf.relu(tensor)` — max(0, x)
- `tf.sigmoid(tensor)` — 1/(1+exp(-x))
- `tf.softmax(tensor)` — exp(xi)/sum(exp(x))
- `tf.tanh(tensor)` — tanh(x)

**Model building (shape tracking, not computation):**
- `tf.sequential({ layers })` — returns model object that tracks layer configs
- `tf.layers.dense({ units, activation, inputShape })` — returns layer descriptor
- `tf.layers.dropout({ rate })` — returns layer descriptor
- `tf.layers.flatten()` — returns layer descriptor
- `model.add(layer)` — adds to layers array
- `model.compile({ optimizer, loss })` — stores config
- `model.predict(input)` — returns MockTensor with correct output shape (zeros)
- `model.summary()` — logs layer shapes

**This is not a full TF.js implementation.** It's enough for exercise tests to pass with real numeric values. Exercises that need advanced TF.js features (image processing, model loading, training loops) will use the model building mock for shape assertions rather than real computation.

### 3. Import statement handling

**Current:** Starter code begins with `import * as tf from '@tensorflow/tfjs'`. This line doesn't resolve in the vanilla sandbox.

**Fix:** Before executing code, strip import statements:
```ts
const cleanCode = userCode.replace(/^import\s+.*from\s+['"].*['"];?\s*$/gm, '');
```

The `tf` object is injected as a global via the mock, so imports aren't needed. This is already how it works — the import line is just cosmetic for the code editor.

### 4. Add toBeCloseTo matcher

The existing test harness has `expect.closeTo()` but no `toBeCloseTo(expected, precision)` on the expect chain. Since tensor math produces floating-point results, add this matcher for approximate numeric comparison:
```ts
toBeCloseTo(expected, precision = 5) // |actual - expected| < 10^(-precision) / 2
```

## What Doesn't Change

- Exercise YAML files (295 files) — no content changes
- ExerciseDataProvider — unchanged
- LessonContent integration — unchanged
- Scoring logic — unchanged
- Exercise attempts API — unchanged
- UI (editor, buttons, result panel) — unchanged
- Sandpack configuration — still vanilla template

## Verification

1. `pnpm build` passes
2. Navigate to a lesson with an exercise (e.g., `/themes/deep-orbit/foundations/introduction-to-tensors`)
3. Click "Run Tests" — tests execute and show pass/fail results
4. Type correct solution code → all tests pass (green progress bar, score 100%)
5. Type incorrect code → tests fail with clear error messages
6. Click "Reset" → code resets to starter template
7. Click "Show Solution" → solution code replaces editor content, "Solution revealed" message shows
8. Async exercises (e.g., exercises with `await tf.data()`) execute without hanging
9. Exercises using tensor math (add, mul, matMul) produce correct numeric results
