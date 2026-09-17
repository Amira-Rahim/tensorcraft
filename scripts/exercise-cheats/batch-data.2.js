// Correct pipeline, disjoint split, but future readings leaked into training.
let readCount = 0;
function readSample(i) {
  readCount++;
  return { features: [i * 100, i, i / 10], label: i % 2 };
}

function* sensorGen() {
  for (let i = 0; i < 16; i++) {
    const row = readSample(i);
    yield { xs: tf.tensor(row.features), ys: tf.tensor([row.label]) };
  }
}

const dataset = tf.data.generator(sensorGen).shuffle(10).batch(4);

const batchShapes = [];
await dataset.forEachAsync((b) => {
  batchShapes.push(b.xs.shape);
});

const trainIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15];
const valIdx = [10, 11, 12, 13];

function makeDataset(source) {
  return source.shuffle(10).batch(4);
}
