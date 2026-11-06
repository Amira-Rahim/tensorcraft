// The worker and CLI embed this authored evaluation adapter before learner code executes.
// The assigned fixture and wire contract are injected as plain data. This is
// bounded diagnostic observation, not attestation of arbitrary JavaScript.
export const EVALUATION_CAPTURE_SOURCE = String.raw`(function(tf, recorder, fixture, roles, keys, createCollector) {
  var evaluate = tf.LayersModel && tf.LayersModel.prototype && tf.LayersModel.prototype.evaluate;
  var predict = tf.LayersModel && tf.LayersModel.prototype && tf.LayersModel.prototype.predict;
  var activations = ['relu', 'sigmoid', 'linear', 'tanh', 'elu', 'selu', 'softplus', 'softsign', 'hardSigmoid', 'softmax'];
  var optimizers = ['Adam', 'SGD', 'RMSProp', 'Adagrad', 'Adadelta', 'Adamax'];
  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function accuracy(v) { return finite(v) && v >= 0 && v <= 1; }
  function integer(v, min, max) { return Number.isInteger(v) && v >= min && v <= max ? v : null; }
  function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function pairs(x, y) {
    if (!x || !y || !x.complete || !y.complete || !equal(x.shape, [y.shape[0], 3]) || !equal(y.shape, [x.shape[0], 1])) return null;
    return Array.from({length: x.shape[0]}, function(_, i) { return x.values.slice(i * 3, i * 3 + 3).concat(y.values[i]); });
  }
  var trainingPairs = fixture.training.map(function(row) { return JSON.stringify(row); }).sort();
  var testPairs = new Set(fixture.evaluation.map(function(row) { return JSON.stringify(row.slice(1)); }));
  function tensorSnapshot(tensor) {
    try {
      if (!(tensor instanceof tf.Tensor) || tensor.dtype !== 'float32' || tensor.size > 8192) return null;
      return {shape: tensor.shape.slice(), values: Array.from(tensor.dataSync()), complete: true};
    } catch (_) { return null; }
  }
  function scalar(tensor) {
    try { return tensor instanceof tf.Tensor && tensor.size === 1 && finite(tensor.dataSync()[0]) ? tensor.dataSync()[0] : null; }
    catch (_) { return null; }
  }
  function checkpointEqual(a, b) {
    return !!(a && b && a.complete && b.complete && equal(a.tensors, b.tensors));
  }
  function supportedModel(model) {
    if (!(model instanceof tf.LayersModel)) return null;
    if (!Array.isArray(model.layers) || model.layers.length > 33) return {
      layers: [], optimizer: null, learningRate: null, parameters: null,
      inputWidth: null, alias: null, loss: null, supported: false, reason: 'over-limit'
    };
    var layers = model.layers.filter(function(layer) { return layer.getClassName() !== 'InputLayer'; });
    var configs = layers.map(function(layer) { return layer.getConfig(); });
    var optimizer = model.optimizer && model.optimizer.getClassName();
    var optimizerConfig = model.optimizer && model.optimizer.getConfig();
    var metrics = Array.isArray(model.metrics) ? model.metrics : [];
    var alias = metrics[0];
    var allowedMetric = metrics.length === 1 && ['accuracy', 'acc', 'binaryAccuracy'].indexOf(alias) >= 0;
    var parameters = model.countParams();
    var inputWidth = model.inputs && model.inputs.length === 1 && model.inputs[0].shape[1];
    var description = {
      layers: configs, optimizer: optimizers.indexOf(optimizer) >= 0 ? optimizer : null,
      learningRate: optimizerConfig && finite(optimizerConfig.learningRate) && optimizerConfig.learningRate >= 0 ? optimizerConfig.learningRate : null,
      parameters: integer(parameters, 0, 8192), inputWidth: integer(inputWidth, 0, 8192),
      alias: allowedMetric ? alias : null,
      loss: model.loss === 'binaryCrossentropy' ? model.loss : null,
      supported: false, reason: 'unsupported-model'
    };
    if (parameters > 8192 || layers.length > 32) description.reason = 'over-limit';
    else if (!allowedMetric || description.loss === null) description.reason = 'unsupported-metric';
    else if (inputWidth === 3 && model.inputs[0].shape.length === 2 && layers.length === 3 &&
      layers.every(function(layer) { return layer.getClassName() === 'Dense'; }) &&
      configs.every(function(c) { return integer(c.units, 1, 8192) !== null && activations.indexOf(c.activation) >= 0; }) &&
      configs[2].units === 1 && configs[2].activation === 'sigmoid' && description.optimizer !== null) {
      description.supported = true; description.reason = null;
    }
    return description;
  }
  return function captureEvaluation(input, readExistingArtifacts) {
    input = input || {};
    var context = {}, details = {};
    keys.forEach(function(key) { context[key] = null; details[key] = null; });
    function status(key, value, reason) { context[key] = value; details[key] = reason || null; }
    Object.assign(context, {
      definitionId: 'deep-orbit.evaluation-cases', contractVersion: 1,
      fixtureId: 'deep-scan-evaluation-100-43', fixtureVersion: '1',
      observedFitCount: 0, decisionRule: 0.5, class0: 0, class1: 1, evaluationBatchSize: 32
    });
    Object.assign(details, {decisionRule: 'gt', class0: 'calm', class1: 'flagged'});
    status('captureStatus', 'unavailable', 'capture-error');
    status('evaluationSourceStatus', 'unknown', 'input-read-failed');
    status('trainingSourceStatus', 'unknown', 'missing-fit');
    status('fitHistoryStatus', 'unknown', 'missing-fit');
    status('recordingStatus', 'unsupported', 'unsupported-fit');
    status('trainingLogStatus', 'unavailable', 'missing-fit');
    status('modelStateStatus', 'unknown', 'checkpoint-unavailable');
    status('modelSupportStatus', 'unknown', 'model-unavailable');
    status('measurementStatus', 'unavailable', 'missing-evaluation');
    status('submittedEvaluationStatus', 'unknown', 'missing-evaluation');
    var diagnosis = ['large-gap', 'low-scores', 'no-gap-warning'].indexOf(input.verdict) >= 0 ? input.verdict : null;
    context.learnerDiagnosis = diagnosis;
    details.learnerDiagnosis = diagnosis !== null ? 'present' : input.verdict == null ? 'missing' : 'invalid';
    var submitted = Object.freeze({trainAcc: finite(input.trainAcc) ? input.trainAcc : null, testAcc: finite(input.testAcc) ? input.testAcc : null, verdict: diagnosis});
    var reported = Array.isArray(input.evalResult) && input.evalResult.length === 2
      ? [scalar(input.evalResult[0]), scalar(input.evalResult[1])] : null;
    var trainingLoss = null, trainingAccuracy = null, evaluationLoss = null, evaluationAccuracy = null;
    var cases = [], fit = null, model = null, config = null;
    try {
      model = input.model && input.model.model instanceof tf.LayersModel ? input.model.model : input.model;
      var observations = recorder.read();
      var recording = recorder.status();
      context.observedFitCount = Math.min(16, recording.recordedFits);
      if (recording.overflow) status('recordingStatus', 'overflow', 'recording-overflow');
      else if (recording.pendingFits) status('recordingStatus', 'in-flight', 'fit-in-flight');
      else if (recording.unsupported) status('recordingStatus', 'unsupported', 'unsupported-fit');
      else status('recordingStatus', 'complete');
      var identityFit = observations.find(function(entry) { return entry && entry.history && entry.history === input.history; });
      // Sequential.compile replaces its internal model but reuses its layers.
      // Shared weighted layers also carry training across functional models.
      var currentLayers = model && Array.isArray(model.layers) && model.layers.length <= 33 ? model.layers : [];
      var modelFits = observations.filter(function(entry) {
        return entry && (entry.model === model || entry.weightLayers && entry.weightLayers.some(function(layer) {
          return currentLayers.indexOf(layer) >= 0;
        }));
      });
      context.modelFitCount = model instanceof tf.LayersModel ? modelFits.length : null;
      var currentWeightedLayers = currentLayers.filter(function(layer) {
        return layer.weights && layer.weights.length > 0;
      });
      var sameWeightLineage = identityFit && identityFit.weightLayers && currentWeightedLayers.length > 0 &&
        identityFit.weightLayers.length === currentWeightedLayers.length && identityFit.weightLayers.every(function(layer, i) {
          return layer === currentWeightedLayers[i];
        });
      fit = identityFit && (identityFit.model === model || sameWeightLineage) ? identityFit : null;
      if (fit) {
        var settings = fit.settings || {};
        context.trainingRows = fit.x ? integer(fit.x.shape[0], 0, 8192) : null;
        context.requestedEpochs = integer(settings.epochs, 0, 1000000);
        context.completedEpochs = fit.completed ? integer(fit.completed.completedEpochs, 0, 1000000) : null;
        context.batchSize = integer(settings.batchSize, 1, 8192);
        context.shuffle = typeof settings.shuffle === 'boolean' ? settings.shuffle : null;
        context.initialEpoch = integer(settings.initialEpoch, 0, 1000000);
        context.validationSplit = finite(settings.validationSplit) && settings.validationSplit >= 0 && settings.validationSplit < 1 ? settings.validationSplit : null;
        context.callbacksPresent = fit.callbacksPresent;
        var observedPairs = pairs(fit.x, fit.y);
        if (!observedPairs) status('trainingSourceStatus', 'unknown', 'input-read-failed');
        else if (!equal(fit.x.shape, [100, 3]) || !equal(fit.y.shape, [100, 1])) status('trainingSourceStatus', 'mismatch', 'shape-mismatch');
        else if (!equal(observedPairs.map(function(row) { return JSON.stringify(row); }).sort(), trainingPairs)) status('trainingSourceStatus', 'mismatch', 'pair-mismatch');
        else status('trainingSourceStatus', 'matched');
        if (fit.callbacksPresent) status('trainingLogStatus', 'unavailable', 'callbacks-unobserved');
        else if (fit.failed) status('trainingLogStatus', 'unavailable', 'failed-fit');
        else if (settings.loss !== 'binaryCrossentropy' || !Array.isArray(settings.metrics) || settings.metrics.length !== 1 || ['accuracy', 'acc', 'binaryAccuracy'].indexOf(settings.metrics[0]) < 0) status('trainingLogStatus', 'unavailable', 'metric-unavailable');
        else if (fit.completed && fit.completed.logAvailable && finite(fit.completed.finalLoss) && fit.completed.finalLoss >= 0 && accuracy(fit.completed.finalAccuracy)) {
          trainingLoss = fit.completed.finalLoss; trainingAccuracy = fit.completed.finalAccuracy;
          status('trainingLogStatus', 'available');
        } else status('trainingLogStatus', 'unavailable', 'metric-unavailable');
      }
      var observedEvaluationFit = modelFits.some(function(entry) {
        var rows = pairs(entry.x, entry.y);
        return rows && rows.some(function(row) { return testPairs.has(JSON.stringify(row)); });
      });
      if (identityFit && !fit) status('fitHistoryStatus', 'mismatch', 'wrong-model');
      else if (observedEvaluationFit) status('fitHistoryStatus', 'mismatch', 'evaluation-rows-in-fit');
      else if (modelFits.length > 1) status('fitHistoryStatus', 'mismatch', 'extra-model-fit');
      else if (modelFits.some(function(entry) { return entry.failed; })) status('fitHistoryStatus', 'mismatch', 'failed-fit');
      else if (fit && (context.requestedEpochs !== 30 || context.completedEpochs !== 30 || context.batchSize !== 16 || context.initialEpoch !== 0)) status('fitHistoryStatus', 'mismatch', 'wrong-schedule');
      else if (fit && (fit.validationDataPresent || context.validationSplit !== 0)) status('fitHistoryStatus', 'mismatch', 'validation-data-present');
      else if (fit && fit.callbacksPresent) status('fitHistoryStatus', 'unknown', 'callbacks-unobserved');
      else if (recording.overflow) status('fitHistoryStatus', 'unknown', 'recording-overflow');
      else if (recording.pendingFits) status('fitHistoryStatus', 'unknown', 'fit-in-flight');
      else if (recording.unsupported) status('fitHistoryStatus', 'unknown', 'unsupported-fit');
      else if (fit) status('fitHistoryStatus', 'matched');
      config = supportedModel(model);
      if (config) {
        context.parameterCount = config.parameters;
        context.inputWidth = config.inputWidth;
        for (var layerIndex = 0; layerIndex < 3; layerIndex++) {
          var layer = config.layers[layerIndex];
          context['layer' + (layerIndex + 1)] = layer ? integer(layer.units, 1, 8192) : null;
          details['layer' + (layerIndex + 1)] = layer && activations.indexOf(layer.activation) >= 0 ? layer.activation : null;
        }
        context.optimizer = config.optimizer; details.optimizer = config.learningRate;
        context.loss = config.loss; context.metric = config.alias ? 'binaryAccuracy' : null; details.metric = config.alias;
        status('modelSupportStatus', config.supported ? 'supported' : 'unsupported', config.reason);
      }
      var x = tensorSnapshot(input.testX), y = tensorSnapshot(input.testY);
      var inputRows = pairs(x, y);
      context.evaluationRows = x ? integer(x.shape[0], 0, 8192) : null;
      if (x && y && (!equal(x.shape, [43, 3]) || !equal(y.shape, [43, 1]))) status('evaluationSourceStatus', 'mismatch', 'shape-mismatch');
      else if (inputRows) {
        var canonicalRows = fixture.evaluation.map(function(row) { return row.slice(1); });
        if (equal(inputRows, canonicalRows)) status('evaluationSourceStatus', 'matched');
        else if (equal(inputRows.map(function(row) { return JSON.stringify(row); }).sort(), canonicalRows.map(function(row) { return JSON.stringify(row); }).sort())) status('evaluationSourceStatus', 'mismatch', 'row-order-mismatch');
        else if (!equal(inputRows.map(function(row) { return row.slice(0, 3); }), canonicalRows.map(function(row) { return row.slice(0, 3); }))) status('evaluationSourceStatus', 'mismatch', 'feature-mismatch');
        else status('evaluationSourceStatus', 'mismatch', 'label-mismatch');
      }
      var before = recorder.checkpoint(model);
      if (fit && fit.weights && before.complete && fit.weights.complete) {
        if (!checkpointEqual(fit.weights, before)) status('modelStateStatus', 'changed', 'weights-changed');
        else if (config && fit.settings && (!equal(fit.settings.units, config.layers.map(function(layer) { return layer.units; })) || !equal(fit.settings.activations, config.layers.map(function(layer) { return layer.activation; })) || fit.settings.loss !== config.loss || !equal(fit.settings.metrics, [config.alias]) || fit.settings.optimizer !== config.optimizer || fit.settings.learningRate !== config.learningRate)) status('modelStateStatus', 'changed', 'config-changed');
        else status('modelStateStatus', 'matched');
      }
      var validInputs = inputRows && inputRows.length > 0 && inputRows.length <= 43 && inputRows.every(function(row) {
        return row.length === 4 && row.slice(0, 3).every(accuracy) && (row[3] === 0 || row[3] === 1);
      });
      if (config && config.supported && validInputs && before.complete) {
        var measured = tf.tidy(function() {
          var privateX = tf.tensor2d(x.values, x.shape, 'float32');
          var privateY = tf.tensor2d(y.values, y.shape, 'float32');
          var metrics = evaluate.call(model, privateX, privateY, {batchSize: 32});
          var predicted = predict.call(model, privateX, {batchSize: 32});
          return {
            loss: Array.isArray(metrics) && metrics.length === 2 ? scalar(metrics[0]) : null,
            accuracy: Array.isArray(metrics) && metrics.length === 2 ? scalar(metrics[1]) : null,
            scores: predicted instanceof tf.Tensor && equal(predicted.shape, [inputRows.length, 1]) ? Array.from(predicted.dataSync()) : []
          };
        });
        evaluationLoss = finite(measured.loss) && measured.loss >= 0 ? measured.loss : null;
        evaluationAccuracy = accuracy(measured.accuracy) ? measured.accuracy : null;
        measured.scores.forEach(function(score, i) {
          if (!accuracy(score) || !inputRows[i]) return;
          var canonical = fixture.evaluation[i];
          var source = canonical && equal(inputRows[i], canonical.slice(1)) ? i < 40 ? 'generated' : 'authored' : 'unknown';
          cases.push([i, source].concat(inputRows[i].slice(0, 3), [inputRows[i][3], score]));
        });
        var after = recorder.checkpoint(model);
        if (!checkpointEqual(before, after)) {
          status('modelStateStatus', 'changed', 'changed-during-capture');
          status('measurementStatus', 'inconsistent', 'changed-during-capture');
        } else if (cases.length !== 43) status('measurementStatus', 'unknown', 'missing-cases');
        else if (evaluationAccuracy === null || evaluationLoss === null) status('measurementStatus', 'unavailable', 'nonfinite-metric');
        else {
          var correct = cases.filter(function(row) { return (row[6] > 0.5 ? 1 : 0) === row[5]; }).length;
          if (Math.abs(correct / 43 - evaluationAccuracy) > 1e-6) status('measurementStatus', 'inconsistent', 'accuracy-count-mismatch');
          else status('measurementStatus', 'consistent');
        }
      }
      if (evaluationLoss !== null && evaluationAccuracy !== null) {
        if (!reported || reported.some(function(value) { return value === null; })) status('submittedEvaluationStatus', 'mismatch', 'invalid-result-shape');
        else if (Math.abs(reported[0] - evaluationLoss) > 1e-6 * Math.max(1, Math.abs(evaluationLoss)) || Math.abs(reported[1] - evaluationAccuracy) > 1e-6) status('submittedEvaluationStatus', 'mismatch', 'value-mismatch');
        else status('submittedEvaluationStatus', 'matched');
      }
      if (!config || !config.supported) status('captureStatus', 'unavailable', 'unsupported-model');
      else if (cases.length !== 43) status('captureStatus', cases.length ? 'partial' : 'unavailable', 'missing-cases');
      else if (context.measurementStatus !== 'consistent') status('captureStatus', 'partial', 'missing-evaluation');
      else if (context.trainingLogStatus !== 'available') status('captureStatus', 'partial', 'missing-training-log');
      else status('captureStatus', 'complete');
    } catch (_) {
      status('captureStatus', cases.length ? 'partial' : 'unavailable', 'capture-error');
    }
    function table(role, rows, summary) { return {kind: 'table', title: role.title, columns: role.columns.slice(), rows: rows, summary: summary}; }
    var artifacts = [
      table(roles.measuredScores, [
        ['Final training log', context.trainingRows, trainingLoss, trainingAccuracy],
        ['Final model evaluation', context.evaluationRows, evaluationLoss, evaluationAccuracy]
      ], 'The training row reports the recorded fit log. Evaluation measures the final model on the captured inputs. The crew\'s fictional result remains separate.'),
      table(roles.runContext, keys.map(function(key) { return [key, context[key], details[key]]; }), 'These observations describe this run and the limits of its recorded training history.')
    ];
    if (cases.some(function(row) { return row[0] < 40; })) artifacts.push(table(roles.generatedCases, cases.filter(function(row) { return row[0] < 40; }), 'Input positions 0 through 39. Source labels require an exact match to the supplied fixture.'));
    if (cases.some(function(row) { return row[0] >= 40; })) artifacts.push(table(roles.authoredCases, cases.filter(function(row) { return row[0] >= 40; }), 'Input positions 40 through 42. Source labels require an exact match to the supplied fixture.'));
    // Preflight the whole bundle before the grader publishes any item.
    var preflight = createCollector();
    artifacts.forEach(preflight.record);
    var publish = preflight.read();
    var captureUnavailable = null;
    if (readExistingArtifacts && readExistingArtifacts().length > 0) {
      // Preserve earlier learner output. A semantic bundle owns its four slots.
      status('captureStatus', 'unavailable', 'capture-error');
      publish = [];
      captureUnavailable = 'result-capacity';
    }
    return Object.freeze({artifacts: publish, captureUnavailable: captureUnavailable, context: Object.freeze(context), details: Object.freeze(details), submitted: submitted,
      trainingLoss: trainingLoss, trainingAccuracy: trainingAccuracy, evaluationLoss: evaluationLoss, evaluationAccuracy: evaluationAccuracy});
  };
})`;
