// Ignorant cheat: pulls both passes back into JavaScript with dataSync() and
// does the averaging and the gain with Array.map, one element at a time on the
// CPU, which is the execution model this lesson exists to replace. No tensor op
// runs anywhere: tf.tensor only re-wraps the finished JS arrays, so the result
// is flat whatever rank went in and nothing broadcasts.
function mergePasses(pass1, pass2, gain) {
  const a = Array.from(pass1.dataSync());
  const b = Array.from(pass2.dataSync());
  const avg = a.map((x, i) => (x + b[i]) / 2);
  return {
    merged: tf.tensor(avg),
    boosted: tf.tensor(avg.map((x) => x * gain)),
  };
}
