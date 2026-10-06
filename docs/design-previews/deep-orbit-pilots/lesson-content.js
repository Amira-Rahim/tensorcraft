export const lessons = [
  {
    title: 'The Training Loop', slug: 'training-loop', order: 4, minutes: 18,
    location: 'Archimedes, Engineering', time: 'The training run',
    alt: 'Demir watches a loss curve on the main engineering display.',
    opening: 'By its fifth line, the training log is under the number Farah wrote on the glass wall. Each line is one full pass over the dataset.',
    speaker: 'Ensign Demir', portrait: 'ensign-demir',
    quote: 'Training sequence initiated. I have run this loop by hand twice this week: forward, loss, backward, step. Tonight model.fit runs it so I don’t have to, and I find out whether I actually trust it.',
    task: 'Find out what another epoch buys',
    assignment: 'Follow the training and validation curves together. Then replace a guessed epoch count with a callback that watches validation loss.',
    concept: 'The training curve keeps falling. Keep going?',
    crew: { speaker: 'Chief Nazari', portrait: 'chief-nazari', quote: 'Ten times the compute and you cannot tell me what it bought. That’s coming out of your certification hours, Ensign. From now on, validation loss is the first number you read, and the first one you show me.' },
    challengeCrew: { speaker: 'Ensign Demir', portrait: 'ensign-demir', quote: 'The loop can keep running. I need to give it a stopping condition I can explain.' },
    code: `const history = await model.fit(trainX, trainY, {
  epochs: 500,          // maximum, not a target
  batchSize: 32,        // rows per weight update
  validationSplit: 0.2, // held back from updates
  callbacks: tf.callbacks.earlyStopping({
    monitor: 'val_loss',
    patience: 5,
    minDelta: 0,
  }),
});

// One recorded value per epoch, from this fit.
const training = history.history.loss;
const validation = history.history.val_loss;`,
    explanation: `<h3>Give the loop a stopping condition</h3><p>An <strong>epoch</strong> is one pass through the training rows. Each batch makes predictions, measures their error, and updates the weights. <strong>Loss</strong> measures that error; lower is better on the rows being measured.</p><p>Validation rows do not update the weights. Their loss helps you make training decisions. In this example, the training curve continues down after the validation curve turns upward.</p><p>The callback stops after five consecutive epochs without a new best validation loss. It reports a stopping condition, not the cause of the change.</p>`,
    references: [
      ['Read the settings and the data boundary', `<p><code>epochs</code> sets a maximum. More epochs permit more updates, with no promise of a better model. <code>batchSize</code> trades memory, throughput, and update variability; there is no universally best size.</p><p><code>validationSplit: 0.2</code> reserves the last 20% of the supplied rows before training shuffles. The practice setup interleaves classes first. Preserve feature/label pairs; use a time-aware split for future predictions from a time series.</p><p>Validation may guide stopping and settings. Reserve a separate untouched test set for the final evaluation after those decisions.</p>`],
      ['What fit() repeats, and what a callback can tell you', `<p>For each batch: predict, compute loss, compute gradients, and update weights. At the end of an epoch, measure validation loss and run the callback. Adam changes how the weight update uses gradients; its learning rate belongs to the optimizer in <code>compile()</code>, not an option in <code>fit()</code>.</p><p>Training loss falling while validation loss rises is consistent with overfitting. Check distribution changes, labels, and preprocessing too. The plot alone cannot identify the cause.</p><p>This TensorFlow.js callback leaves the final epoch’s weights in place. It does not automatically restore the best epoch. Keeping a best checkpoint requires saving, restoring, and disposing weight snapshots.</p>`],
      ['The Challenge compares two recent windows', `<p>The stopping callback reads each validation score. The separate <code>diagnose()</code> function describes recent trends using the previous ten losses and the latest ten losses of each curve.</p><p>A decrease greater than 5% means improving; an increase greater than 5% means worsening. Exactly 5% is in the flat band. Compare by multiplication, allow 1e-12 tolerance, and treat zero to positive as worsening. With fewer than 20 values, return <code>insufficient-history</code>.</p><p>Check validation improvement first, then both worsening, then training improving with validation worsening, then any other validation worsening. Otherwise return <code>plateau</code>. These labels do not diagnose the cause.</p>`],
    ],
    challengeTitle: 'Let validation stop the run',
    challengeIntro: 'The model and synthetic practice rows are supplied. Complete the stopping callback, training call, and trend summary. The checks inspect the run your code actually produced.',
    tasks: [
      'Return earlyStopping({ monitor: "val_loss", patience: 5, minDelta: 0 }) from makeEarlyStopping().',
      'Await model.fit into history: at most 500 epochs, validationSplit 0.2, batch size 8–64. Attach your callback.',
      'Implement diagnose(trainLosses, valLosses) using the two-window rule. Open the exact contract below for boundaries and return labels.',
    ],
    hint: 'Pass the callback returned by makeEarlyStopping() into fit(). Keep its stopping rule separate from diagnose(), which summarizes two windows after the run.',
    recallQuestion: 'These are means from two consecutive ten-epoch windows. Describe each trend. What should you investigate, and what can these curves alone establish?',
    recallAnswer: 'Training loss decreased while validation loss increased. The exercise label is train-down-validation-up. This is consistent with overfitting, but does not establish it: check data differences, labels, and preprocessing. A window summary also cannot tell you whether five consecutive individual epochs failed to improve the best validation loss.',
    learned: 'Configure model.fit(), monitor held-out validation loss, and describe observed trends before choosing a fix.',
    recap: ['An epoch passes through the training data; weights update once per batch.', 'Validation guides training decisions. A separate test set stays untouched until those decisions are finished.', 'Early stopping records that an improvement condition was not met. It does not diagnose why.'],
    endingBefore: 'Demir prints both curves and tapes them above his console. The rerun stopped after five epochs without a new best validation loss. The 500-epoch run spent ten times the compute on a number he guessed.',
    endingSpeaker: null,
    evidence: '28,800 readings', evidenceNote: 'Eleven days of telemetry. A hundred selected rows are now folded into 673 trained parameters.',
    endingAfter: 'Somewhere in that archive, he thinks, is at least one reading the network understands and nobody on board does. He is still in the corridor when Mirza’s order posts to the duty queue: evaluation next, on signals the network has never seen. Demir reads it twice and keeps walking.',
  },
  {
    title: 'Evaluating DEEP SCAN', slug: 'evaluating-deep-scan', order: 5, minutes: 25,
    location: 'Archimedes, Bridge', time: 'Deployment review',
    alt: 'Mirza stands at the command tier beside a verdict grid and new signal waveforms.',
    opening: 'Training is complete. Commander Mirza demands evidence on signals DEEP SCAN has never seen.',
    speaker: 'Commander Mirza', portrait: 'commander-mirza-resolved',
    quote: 'Run the evaluation suite. I want real numbers on signals the network has never seen.',
    task: 'Find the failures inside the score',
    assignment: 'Inspect which signals the classifier missed. Then evaluate your own run on held-out rows and report the scores it produced.',
    concept: '94% correct. Which signals did it miss?',
    crew: { speaker: 'Chief Nazari', portrait: 'chief-nazari', quote: 'Fifty signals reviewed. Three anomalies missed. How many investigations does that score leave us?' },
    challengeCrew: { speaker: 'Dr. Farah', portrait: 'dr-farah', quote: 'Keep these rows outside training. Report the result you measure, even if it is disappointing.' },
    code: `// Training is finished. These test rows were held out.
const [loss, accuracy] = model.evaluate(testX, testY);
const testLoss = loss.dataSync()[0];
const testAcc = accuracy.dataSync()[0];

// Read training accuracy from the actual fit record.
const trainAcc = history.history.acc.at(-1);
const gap = trainAcc - testAcc;

// Inspect errors and compare a baseline on the same rows.
// A small gap alone is not a release decision.`,
    explanation: `<h3>Count the errors the score combines</h3><p><strong>Accuracy</strong> is the fraction of correct predictions. Here, 47 of 50 are correct. The three mistakes are all missed anomalies.</p><p>A <strong>confusion matrix</strong> separates caught anomalies, correctly ignored calm signals, false alarms, and misses. <strong>Recall</strong> asks how many real anomalies were caught. <strong>Precision</strong> asks how many alarms were real anomalies. <strong>F1</strong> combines precision and recall into one score.</p><p>Choose a simple baseline using training data only, such as always predicting its most common class. Evaluate that baseline and the model on the same held-out rows. The model needs a useful improvement for the errors you care about.</p><p>Use validation data while choosing settings. Once settings are fixed, measure on untouched test data. Neither a small train/test gap nor a high score alone establishes readiness for deployment.</p>`,
    references: [
      ['Read the counts and their limits', `<p>For the illustrative board: accuracy = (23 + 24) / 50 = 94%; precision = 23 / (23 + 0) = 100%; recall = 23 / (23 + 3) ≈ 88.5%. F1 combines precision and recall: 2 × precision × recall / (precision + recall) ≈ 93.9%.</p><p>The board is a deliberately near-balanced slice. Its class mix need not match the live stream. Zero observed false alarms in 24 calm cases does not establish a zero false-alarm rate in deployment.</p><p>Lowering a threshold on fixed data cannot reduce recall or the false-positive rate. Precision can rise or fall. Choose thresholds on validation data according to error costs; never tune against the final test score.</p>`],
      ['Why an alarm can mean less when anomalies are rare', `<p>Suppose recall stays at 0.885, the false-positive rate is 2%, and only 1 in 1,000 signals is anomalous. Then an alarm’s precision is (0.885 × 0.001) / ((0.885 × 0.001) + (0.02 × 0.999)), about 4.2%.</p><p>Those are separate hypothetical rates, not measurements from the board. Reusing rates assumes a fixed threshold and unchanged distributions within each class. New sensors or changed patterns require new measurements.</p><p>Precision-recall and ROC curves compare thresholds. Report performance on relevant slices too; an aggregate score can conceal a failing cohort.</p>`],
      ['What the practice exercise measures', `<p>The Challenge uses 100 synthetic training rows and 43 held-out rows, including three authored story cases. That is a different dataset from this 50-signal illustration. Your run’s score can differ.</p><p>Compare trainAcc and testAcc: a gap greater than 0.15 gives <code>large-gap</code>; otherwise two scores below 0.7 give <code>low-scores</code>; otherwise return <code>no-gap-warning</code>. Check the gap first. These are exercise rules, not universal release thresholds.</p><p>A gap can reflect overfitting, changed data, label errors, or inconsistent preprocessing. Investigate before choosing a fix. The checks verify procedure, not a required accuracy.</p>`],
    ],
    challengeTitle: 'Report the numbers this run produces',
    challengeIntro: 'The supplied model gets 100 synthetic training rows. The 43 separate evaluation rows must stay out of training. Their measured score is independent of the illustrated 94%.',
    tasks: [
      'Await model.fit(trainX, trainY, { epochs: 30, batchSize: 16 }) into history.',
      'Evaluate testX/testY into evalResult. Read the final training accuracy and the evaluated test accuracy.',
      'Implement diagnose(trainAcc, testAcc): gap > 0.15 first, then both scores < 0.7. Store its result in verdict. The exact return labels are in the contract.',
    ],
    hint: 'With accuracy compiled as a metric, evaluate returns [loss, accuracy]. Read the scalar with dataSync()[0]. The training accuracy is the final history.history.acc entry.',
    recallQuestion: 'Both methods saw the same 100 untouched cases. Which failures does accuracy hide? What else would you need before recommending either method?',
    recallAnswer: 'The baseline scores 95% by catching none of the five anomalies. The model catches four, misses one, and raises nine false alarms, so it scores 90%. Lower accuracy may still be useful when misses cost more, but the decision needs error costs, a representative sample, uncertainty, and comparison on relevant slices. Choose settings on validation data, then keep the final test untouched.',
    learned: 'Evaluate on untouched rows, compare a baseline, and inspect which mistakes matter before recommending a model.',
    recap: ['Accuracy combines different kinds of errors. Inspect misses and false alarms separately.', 'Choose the baseline from training data, and compare both methods on the same held-out cases.', 'Validation guides decisions. Final test results report evidence after those decisions, with limits.'],
    endingBefore: 'Deployment authorized, the bridge gone quiet, Farah stays behind with the one number that will not leave her alone. She traces the reading through the archive index. Her pencil note still says to check the instrument chain first.',
    endingSpeaker: { speaker: 'Dr. Farah', portrait: 'dr-farah', quote: 'Ninety-four percent accurate, and the one reading it can’t decide on is the one I couldn’t explain by hand. What are you?' },
    evidence: 'Sample 7741 · 0.518', evidenceNote: 'The fictional crew’s model score, between its review cutoffs. Its true label remains unresolved.',
    endingAfter: 'The calibration ghost. The new score has brought her back to the same row without answering her question.',
  },
];

// Authored teaching trace, not a measurement or the canonical story run.
export const trainingTrace = {
  train: [.74,.68,.62,.57,.52,.48,.44,.40,.37,.34,.31,.29,.27,.25,.23,.22,.21,.20,.19,.18,.17,.16,.15,.14],
  validation: [.77,.71,.66,.61,.56,.52,.48,.45,.42,.39,.36,.33,.30,.27,.25,.23,.21,.19,.17,.18,.19,.21,.23,.25],
};

// Markers represent the authored aggregate, without inventing record IDs or scores.
export const signalKinds = Array.from({ length: 50 }, (_, i) =>
  [12, 31, 47].includes(i) ? 'fn' : i % 2 === 0 ? 'tp' : 'tn'
);
// Keep the distribution exact while spreading misses across the board.
signalKinds[48] = 'tn';
export const signalLabels = {
  tp: { symbol: '+', name: 'Caught anomaly', actual: 'Anomalous', predicted: 'Alarm' },
  tn: { symbol: '·', name: 'Calm signal left alone', actual: 'Calm', predicted: 'No alarm' },
  fn: { symbol: '×', name: 'Missed anomaly', actual: 'Anomalous', predicted: 'No alarm' },
};
