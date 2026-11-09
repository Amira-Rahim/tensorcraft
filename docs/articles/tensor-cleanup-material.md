# Article material: tensor shape and cleanup

Source material for the first piece in the
[first-1,000 plan](../marketing-first-1000-paid.md) (§6A): "A tensor adds shape
and a cleanup obligation to your JavaScript array." The owner writes the
article by hand, because the owner directive of 2026-08-14 says people write
every blog post. This file holds facts, runnable code, measured output, and
accuracy notes for the writer.

## The problem from lesson one

- Source: [lesson one](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx)
  and its [exercise](../../packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml).
- Demir selects sensors A, B, C and D at three moments. The recording's header
  gives the order: A, B, C, D at each moment. These 12 values are an excerpt of
  a 64-sensor recording. The data is fictional story data, so label it that way
  if the article quotes it.
- `const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];`
- The lesson's goal is one chart line per sensor: A is 2, 3, 4 (rising), B is
  20, 18, 16 (falling), C is 5, 7, 6, and D is 8, 8, 9.
- The lesson admits that plain JavaScript could plot these values. The tensor
  matters because the crew's TensorFlow.js code, and later its models, take
  tensors as input. The article should keep that honest framing.
- The lesson states no units for the readings, so the article should not
  invent any.

## Environment for every output below

Every output below came from `@tensorflow/tfjs` 4.22.0, the version the
course pins, on 2026-11-02 in two runtimes: Node 22 (CPU backend) and headless
Chromium (WebGL backend through SwiftShader). Both runtimes printed identical values except where a section
says otherwise.

## 1. What the tensor records

```js
const streamValues = [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9];
const reading = tf.tensor(streamValues);
reading.shape;        // [12]
reading.dtype;        // "float32"
reading.size;         // 12
reading.arraySync();  // [2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]

const nested = tf.tensor([streamValues]);
nested.shape;         // [1, 12], the mistake lesson one's hint warns about
nested.dispose();
```

Every block below runs in the same page after this one. Each block disposes
what it creates, so the tensor counts in section 4 start from `reading` alone.

## 2. The shape does not say which value came from which sensor

Both lines below produce four rows of three numbers. Only the header's sensor
order says which grouping is correct.

```js
// reshape([3, 4]): rows are moments, columns are sensors A to D.
// transpose(): rows are sensors A to D, columns are moments.
// tf.tidy() disposes the reshaped tensors, as lesson one's supplied code does.
tf.tidy(() => reading.reshape([3, 4]).transpose().arraySync());
// [[2, 3, 4], [20, 18, 16], [5, 7, 6], [8, 8, 9]]   one row per sensor

tf.tidy(() => reading.reshape([4, 3]).arraySync());
// [[2, 20, 5], [8, 3, 18], [7, 8, 4], [16, 6, 9]]   mixes sensors in each row
```

The plan's second piece covers this in depth, so this piece can stop at one
example.

## 3. Where the array analogy stops

Measured in both runtimes:

```js
Array.isArray(reading);        // false
reading[0];                    // undefined, a tensor has no index access

const copy = reading.arraySync();
copy[0] = 999;
reading.arraySync()[0];        // 2, arraySync() returns a copy

const doubled = reading.mul(2);
doubled !== reading;           // true, operations return new tensors
reading.arraySync();           // unchanged: [2, 20, 5, 8, ...]
doubled.dispose();
```

Primary sources worth quoting:

- Lesson one's own limit note: "A JavaScript array and a tensor are different
  objects. A tensor records its shape and supports TensorFlow.js operations.
  Use arraySync() to copy its values into a JavaScript array."
