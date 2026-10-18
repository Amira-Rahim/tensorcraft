/** Run the opening viewer with a selected, time-major recording excerpt. */
export async function runTensorExample(
  values: readonly number[],
  sensorCount = 4,
) {
  if (!values.length || values.length % sensorCount !== 0) {
    throw new Error(
      "Include one reading from every selected sensor at each moment.",
    );
  }
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  return tf.tidy(() => {
    const reading = tf.tensor([...values]);
    const bySensor = reading
      .reshape([values.length / sensorCount, sensorCount])
      .transpose();
    return {
      shape: reading.shape,
      values: Array.from(reading.dataSync()),
      chartRows: bySensor.arraySync() as number[][],
    };
  });
}
