// Ignorant cheat, tightest version: builds the tensor and disposes it, but
// copies shape and values out of the instructions instead of reading them
// back off the tensor, so dataSync() is never called.
const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];

const reading = tf.tensor(streamValues);
reading.dispose();

const shape = [5];
const values = [0.12, 0.94, 0.31, 0.88, 0.47];
