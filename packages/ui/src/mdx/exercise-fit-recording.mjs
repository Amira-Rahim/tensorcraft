// One implementation for the browser worker and CI validator. Records stay
// inside the isolated run. Graders may publish bounded plain-value summaries
// through recordResult. Model objects and raw history never cross the worker.
// The string is embedded unchanged in the worker, avoiding bundler-dependent
// Function.toString() output. This is diagnostic provenance, not a trust boundary.
export const FIT_RECORDING_SOURCE = String.raw`(function(tf) {
  var getWeights = tf.LayersModel && tf.LayersModel.prototype.getWeights;
  var countParams = tf.LayersModel && tf.LayersModel.prototype.countParams;
  var readTensor = tf.Tensor && tf.Tensor.prototype.dataSync;
  function freshState() {
    return {
      records: [], models: new WeakMap(), nextModelOrdinal: 1,
      attemptedFits: 0, pendingFits: 0, failedFits: 0,
      overflow: false, unsupported: false
    };
  }
  var state = freshState();
  function snapshot(value) {
    try {
      if (!(value instanceof tf.Tensor)) return null;
      if (value.shape.length > 32) return null;
      var complete = value.size <= 8192 &&
        ['float32', 'int32', 'bool'].indexOf(value.dtype) >= 0;
      var data = complete ? readTensor.call(value) : null;
      if (data && (data.length > 8192 || data.length !== value.size)) complete = false;
      var values = complete ? Array.from(data) : null;
      if (values && !values.every(Number.isFinite)) {
        complete = false;
        values = null;
      }
      return Object.freeze({
        shape: Object.freeze(value.shape.slice()), dtype: value.dtype,
        values: values ? Object.freeze(values) : null, complete: complete
      });
    } catch (e) { return null; }
  }
  function checkpoint(model) {
    var parameters = null;
    function unavailable(reason) {
      return Object.freeze({ complete: false, reason: reason, parameters: parameters, tensors: null });
    }
    try {
      if (!(model instanceof tf.LayersModel)) return unavailable('model-unavailable');
      if (model.model instanceof tf.LayersModel) model = model.model;
      parameters = countParams.call(model);
      if (!Number.isInteger(parameters) || parameters < 0) {
        parameters = null;
        return unavailable('unreadable-weights');
      }
      if (parameters > 8192) return unavailable('over-limit');
      // getWeights returns live model Variables. Read them without disposal.
      var weights = getWeights.call(model);
      if (!Array.isArray(weights)) return unavailable('unreadable-weights');
      if (weights.length > 32) return unavailable('over-limit');
      var total = 0;
      for (var i = 0; i < weights.length; i++) {
        if (!(weights[i] instanceof tf.Tensor)) return unavailable('unreadable-weights');
        if (weights[i].dtype !== 'float32') return unavailable('unsupported-dtype');
        if (weights[i].shape.length > 32) return unavailable('over-limit');
        total += weights[i].size;
        if (total > 8192) return unavailable('over-limit');
      }
      if (total !== parameters) return unavailable('unreadable-weights');
      var tensors = [];
      var copiedValues = 0;
      for (var j = 0; j < weights.length; j++) {
        var data = readTensor.call(weights[j]);
        copiedValues += data.length;
        if (copiedValues > 8192) return unavailable('over-limit');
        if (data.length !== weights[j].size) return unavailable('unreadable-weights');
        var values = Array.from(data);
        if (!values.every(Number.isFinite)) return unavailable('nonfinite-weight');
        tensors.push(Object.freeze({
          shape: Object.freeze(weights[j].shape.slice()), dtype: weights[j].dtype,
          values: Object.freeze(values)
        }));
      }
      return Object.freeze({
        complete: true, reason: null, parameters: parameters, tensors: Object.freeze(tensors)
      });
    } catch (e) { return unavailable('unreadable-weights'); }
  }
  function scalar(value) {
    return typeof value === 'number' && Number.isFinite(value) ||
      typeof value === 'boolean' || typeof value === 'string' && value.length <= 180
      ? value : null;
  }
  function weightLayers(model) {
    try {
      if (!Array.isArray(model.layers) || model.layers.length > 64) return null;
      var layers = [];
      for (var i = 0; i < model.layers.length; i++) {
        var weights = model.layers[i].weights;
        if (!Array.isArray(weights)) return null;
        if (weights.length > 0) layers.push(model.layers[i]);
        if (layers.length > 32) return null;
      }
      // Sequential.compile replaces its internal model but reuses these
      // layer objects and their weights. Freeze only the reference list.
      return Object.freeze(layers);
    } catch (e) { return null; }
  }
  function settings(model, params) {
    try {
      // Sequential.fit delegates to its internal LayersModel in TFJS 4.22.
      // That model includes the input layer, which has no dense-unit count.
      var layers = [];
      if (Array.isArray(model.layers)) {
        for (var i = 0; i < model.layers.length && layers.length < 16; i++) {
          if (typeof model.layers[i].getConfig().units === 'number') layers.push(model.layers[i]);
        }
      }
      var config = model.optimizer && typeof model.optimizer.getConfig === 'function'
        ? model.optimizer.getConfig() : {};
      return Object.freeze({
        epochs: scalar(params.epochs == null ? 1 : params.epochs),
        batchSize: scalar(params.batchSize == null ? 32 : params.batchSize),
        shuffle: scalar(params.shuffle == null ? true : params.shuffle),
        initialEpoch: scalar(params.initialEpoch == null ? 0 : params.initialEpoch),
        validationSplit: scalar(params.validationSplit == null ? 0 : params.validationSplit),
        parameters: scalar(countParams.call(model)),
        units: Object.freeze(layers.map(function(layer) { return scalar(layer.getConfig().units); })),
        activations: Object.freeze(layers.map(function(layer) { return scalar(layer.getConfig().activation); })),
        optimizer: scalar(model.optimizer && model.optimizer.getClassName()),
        learningRate: scalar(config.learningRate),
        loss: scalar(model.loss),
        metrics: Object.freeze((Array.isArray(model.metrics) ? model.metrics : []).slice(0, 16).map(scalar))
      });
    } catch (e) { return null; }
  }
  function finiteMetric(value) {
    if (value instanceof tf.Tensor && value.size === 1) value = readTensor.call(value)[0];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  function completedHistory(history, callbacksPresent) {
    try {
      if (!history || !Array.isArray(history.epoch) || history.epoch.length > 1000000) return null;
      var losses = history.history && history.history.loss;
      if (!Array.isArray(losses)) return null;
      var length = Math.min(history.epoch.length, losses.length);
      var finiteEpochs = 0;
      var orderedEpochs = true;
      function point(index) {
        var loss = finiteMetric(losses[index]);
        var epoch = history.epoch[index];
        return Number.isInteger(epoch) && epoch >= 0 && loss !== null
          ? { epoch: epoch + 1, loss: loss } : null;
      }
      for (var i = 0; i < length; i++) {
        if (point(i)) finiteEpochs++;
        if (i > 0 && history.epoch[i] !== history.epoch[i - 1] + 1) orderedEpochs = false;
      }
      // Select the same finite-history samples as before without retaining
      // an unbounded temporary array of all completed points.
      var count = Math.min(64, finiteEpochs);
      var selected = [];
      var position = 0;
      for (var j = 0; j < length && selected.length < count; j++) {
        var current = point(j);
        if (!current) continue;
        var wanted = count === 1 ? 0 : Math.round(selected.length * (finiteEpochs - 1) / (count - 1));
        if (position === wanted) selected.push(Object.freeze(current));
        position++;
      }
      var metricKey = null;
      var accuracies = null;
      var keys = ['acc', 'accuracy', 'binaryAccuracy'];
      for (var k = 0; k < keys.length; k++) {
        if (Array.isArray(history.history[keys[k]])) {
          metricKey = keys[k];
          accuracies = history.history[metricKey];
          break;
        }
      }
      var last = history.epoch.length - 1;
      var finalLoss = last >= 0 && losses.length === history.epoch.length
        ? finiteMetric(losses[last]) : null;
      var finalAccuracy = last >= 0 && accuracies && accuracies.length === history.epoch.length
        ? finiteMetric(accuracies[last]) : null;
      if (finalAccuracy !== null && (finalAccuracy < 0 || finalAccuracy > 1)) finalAccuracy = null;
      // User callbacks run before TFJS History and can change its metrics.
      // Preserve legacy loss points, but withhold trusted final observations.
      if (callbacksPresent) { finalLoss = null; finalAccuracy = null; }
      return Object.freeze({
        completedEpochs: history.epoch.length, finiteEpochs: finiteEpochs,
        sampled: selected.length < finiteEpochs, points: Object.freeze(selected),
        finalLoss: finalLoss, finalAccuracy: finalAccuracy, metricKey: metricKey,
        logAvailable: !callbacksPresent && orderedEpochs && finiteEpochs === history.epoch.length &&
          finalLoss !== null && finalAccuracy !== null
      });
    } catch (e) { return null; }
  }
  function ordinal(runState, model) {
    if (!model || typeof model !== 'object' && typeof model !== 'function') return null;
    if (!runState.models.has(model)) runState.models.set(model, runState.nextModelOrdinal++);
    return runState.models.get(model);
  }
  function currentHistory(model) {
    try { return model.history; } catch (e) { return null; }
  }
  function callbackInfo(params) {
    try {
      var callbacks = Array.isArray(params.callbacks) ? params.callbacks : [params.callbacks];
      var present = callbacks.slice(0, 16).filter(Boolean);
      return {
        callbacksPresent: callbacks.length > 16 || present.length > 0,
        validationDataPresent: params.validationData != null,
        complete: true,
        callbacks: Object.freeze(present.map(function(c) {
          return Object.freeze({ monitor: scalar(c.monitor), patience: scalar(c.patience), minDelta: scalar(c.minDelta) });
        }))
      };
    } catch (e) {
      return { callbacksPresent: true, validationDataPresent: true, complete: false, callbacks: Object.freeze([]) };
    }
  }
  return {
    reset: function() { state = freshState(); },
    read: function() { return Object.freeze(state.records.slice()); },
    status: function() {
      return Object.freeze({
        recordedFits: state.records.length, attemptedFits: state.attemptedFits,
        pendingFits: state.pendingFits, failedFits: state.failedFits,
        overflow: state.overflow, unsupported: state.unsupported
      });
    },
    checkpoint: checkpoint,
    wrap: function(fit) {
      return function(x, y, options) {
        var runState = state;
        var params = options || {};
        var model = this;
        var previousHistory = currentHistory(model);
        runState.attemptedFits++;
        runState.pendingFits++;
        var entry = null;
        var index = -1;
        if (runState.records.length < 16) {
          var observedCallbacks = callbackInfo(params);
          entry = {
            model: model, modelOrdinal: ordinal(runState, model),
            weightLayers: weightLayers(model),
            x: snapshot(x), y: snapshot(y), history: null,
            settings: settings(model, params), completed: null, failed: false, pending: true,
            callbacksPresent: observedCallbacks.callbacksPresent,
            validationDataPresent: observedCallbacks.validationDataPresent,
            weights: null,
            callbacks: observedCallbacks.callbacks
          };
          if (!entry.x || !entry.x.complete || !entry.y || !entry.y.complete ||
              !entry.settings || !entry.weightLayers || !observedCallbacks.complete) runState.unsupported = true;
          // Keep pending read slots null for existing grader compatibility.
          index = runState.records.push(null) - 1;
        } else {
          runState.overflow = true;
        }
        function settled(history, failed) {
          runState.pendingFits--;
          if (failed) runState.failedFits++;
          if (entry) {
            entry.pending = false;
            entry.failed = failed;
            entry.history = failed ? null : history;
            entry.completed = completedHistory(history, entry.callbacksPresent);
            entry.weights = checkpoint(model);
            if (!entry.weights.complete || !failed && !entry.completed) runState.unsupported = true;
            runState.records[index] = Object.freeze(entry);
          }
        }
        function rejected(error) {
          var failedHistory = currentHistory(model);
          settled(failedHistory !== previousHistory ? failedHistory : null, true);
          throw error;
        }
        var pending;
        try {
          pending = fit.apply(this, arguments);
        } catch (error) {
          // Preserve the fit function's synchronous throw after recording it.
          return rejected(error);
        }
        return Promise.resolve(pending).then(function(history) {
          settled(history, false);
          return history;
        }, rejected);
      };
    }
  };
})`;
