# Sandpack Interactive Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 295 exercises interactive by fixing async test support, expanding the TF.js mock, and handling import statements.

**Architecture:** All changes are in one file: `packages/ui/src/mdx/exercise.tsx`. The `parseAndRunTests()` function (lines 85-259) gets an async rewrite, the TF.js mock (lines 192-242) gets expanded with real computation, and a `toBeCloseTo` matcher is added to the test harness.

**Tech Stack:** React, Sandpack, vanilla JS test harness, TensorFlow.js mock

**Spec:** `docs/superpowers/specs/2026-04-14-sandpack-exercises-design.md`

---

### Task 1: Make test execution async

**Files:**
- Modify: `packages/ui/src/mdx/exercise.tsx:85-259,377-430`

- [ ] **Step 1: Convert parseAndRunTests to async**

Change the function signature and wrap execution in an async IIFE. Replace lines 85-259:

The key changes:
1. Function becomes `async function parseAndRunTests(userCode: string, testCode: string): Promise<TestResult[]>`
2. `describe()` collects async `it()` promises and awaits them
3. `it()` detects if `fn` returns a Promise and awaits it
4. The `new Function()` call wraps everything in an async IIFE and returns a Promise
5. `Promise.race` with a 10-second timeout replaces the setTimeout in handleRun

The harness string becomes:
```javascript
var __results = [];
var __currentDescribe = '';

async function describe(name, fn) {
  __currentDescribe = name;
  try { await fn(); } catch(e) { /* individual its handle errors */ }
  __currentDescribe = '';
}

async function it(name, fn) {
  var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
  try {
    await fn();
    __results.push({ name: fullName, passed: true });
  } catch(e) {
    __results.push({ name: fullName, passed: false, error: e.message || String(e) });
  }
}
var test = it;
```

The execution becomes:
```typescript
const fullCode = `${tfMock}\n${harness}\n${cleanCode}\n(async function() {\n${testCode}\nreturn __results;\n})()`;
const fn = new Function(fullCode);
const resultPromise = fn() as Promise<TestResult[]>;

const timeoutPromise = new Promise<TestResult[]>((_, reject) =>
  setTimeout(() => reject(new Error("Timed out after 10 seconds")), 10_000)
);

const rawResults = await Promise.race([resultPromise, timeoutPromise]);
```

- [ ] **Step 2: Update handleRun to be async**

Replace the `handleRun` function (lines 377-430) to:
1. Remove the `setTimeout` timeout (moved into parseAndRunTests)
2. `await parseAndRunTests()` instead of synchronous call
3. Wrap in try/catch for timeout errors

```typescript
const handleRun = useCallback(async () => {
  setRunning(true);
  const code = sandpack.files["/index.js"]?.code ?? "";

  try {
    const results = await parseAndRunTests(code, exercise.testCode);
    onResults(results);
    hasAttempted.current = true;

    if (onAttempt) {
      const passed = results.length > 0 && results.every((r) => r.passed);
      const score = results.length > 0
        ? Math.round((results.filter((r) => r.passed).length / results.length) * 100)
        : 0;
      onAttempt({ exerciseSlug: exercise.slug, code, passed, score, solutionViewed: showSolution });
    }
  } catch (err) {
    onResults([{
      name: "Execution",
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    }]);
  } finally {
    setRunning(false);
  }
}, [sandpack, exercise, onResults, onAttempt, showSolution]);
```

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 2: Add toBeCloseTo matcher and import stripping

**Files:**
- Modify: `packages/ui/src/mdx/exercise.tsx`

- [ ] **Step 1: Add toBeCloseTo to the expect chain**

In the harness string, after the `toThrow` matcher (around line 158), add:
```javascript
toBeCloseTo: function(expected, precision) {
  precision = precision === undefined ? 5 : precision;
  var diff = Math.abs(actual - expected);
  var limit = Math.pow(10, -precision) / 2;
  if (diff >= limit) throw new Error('Expected ' + actual + ' to be close to ' + expected + ' (precision: ' + precision + ', diff: ' + diff + ')');
},
```

- [ ] **Step 2: Add import stripping before execution**

Before the `new Function()` call, add:
```typescript
// Strip import statements — tf is injected as a global via the mock
const cleanCode = userCode.replace(/^import\s+.*from\s+['"].*['"];?\s*$/gm, '');
```

Use `cleanCode` instead of `userCode` in the fullCode concatenation.

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 3: Expand TensorFlow.js mock

**Files:**
- Modify: `packages/ui/src/mdx/exercise.tsx:192-242`

- [ ] **Step 1: Replace the tfMock string with expanded version**

The current mock (lines 192-242) has basic element-wise ops but lacks: tensor1d/2d, arraySync/array, real matMul, randomNormal/linspace/range, exp/log/abs/sqrt, argMax/argMin, sum/mean with axis, tanh, model shape tracking.

Replace the tfMock string with an expanded version that:

1. Keeps all existing working behavior (tensor creation with flat/shape, element-wise add/sub/mul/div, relu/sigmoid/softmax, scalar/zeros/ones, sequential/layers)

2. Adds new capabilities:
   - `tf.tensor1d(values)` — shorthand for 1D
   - `tf.tensor2d(values, shape?)` — shorthand for 2D
   - `tensor.arraySync()` — returns nested arrays matching shape
   - `tensor.array()` — async version of arraySync
   - `tf.randomNormal(shape)` — fills with random normal values
   - `tf.linspace(start, stop, num)` — evenly spaced
   - `tf.range(start, limit, delta?)` — range
   - `tf.exp(x)`, `tf.log(x)`, `tf.abs(x)`, `tf.sqrt(x)` — math ops
   - `tf.tanh(x)` — activation
   - `tf.sum(x, axis?)`, `tf.mean(x, axis?)` — reductions (flatten for now, axis support is complex)
   - `tf.argMax(x, axis?)`, `tf.argMin(x, axis?)` — index of max/min
   - `tf.matMul(a, b)` — real matrix multiplication with shape validation
   - `tf.concat(tensors, axis?)` — concatenation
   - `tf.slice(x, begin, size)` — slicing
   - `model.predict(input)` — returns zeros with correct output shape based on last layer's units
   - `model.summary()` — console.log of layer shapes

3. Shape validation for matMul: throw `Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']')` when a.shape[last] !== b.shape[first]

The expanded mock should be ~250 lines of vanilla JS (no TypeScript, no imports — it's a string that gets eval'd).

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 4: Manual testing and verification

- [ ] **Step 1: Start dev server**

Run: `rm -rf apps/web/.next && pnpm dev`

- [ ] **Step 2: Test a basic exercise**

Navigate to `/themes/deep-orbit/foundations/introduction-to-tensors`
- Advance to the Challenge step (step 3)
- Click "Run Tests" with the starter code → should show failing tests
- Type the solution code → click "Run Tests" → should show all tests passing
- Click "Reset" → code resets
- Click "Show Solution" → solution appears

- [ ] **Step 3: Final build verification**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

## Critical Files

| File | Action |
|------|--------|
| `packages/ui/src/mdx/exercise.tsx` | Modify — async tests, expanded mock, import stripping, toBeCloseTo |

## Reusable Code

- All existing exercise YAML data (295 files) — unchanged
- ExerciseDataProvider context — unchanged
- LessonContent integration — unchanged
- Exercise attempts API — unchanged
- Sandpack editor/theme configuration — unchanged
