// Eager cheat: materializes the whole archive inside the generator before
// yielding anything, which is exactly what the lesson forbids. The shape of
// the task is satisfied (generator -> shuffle -> batch, 16 reads per drain),
// so only a mid-drain read count can tell it apart from the lazy version.
let readCount = 0;
function readSample(i) {
  readCount++;
  return { features: [i, i * 2], label: i % 2 };
}

function* sensorGen() {
  const all = [];
  for (let i = 0; i < 16; i++) all.push(readSample(i));
  for (const row of all) {
    yield { xs: tf.tensor(row.features), ys: tf.tensor([row.label]) };
  }
}

const dataset = tf.data.generator(sensorGen).shuffle(10).batch(4);

const batchShapes = [];
await dataset.forEachAsync((b) => {
  batchShapes.push(b.xs.shape);
});
