/** Load TensorFlow.js only when the learner runs this five-value example. */
export async function runTensorExample(values: readonly number[]) {
  const [tf] = await Promise.all([
    import("@tensorflow/tfjs-core"),
    import("@tensorflow/tfjs-backend-cpu"),
  ]);
  await tf.ready();
  // This tiny read is synchronous so tidy can release the tensor, including
  // on failure. Only plain JavaScript data leaves this function.
  return tf.tidy(() => {
    const reading = tf.tensor([...values]);
    return {
      shape: reading.shape,
      values: Array.from(reading.dataSync()),
    };
  });
}