- The [TensorFlow.js tensors guide](https://www.tensorflow.org/js/guide/tensors_operations)
  calls the synchronous readers `arraySync()` and `dataSync()` simpler but
  says they "will cause performance issues in your application", and
  recommends `array()` and `data()` in production code.

## 4. The cleanup obligation, measured

The guide states: "When using the WebGL backend, tf.Tensor memory must be
managed explicitly (it is not sufficient to let a tf.Tensor go out of scope
for its memory to be released)."

### Small tensors (Demir's 12 values): what the tensor count tracks

```js
tf.memory().numTensors;                         // 1
for (let i = 0; i < 1000; i++) reading.mul(2);  // results never disposed
tf.memory().numTensors;                         // 1001
tf.tidy(() => {
  for (let i = 0; i < 1000; i++) reading.mul(2);
});
tf.memory().numTensors;                         // still 1001
reading.dispose();
try {
  reading.arraySync();
} catch (error) {
  error.message;                                // "Tensor is disposed."
}
tf.memory().numTensors;                         // 1000, still counted
```

What this block measures:

- `numTensors` counts the tensors TensorFlow.js tracks. Only `dispose()`
  lowers it, so the 1000 dropped results stay counted.
- The count does not show memory still in use. TensorFlow.js keeps tensor data
  in `WeakMap`s, and in the 2026-11-02 runs (Node CPU, Chromium CPU, Chromium
  WebGL) a forced garbage collection reclaimed all 1000 dropped results while
  `numTensors` stayed at 1000.
- With the CPU backend (plain `@tensorflow/tfjs` in Node, and the course's
  exercise worker in the browser), `tf.memory()` reports `unreliable: true`
  with the reason "The reported memory is an upper bound. Due to automatic
  garbage collection, the true allocated memory may be less." The WebGL
  backend always reports `unreliable: false`, even while it counts these
  reclaimed results, so its small-tensor figures are not reliable either.
- In the WebGL run, `numBytesInGPU` stayed at 0. The WebGL backend runs an
  operation on the CPU when `WEBGL_CPU_FORWARD` is `true` (the default), the
  operation has a CPU implementation, and every input sits on the CPU with
  fewer than 128 elements (`CPU_HANDOFF_SIZE_THRESHOLD`). `mul` on Demir's 12
  values qualifies, so do not describe this example as a GPU memory leak.
- `dispose()` frees a tensor's storage for reuse right away and keeps
  `tf.memory()` accurate on every backend. In WebGL, the freed texture goes
  back to TensorFlow.js's reuse pool (`WEBGL_DELETE_TEXTURE_THRESHOLD`
  defaults to -1).

### A large tensor on the GPU (WebGL backend)

```js
const big = tf.ones([256, 256]);
big.mul(2).dataSync();                 // result never disposed
for (let i = 0; i < 10; i++) big.mul(2);
tf.tidy(() => { for (let i = 0; i < 10; i++) big.mul(2); });
big.dispose();
```

| After | `numTensors` | `numBytesInGPU` |
| --- | ---: | ---: |
| creating `big` and one `mul(2)` | 2 | 524,288 |
| 10 more `mul(2)` outside `tf.tidy()` | 12 | 3,145,728 |
| 10 `mul(2)` inside `tf.tidy()` | 12 | 3,145,728 |
| `big.dispose()` | 11 | 2,883,584 |

Each 256 by 256 float32 result holds 262,144 bytes. The 11 results that no
variable kept still hold 2,883,584 bytes, and the code has no reference left
to dispose them. A forced garbage collection in that run reclaimed the
JavaScript objects of the 10 loop results, and `numBytesInGPU` stayed at
2,883,584. This example shows the leak the guide warns about: the textures
stay allocated after their JavaScript objects are gone.

## 5. What the free module covers

- The learner writes `tf.tensor(streamValues)` and `reading.shape`. The
  supplied code reads the values back, groups them by sensor inside
  `tf.tidy()`, and calls `reading.dispose()` under the comment "release memory
  after saving the values for the chart". The tests check that `reading` is
  disposed and that reading it afterwards throws.
- Lesson one supplies those cleanup lines without explaining them, so the
  article should not claim lesson one teaches memory management.
- Free lesson 3, "Basic Tensor Operations", explains them: "`tf.tidy()`
  releases the temporary tensors when its synchronous callback finishes", and
  its exercise asks the learner to "Return both results from `tf.tidy()` and
  dispose of them after use."
- `tf.memory()` and a climbing `numTensors` are taught later, in paid Module 4,
  "Browser ML Runtimes", lesson 4, "Inference Pipeline".

## Call to action and disclosure

- Free activity: [lesson one](https://tensorcraft.app/worlds/deep-orbit/foundations/introduction-to-tensors),
  tagged in the plan's UTM pattern with `tensor-cleanup-01` as this piece's
  one `utm_content` value:
  `?utm_source=devto&utm_medium=article&utm_campaign=first1000&utm_content=tensor-cleanup-01`.
- The plan's call to action for this piece: "Try the tensor exercise."
- Disclose the offer the way the plan's drafts do: the first five lessons are
  free without an account. The full Deep Orbit course costs $79 once at the introductory price, with a $99 regular price.

## Clip for the piece (30 to 60 seconds)

A production run on 2026-11-02 confirmed three beats: the starter code fails
with "Not passed yet: 0 of 6 tests passed", the solution passes all 6 tests,
and the banner shows "Completion saved". The run's output section, "From your latest run",
starts below the test list. The run did not capture the chart itself, so check
the one-line-per-sensor chart while recording. Record from the deployed site,
as the plan requires for promotional recordings.
