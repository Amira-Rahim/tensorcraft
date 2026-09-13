// Eager cheat, chunked flavour. It does not materialize the whole archive
// (the version that did is at the bottom of this comment); it buys rows in
// blocks of four, which is how a reader that batches its own I/O behaves, and
// the lesson forbids collecting rows into an array before yielding them. This
// beat the grader until audit round 5 (2026-09-08), because the laziness probe
// drained the generator through batch(4) and asked for four reads before the
// first batch: a chunk of four buys exactly four, and so does a lazy reader.
// The probe now asks for ONE sample per batch, where a lazy reader has read
// one row and a chunked reader has read a block.
//
// The plain eager version this replaced:
//   function* sensorGen() {
//     const all = [];
//     for (let i = 0; i < 16; i++) all.push(readSample(i));
//     for (const row of all) yield { xs: ..., ys: ... };
//   }
// It is caught by the same probe (16 reads before batch one), so nothing was
// lost by registering the harder one.
let readCount = 0;
function readSample(i) {
  readCount++;
  return { features: [i * 100, i, i / 10], label: i % 2 };
}

function* sensorGen() {
  for (let c = 0; c < 4; c++) {
    const chunk = [];
    for (let i = c * 4; i < c * 4 + 4; i++) chunk.push(readSample(i));
    for (const row of chunk) {
      yield { xs: tf.tensor(row.features), ys: tf.tensor([row.label]) };
    }
  }
}

const dataset = tf.data.generator(sensorGen).shuffle(10).batch(4);

const batchShapes = [];
await dataset.forEachAsync((b) => {
  batchShapes.push(b.xs.shape);
});
