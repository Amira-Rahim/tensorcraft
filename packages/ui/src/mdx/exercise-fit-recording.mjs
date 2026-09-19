// One implementation for the browser worker and CI validator. Records stay
// inside the isolated run; they are never product analytics or saved answers.
// The string is embedded unchanged in the worker, avoiding bundler-dependent
// Function.toString() output. This is diagnostic provenance, not a trust boundary.
export const FIT_RECORDING_SOURCE = String.raw`(function(tf) {
  var records = [];
  function snapshot(value) {
    if (!(value instanceof tf.Tensor)) return null;
    var complete = value.size <= 8192;
    return Object.freeze({
      shape: Object.freeze(value.shape.slice()),
      values: complete ? Object.freeze(Array.from(value.dataSync())) : null,
      complete: complete
    });
  }
  return {
    reset: function() { records = []; },
    read: function() { return Object.freeze(records.slice()); },
    wrap: function(fit) {
      return function(x, y, options) {
        var runRecords = records;
        var params = options || {};
        var callbacks = Array.isArray(params.callbacks) ? params.callbacks : [params.callbacks];
        var entry = runRecords.length < 16 ? {
          x: snapshot(x), y: snapshot(y), history: null,
          callbacks: Object.freeze(callbacks.filter(Boolean).map(function(c) {
            return Object.freeze({ monitor: c.monitor, patience: c.patience, minDelta: c.minDelta });
          }))
        } : null;
        // Reserve a bounded slot before asynchronous fits can overlap.
        var index = entry ? runRecords.push(null) - 1 : -1;
        return Promise.resolve(fit.apply(this, arguments)).then(function(history) {
          if (entry) { entry.history = history; runRecords[index] = Object.freeze(entry); }
          return history;
        }, function(error) {
          if (entry) runRecords[index] = Object.freeze(entry);
          throw error;
        });
      };
    }
  };
})`;
