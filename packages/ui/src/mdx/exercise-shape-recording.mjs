// Shared by the browser worker and CI validator. Records describe the actual
// input/output relationship of shape operations without depending on dataId or
// copying tensor values. Weak keys do not keep completed tensors alive. This is
// local grading evidence, not a security boundary or a learner-facing API.
export const SHAPE_RECORDING_SOURCE = String.raw`(function(tf) {
  var records = new WeakMap();
  return {
    reset: function() { records = new WeakMap(); },
    read: function(output) { return records.get(output) || null; },
    record: function(operation, input, output) {
      if ((operation === 'reshape' || operation === 'transpose') &&
          input instanceof tf.Tensor && output instanceof tf.Tensor) {
        records.set(output, Object.freeze({ operation: operation, input: input }));
      }
      return output;
    }
  };
})`;
