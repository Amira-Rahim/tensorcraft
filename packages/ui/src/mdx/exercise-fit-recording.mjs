// One implementation for the browser worker and CI validator. Records stay
// inside the isolated run. Graders may publish bounded plain-value summaries
// through recordResult. Model objects and raw history never cross the worker.
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
  function scalar(value) {
    return typeof value === 'number' && Number.isFinite(value) ||
      typeof value === 'boolean' || typeof value === 'string' && value.length <= 180
      ? value : null;
  }
  function settings(model, params) {
    try {
      // Sequential.fit delegates to its internal LayersModel in TFJS 4.22.
      // That model includes the input layer, which has no dense-unit count.
      var layers = Array.isArray(model.layers) ? model.layers.filter(function(layer) {
        return typeof layer.getConfig().units === 'number';
      }).slice(0, 16) : [];
      var config = model.optimizer && typeof model.optimizer.getConfig === 'function'
        ? model.optimizer.getConfig() : {};
      return Object.freeze({
        epochs: scalar(params.epochs == null ? 1 : params.epochs),
        batchSize: scalar(params.batchSize == null ? 32 : params.batchSize),
        shuffle: scalar(params.shuffle == null ? true : params.shuffle),
        initialEpoch: scalar(params.initialEpoch == null ? 0 : params.initialEpoch),
        validationSplit: scalar(params.validationSplit == null ? 0 : params.validationSplit),
        parameters: scalar(model.countParams()),
        units: Object.freeze(layers.map(function(layer) { return scalar(layer.getConfig().units); })),
        activations: Object.freeze(layers.map(function(layer) { return scalar(layer.getConfig().activation); })),
        optimizer: scalar(model.optimizer && model.optimizer.getClassName()),
        learningRate: scalar(config.learningRate),
        loss: scalar(model.loss),
        metrics: Object.freeze((Array.isArray(model.metrics) ? model.metrics : []).slice(0, 16).map(scalar))
      });
    } catch (e) { return null; }
  }
  function completedHistory(history) {
    try {
      if (!history || !Array.isArray(history.epoch)) return null;
      var losses = history.history && history.history.loss;
      if (!Array.isArray(losses)) return null;
      var points = [];
      for (var i = 0; i < Math.min(history.epoch.length, losses.length); i++) {
        var loss = losses[i];
        if (loss instanceof tf.Tensor && loss.size === 1) loss = loss.dataSync()[0];
        var epoch = history.epoch[i];
        if (typeof epoch === 'number' && Number.isInteger(epoch) && epoch >= 0 &&
            typeof loss === 'number' && Number.isFinite(loss)) {
          points.push(Object.freeze({ epoch: epoch + 1, loss: loss }));
        }
      }
      var count = Math.min(64, points.length);
      var sampled = count === points.length ? points : Array.from({ length: count }, function(_, index) {
        return points[Math.round(index * (points.length - 1) / (count - 1))];
      });
      return Object.freeze({
        completedEpochs: history.epoch.length,
        finiteEpochs: points.length,
        sampled: sampled.length < points.length,
        points: Object.freeze(sampled)
      });
    } catch (e) { return null; }
  }
  return {
    reset: function() { records = []; },
    read: function() { return Object.freeze(records.slice()); },
    wrap: function(fit) {
      return function(x, y, options) {
        var runRecords = records;
        var params = options || {};
        var model = this;
        var previousHistory = model.history;
        var callbacks = Array.isArray(params.callbacks) ? params.callbacks : [params.callbacks];
        var entry = runRecords.length < 16 ? {
          model: model, x: snapshot(x), y: snapshot(y), history: null,
          settings: settings(model, params), completed: null, failed: false,
          callbacks: Object.freeze(callbacks.filter(Boolean).map(function(c) {
            return Object.freeze({ monitor: c.monitor, patience: c.patience, minDelta: c.minDelta });
          }))
        } : null;
        // Reserve a bounded slot before asynchronous fits can overlap.
        var index = entry ? runRecords.push(null) - 1 : -1;
        return Promise.resolve(fit.apply(this, arguments)).then(function(history) {
          if (entry) {
            entry.history = history;
            entry.completed = completedHistory(history);
            runRecords[index] = Object.freeze(entry);
          }
          return history;
        }, function(error) {
          if (entry) {
            entry.failed = true;
            entry.completed = model.history !== previousHistory ? completedHistory(model.history) : null;
            runRecords[index] = Object.freeze(entry);
          }
          throw error;
        });
      };
    }
  };
})`;
