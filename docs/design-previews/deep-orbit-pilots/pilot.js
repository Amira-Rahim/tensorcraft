import { lessons, trainingTrace, signalKinds, signalLabels } from './lesson-content.js';
import { parseAndRunTestsWith, WORKER_BODY_STRING } from './runner.js';

const $ = id => document.getElementById(id);
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const assetRoot = '../../../apps/web/public/';
const phases = ['Briefing', 'Concept', 'Challenge', 'Takeaways', 'Epilogue'];
const storageKey = 'tensorcraft:pilots:drafts:v1';
let stored = [], storageAvailable = true;
try { stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]'); if (!Array.isArray(stored)) stored = []; } catch { storageAvailable = false; }
let exercises = [], exerciseError = '';
try {
  const response = await fetch('./exercises.json');
  if (!response.ok) throw new Error('Exercise files did not load.');
  exercises = await response.json();
} catch (error) { exerciseError = error.message; }
const states = lessons.map((_, i) => ({
  epoch: 14, revealed: false, misses: false, selected: 12,
  draft: typeof stored[i]?.draft === 'string' ? stored[i].draft : exercises[i]?.starter || '',
  recall: typeof stored[i]?.recall === 'string' ? stored[i].recall : '',
  answerOpen: false, result: null,
}));
let lessonIndex = 0, phaseIndex = 0, activeRun = null, runSerial = 0;
function readLocation() {
  const params = new URLSearchParams(location.search);
  lessonIndex = Math.max(0, Math.min(1, Math.trunc(Number(params.get('lesson')) || 0)));
  phaseIndex = Math.max(0, Math.min(4, Math.trunc(Number(params.get('phase')) || 0)));
}
readLocation();
function save() {
  try { sessionStorage.setItem(storageKey, JSON.stringify(states.map(({ draft, recall }) => ({ draft, recall })))); }
  catch { storageAvailable = false; }
  if ($('draft-note')) $('draft-note').textContent = storageAvailable ? 'Draft saved in this tab' : 'Draft kept while this page stays open';
}
let announcement = 0;
function announce(message) {
  clearTimeout(announcement);
  $('lesson-status').textContent = '';
  announcement = setTimeout(() => { $('lesson-status').textContent = message; }, 30);
}
const scene = lesson => `<figure class="scene"><img src="${assetRoot}scenes/deep-orbit/training-loop/${lesson.slug}.webp" width="1536" height="1024" alt="${escape(lesson.alt)}" fetchpriority="${phaseIndex === 0 ? 'high' : 'auto'}"></figure>`;
const dialogue = beat => `<div class="dialogue"><img src="${assetRoot}characters/deep-orbit/${beat.portrait}.webp" width="512" height="512" alt=""><div><strong>${escape(beat.speaker)}</strong><p>${escape(beat.quote)}</p></div></div>`;
const context = (lesson, challenge = false) => `<aside class="scene-context" aria-label="Crew context">${scene(lesson)}<p class="scene-location">${escape(lesson.location)}</p>${dialogue(challenge ? lesson.challengeCrew : lesson.crew)}</aside>`;
const source = code => `<div class="code-block"><div class="code-head"><span>JavaScript</span><span>Worked example</span></div><pre tabindex="0" aria-label="JavaScript code" class="pilot-code" translate="no">${escape(code)}</pre></div>`;

function briefing(lesson) {
  return `<div class="scene-heading"><p><span>Int.</span> - ${escape(lesson.location)} - ${escape(lesson.time)}</p></div><div class="briefing-grid"><div class="briefing-art">${scene(lesson)}<p class="stage-direction">${escape(lesson.opening)}</p></div><div class="briefing-beats">${dialogue({ speaker: lesson.speaker, portrait: lesson.portrait, quote: lesson.quote })}</div></div><section class="briefing-assignment"><h2>${lesson.task}</h2><p>${lesson.assignment}</p><details class="pilot-prerequisites"><summary>What this lesson builds on</summary><p>${lessonIndex === 0 ? 'You have already met loss, gradients, and weight updates. Be comfortable with JavaScript arrays, functions, and async/await. This lesson connects those pieces into model.fit().' : 'You have trained a classifier and used validation loss to guide stopping. This lesson reserves separate test rows and examines the mistakes behind an evaluation score.'}</p></details></section>`;
}

function curveSvg(count, trace = trainingTrace, id = 'loss-chart') {
  const last = trace.train.length - 1;
  const x = i => 44 + i / last * 452, y = value => 260 - value / .8 * 220;
  const points = values => values.slice(0, count).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg class="plot" viewBox="0 0 540 304" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">Training and validation loss through epoch ${count}</title><desc id="${id}-desc">Lower loss is better on the measured rows. Training loss ${trace.train[count-1].toFixed(2)}, validation loss ${trace.validation[count-1].toFixed(2)}. Both share the same scale from zero to 0.8.</desc>${[0,.2,.4,.6,.8].map(v => `<line class="grid" x1="44" x2="496" y1="${y(v)}" y2="${y(v)}"/><text x="32" y="${y(v)+4}" text-anchor="end">${v.toFixed(1)}</text>`).join('')}<text x="44" y="20">Loss</text>${[0,5,11,17,23].filter(i=>i<=last).map(i => `<text x="${x(i)}" y="282" text-anchor="middle">${i+1}</text>`).join('')}<text x="496" y="302" text-anchor="end">Epoch</text><line class="cursor" x1="${x(count-1)}" x2="${x(count-1)}" y1="40" y2="260"/><polyline class="curve train" points="${points(trace.train)}"/><polyline class="curve validation" points="${points(trace.validation)}"/><circle cx="${x(count-1)}" cy="${y(trace.train[count-1])}" r="5" fill="var(--primary)"/><circle cx="${x(count-1)}" cy="${y(trace.validation[count-1])}" r="5" fill="var(--axis)"/></svg>`;
}
function trainingObservation(epoch) {
  if (epoch === 1) return 'The first epoch gives a starting point for each curve. A trend needs more observations. The patience count starts at zero.';
  if (epoch <= 19) return 'Both curves have improved so far. A new best validation loss resets the patience count. The next epoch can still change that.';
  if (epoch < 24) return `Training loss is still falling. Validation has gone ${epoch - 19} consecutive epoch${epoch === 20 ? '' : 's'} without improving its best value. The callback is still waiting.`;
  return 'Five consecutive epochs did not improve the best validation loss. The callback would stop here. These curves alone do not establish why validation worsened.';
}
function trainingInstrument(s) {
  return `<section class="instrument" aria-label="Training timeline"><div class="instrument-head"><h2>Read the second curve</h2><span class="shape-tag" id="epoch-badge">Epoch ${s.epoch} / 24</span></div><p class="instrument-caption">Illustrative trace. Separate from the model you will train.</p><div class="curve-legend"><span><i aria-hidden="true"></i>Training: weights update</span><span><i class="val-key" aria-hidden="true"></i>Validation: held out</span></div><div id="curve-figure">${curveSvg(s.epoch)}</div><label class="epoch-control" for="epoch-range">Inspect an epoch <input id="epoch-range" type="range" min="1" max="24" step="1" value="${s.epoch}" aria-valuetext="Epoch ${s.epoch} of 24"></label><div class="control-row"><button class="secondary" id="next-epoch" aria-disabled="${s.epoch === 24}">Next epoch</button><button class="secondary" id="end-trace">See end of trace</button></div><dl class="curve-readout"><div><dt>Training loss</dt><dd id="train-value">${trainingTrace.train[s.epoch-1].toFixed(2)}</dd></div><div><dt>Validation loss</dt><dd id="val-value">${trainingTrace.validation[s.epoch-1].toFixed(2)}</dd></div></dl><div class="pilot-observation"><div class="patience-marks" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="${i < s.epoch - 19 ? 'spent' : ''}"></span>`).join('')}</div><p class="pilot-small" id="patience-note">${Math.max(0,s.epoch-19)} / 5 epochs without a new best validation loss</p><p id="training-observation">${trainingObservation(s.epoch)}</p></div><details class="trace-table"><summary>Read the trace as a table</summary><table class="recall-table"><caption>Illustrative loss values</caption><thead><tr><th scope="col">Epoch</th><th scope="col">Training</th><th scope="col">Validation</th></tr></thead><tbody>${trainingTrace.train.map((v,i) => `<tr><th scope="row">${i+1}</th><td>${v.toFixed(2)}</td><td>${trainingTrace.validation[i].toFixed(2)}</td></tr>`).join('')}</tbody></table></details></section>`;
}
function updateTraining(announceChange = true) {
  const s = states[0];
  $('curve-figure').innerHTML = curveSvg(s.epoch);
  $('epoch-badge').textContent = `Epoch ${s.epoch} / 24`;
  $('epoch-range').value = s.epoch;
  $('epoch-range').setAttribute('aria-valuetext', `Epoch ${s.epoch} of 24`);
  $('next-epoch').setAttribute('aria-disabled', String(s.epoch === 24));
  $('train-value').textContent = trainingTrace.train[s.epoch-1].toFixed(2);
  $('val-value').textContent = trainingTrace.validation[s.epoch-1].toFixed(2);
  document.querySelectorAll('.patience-marks span').forEach((el,i) => el.classList.toggle('spent', i < s.epoch-19));
  $('patience-note').textContent = `${Math.max(0,s.epoch-19)} / 5 epochs without a new best validation loss`;
  $('training-observation').textContent = trainingObservation(s.epoch);
  if (announceChange) announce(`Epoch ${s.epoch}. Training loss ${$('train-value').textContent}; validation loss ${$('val-value').textContent}. ${$('patience-note').textContent}. ${s.epoch === 24 ? 'Stopping condition reached.' : ''}`);
}

function evaluationInstrument(s) {
  return `<section class="instrument" aria-label="Evaluation signal board"><div class="instrument-head"><h2>Fifty reviewed signals</h2><span class="shape-tag">Illustrative slice</span></div><div class="signal-summary"><strong>94%</strong><span>47 of 50 predictions correct</span></div><p class="instrument-caption">Each tile stands for one case in the authored example, not an archive record. Reveal the outcomes to see the errors.</p><button class="secondary" id="reveal-errors" aria-pressed="${s.revealed}">${s.revealed ? 'Hide outcomes' : 'Inspect the errors'}</button><div class="signal-board" role="group" aria-label="50 illustrative signal outcomes" aria-describedby="signal-help">${signalKinds.map((kind,i)=>`<button class="signal-tile" tabindex="${i === s.selected ? 0 : -1}" data-signal="${i}" data-kind="${s.revealed ? kind : 'unknown'}" aria-pressed="${s.selected === i && s.revealed}" aria-label="Illustrative case ${i+1}: ${s.revealed ? signalLabels[kind].name : 'reveal outcome'}">${s.revealed ? signalLabels[kind].symbol : '?'}</button>`).join('')}</div><p class="pilot-small" id="signal-help">Select a case to inspect it. On a keyboard, use arrow keys to move between cases.</p><div class="signal-key" id="signal-key" ${s.revealed ? '' : 'hidden'}><span><b>+</b> Caught anomaly</span><span><b>·</b> Calm, no alarm</span><span><b>×</b> Missed anomaly</span></div><div id="evaluation-detail" ${s.revealed ? '' : 'hidden'}><button class="text-button" id="focus-misses" aria-pressed="${s.misses}">Highlight the three misses</button><div class="tile-detail" id="tile-detail"></div><table class="confusion"><caption>The same 50 cases, grouped by outcome</caption><thead><tr><th scope="col">Actual state</th><th scope="col">Alarm</th><th scope="col">No alarm</th></tr></thead><tbody><tr><th scope="row">Anomalous</th><td><strong>23</strong>Caught</td><td class="miss"><strong>3</strong>Missed</td></tr><tr><th scope="row">Calm</th><td><strong>0</strong>False alarms</td><td><strong>24</strong>Correctly ignored</td></tr></tbody></table><dl class="metric-list"><div><dt>Precision</dt><dd>100%</dd></div><div><dt>Recall</dt><dd>88.5%</dd></div><div><dt>F1</dt><dd>93.9%</dd></div></dl><div class="pilot-observation"><p>All three mistakes are missed anomalies. Zero false alarms in this small slice does not establish a zero false-alarm rate in the live stream.</p></div></div></section>`;
}
function updateEvaluation(shouldAnnounce = true) {
  const s = states[1];
  $('reveal-errors').setAttribute('aria-pressed', String(s.revealed));
  $('reveal-errors').textContent = s.revealed ? 'Hide outcomes' : 'Inspect the errors';
  $('signal-key').hidden = $('evaluation-detail').hidden = !s.revealed;
  $('focus-misses').setAttribute('aria-pressed', String(s.misses));
  $('focus-misses').textContent = s.misses ? 'Show all outcomes equally' : 'Highlight the three misses';
  document.querySelectorAll('[data-signal]').forEach((button,i) => {
    const kind = signalKinds[i];
    button.tabIndex = i === s.selected ? 0 : -1;
    button.dataset.kind = s.revealed ? kind : 'unknown';
    button.dataset.dim = String(s.revealed && s.misses && kind !== 'fn');
    button.textContent = s.revealed ? signalLabels[kind].symbol : '?';
    button.setAttribute('aria-pressed', String(s.revealed && s.selected === i));
    button.setAttribute('aria-label', `Illustrative case ${i+1}: ${s.revealed ? signalLabels[kind].name : 'reveal outcome'}`);
  });
  const selected = signalLabels[signalKinds[s.selected]];
  const summary = `Illustrative case ${s.selected+1}. Actual: ${selected.actual}. Prediction: ${selected.predicted}. ${selected.name}.`;
  $('tile-detail').innerHTML = `<p>${escape(summary)}</p>`;
  if (shouldAnnounce) announce(s.revealed ? `23 anomalies caught, 3 missed, 24 calm signals correctly ignored, 0 false alarms. ${summary}` : 'Outcomes hidden. Aggregate accuracy is 94%.');
}

function concept(lesson, s) {
  return `<div class="mission-heading"><h2>${lesson.concept}</h2></div><div class="concept-grid"><div class="mission-workbench pilot-workbench">${context(lesson)}${lessonIndex === 0 ? trainingInstrument(s) : evaluationInstrument(s)}</div><section class="teaching"><div class="teaching-copy">${lesson.explanation}</div>${source(lesson.code)}<div class="teaching-reference pilot-reference">${lesson.references.map(([title,body])=>`<details><summary>${title}</summary>${body}</details>`).join('')}</div></section></div>`;
}
function challenge(lesson, s) {
  if (exerciseError || !exercises[lessonIndex]) return `<h2>Exercise could not load</h2><p>${escape(exerciseError || 'Run build.cjs, then reload this preview.')}</p><button class="primary" id="retry-load">Reload lesson</button>`;
  const exercise = exercises[lessonIndex];
  return `<div class="mission-heading"><h2>${lesson.challengeTitle}</h2></div><p class="challenge-intro">${lesson.challengeIntro}</p><div class="challenge-grid pilot-challenge"><section class="challenge-brief">${context(lesson,true)}<h2>Your task</h2><ol class="task-list">${lesson.tasks.map(task=>`<li>${escape(task)}</li>`).join('')}</ol><details id="exact-contract"><summary>Exact exercise contract</summary>${exercise.instructions.trim().split(/\n\s*\n/).map(p=>`<p>${escape(p)}</p>`).join('')}</details><details><summary>Need a hint?</summary><p>${lesson.hint}</p></details><details class="supplied-setup"><summary>Inspect the supplied data and model</summary><pre tabindex="0" aria-label="JavaScript code" class="pilot-code" translate="no">${escape(exercise.setup)}</pre></details><details class="supplied-setup"><summary>Inspect the run readout</summary><p>This readout runs after your code. The checks verify whether the reported values came from the required procedure.</p><pre tabindex="0" aria-label="JavaScript code" class="pilot-code">${escape(exercise.readout)}</pre></details><p class="pilot-small">The original exercise checks run below. Passing verifies this procedure; it does not certify a deployment decision.</p></section><div class="editor"><div class="code-head"><label for="draft">challenge.js</label><span id="draft-note">${storageAvailable ? 'Draft saved in this tab' : 'Draft kept while this page stays open'}</span></div><textarea id="draft" name="exercise-code" aria-label="Exercise JavaScript" spellcheck="false" autocomplete="off" autocapitalize="off" translate="no">${escape(s.draft)}</textarea><div class="editor-footer"><button class="primary" id="run-checks">Run checks</button><button class="secondary" id="stop-run" hidden>Stop run</button><span class="run-status" id="run-status">Runs locally with TensorFlow.js</span></div><div class="feedback" id="feedback" ${s.result ? '' : 'hidden'}></div></div></div>`;
}
function resultFeedback() {
  const s = states[lessonIndex], el = $('feedback');
  if (!el || !s.result) return;
  const { outcome, submitted } = s.result;
  const stale = submitted !== s.draft;
  const count = outcome.results.filter(result => result.passed).length;
  const allPassed = !outcome.errored && outcome.results.length > 0 && count === outcome.results.length;
  el.hidden = false;
  el.innerHTML = `<p class="run-summary">${stale ? 'Code changed since this run. Run checks again.' : allPassed ? 'This run passed the exercise checks.' : outcome.errored ? 'This run could not complete the checks.' : 'Some checks need another look.'}</p><p class="pilot-small">${count} of ${outcome.results.length} checks passed.${allPassed ? ' This validates the exercise procedure, not deployment readiness.' : ''}</p><ol class="run-results">${outcome.results.map(r=>`<li><span class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'Passed' : 'Needs attention'}:</span> ${escape(r.name.split(' > ').slice(-1)[0])}${r.error ? `<p>${escape(r.error)}</p>` : ''}</li>`).join('')}</ol>${outcome.logs.length ? `<h3>Reported by your code</h3><pre class="run-readout">${escape(outcome.logs.map(l=>l.message).join('\n'))}</pre>` : ''}`;
}
function spawnPreviewWorker(onReplyState) {
  const original = "self.location.origin + '/vendor/tfjs-4.22.0.min.js'";
  if (!WORKER_BODY_STRING.includes(original)) throw new Error('Runner runtime path changed. Refresh the preview adapter.');
  const body = WORKER_BODY_STRING.replace(original, "self.location.origin + '/apps/web/public/vendor/tfjs-4.22.0.min.js'");
  const url = URL.createObjectURL(new Blob([body], { type: 'application/javascript' }));
  const worker = new Worker(url);
  let reply;
  const handle = {
    send: message => worker.postMessage(message),
    onReply: callback => { reply = callback; worker.onmessage = event => { onReplyState(event.data); callback(event.data); }; worker.onerror = event => callback({ ok: false, error: event.message || 'The execution worker stopped unexpectedly.', logs: [] }); },
    terminate: () => { worker.terminate(); URL.revokeObjectURL(url); },
    cancel: () => { if (reply) reply({ ok: false, error: 'Run stopped. Your draft is preserved.', logs: [] }); handle.terminate(); },
  };
  return handle;
}
function stopRun(silent = false) {
  if (!activeRun) return;
  const current = activeRun;
  activeRun = null;
  runSerial++;
  current.cancel();
  if ($('run-checks')) { $('run-checks').disabled = false; $('stop-run').hidden = true; $('run-status').textContent = 'Run stopped. Draft preserved.'; }
  if (!silent) { announce('Run stopped. Your draft is preserved.'); $('run-checks')?.focus(); }
}
async function runChecks() {
  if (activeRun) return;
  const index = lessonIndex, s = states[index], submitted = s.draft, serial = ++runSerial;
  const exercise = exercises[index];
  $('run-checks').disabled = true;
  $('stop-run').hidden = false;
  $('run-status').textContent = 'Loading TensorFlow.js…';
  $('feedback').hidden = true;
  announce('Running your JavaScript against the exercise checks.');
  try {
    const outcome = await parseAndRunTestsWith(async () => {
      activeRun = spawnPreviewWorker(reply => {
        if (serial !== runSerial || index !== lessonIndex || phaseIndex !== 2) return;
        if ('ready' in reply) $('run-status').textContent = 'Checking your code…';
        if ('fit' in reply) $('run-status').textContent = reply.fit ? 'Training the supplied model…' : 'Checking this run…';
      });
      return activeRun;
    }, exercise.setup + submitted + exercise.readout, exercise.testCode, 30000);
    if (serial !== runSerial) return;
    s.result = { outcome, submitted };
    resultFeedback();
    const passed = outcome.results.filter(r=>r.passed).length;
    $('run-status').textContent = 'Run finished';
    announce(`${passed} of ${outcome.results.length} checks passed.${outcome.errored ? ' The run could not complete.' : ''}${s.draft !== submitted ? ' Code changed since this run.' : ''}`);
  } catch (error) {
    if (serial !== runSerial) return;
    s.result = { submitted, outcome: { results: [{ name: 'Code execution', passed: false, error: error.message }], logs: [], errored: true } };
    resultFeedback();
    $('run-status').textContent = 'Run could not finish';
    announce(error.message);
  } finally {
    if (serial === runSerial) { activeRun = null; $('run-checks').disabled = false; $('stop-run').hidden = true; }
  }
}

function recall(lesson, s) {
  const figure = lessonIndex === 0 ? `<figure class="recall-figure"><figcaption>New run: two consecutive windows</figcaption><div class="recall-bars" aria-hidden="true"><div><span>Training</span><div class="recall-bar-track"><i style="--amount:90%"></i></div><div class="recall-bar-track later"><i style="--amount:40%"></i></div></div><div><span>Validation</span><div class="recall-bar-track"><i style="--amount:62%"></i></div><div class="recall-bar-track later"><i style="--amount:84%"></i></div></div></div><p class="pilot-small">Bars share a 0–0.5 loss scale. Upper bar: previous window; lower bar: latest window.</p><table class="recall-table"><thead><tr><th scope="col">Mean loss</th><th scope="col">Previous 10</th><th scope="col">Latest 10</th></tr></thead><tbody><tr><th scope="row">Training</th><td>0.45</td><td>0.20</td></tr><tr><th scope="row">Validation</th><td>0.31</td><td>0.42</td></tr></tbody></table><p class="pilot-small">Each mean summarizes ten epochs. Individual epoch values are not shown.</p></figure>` : `<figure class="recall-figure"><figcaption>New case: 95 calm, 5 anomalous</figcaption><p class="pilot-small">Five actual anomalies. + caught, × missed.</p><div aria-hidden="true"><span>Always calm</span><div class="recall-dots">${Array.from({length:5},()=>'<span>×</span>').join('')}</div><span>Model</span><div class="recall-dots">${Array.from({length:4},()=>'<span class="caught">+</span>').join('')}<span>×</span></div></div><table class="recall-table"><thead><tr><th scope="col">Outcome</th><th scope="col">Always calm</th><th scope="col">Model</th></tr></thead><tbody><tr><th scope="row">Caught anomalies</th><td>0</td><td>4</td></tr><tr><th scope="row">Missed anomalies</th><td>5</td><td>1</td></tr><tr><th scope="row">False alarms</th><td>0</td><td>9</td></tr><tr><th scope="row">Calm, no alarm</th><td>95</td><td>86</td></tr></tbody></table><p class="pilot-small">The baseline was chosen from the training set’s majority class. These are separate illustrative test outcomes.</p></figure>`;
  return `<div class="mission-heading"><h2>Explain a different case</h2></div><div class="recall-grid">${figure}<section class="recall"><h2>What would you conclude?</h2><p>${lesson.recallQuestion}</p><label for="recall-response">Your explanation</label><textarea id="recall-response" placeholder="Write what the evidence shows, and what it leaves open.">${escape(s.recall)}</textarea><p class="pilot-small">Private notes for this preview. This response is not automatically graded.</p><details class="recall-answer" id="recall-answer" ${s.answerOpen ? 'open' : ''}><summary>Compare with a suggested explanation</summary><p>${lesson.recallAnswer}</p></details></section></div><section class="learned"><h3>You can now</h3><p>${lesson.learned}</p><ul>${lesson.recap.map(line=>`<li>${line}</li>`).join('')}</ul></section>`;
}
function epilogue(lesson) {
  return `<section class="epilogue"><div class="scene-heading"><p><span>Int.</span> - ${lesson.location}</p></div><div class="epilogue-scene"><div>${scene(lesson)}<p class="story-label">Fictional mission continuation. Independent of your exercise result.</p></div><div><p>${lesson.endingBefore}</p>${lesson.endingSpeaker ? dialogue(lesson.endingSpeaker) : ''}<div class="epilogue-evidence"><strong>${lesson.evidence}</strong><p>${lesson.evidenceNote}</p></div><p>${lesson.endingAfter}</p></div></div>${lessonIndex === 1 ? '<p class="pilot-boundary">End of the two-lesson pilot. The production course continues with signal processing.</p>' : ''}</section>`;
}
function urlFor(lesson, phase) {
  const url = new URL(location.href);
  url.searchParams.set('lesson', lesson); url.searchParams.set('phase', phase); url.hash = '';
  return url.pathname + url.search;
}
function navigate(lesson, phase) {
  if (lesson === lessonIndex && phase === phaseIndex) return;
  stopRun(true); lessonIndex = lesson; phaseIndex = phase;
  history.pushState(null, '', urlFor(lesson,phase));
  render(); $('lesson-title').focus({ preventScroll: true }); window.scrollTo(0,0);
}
function render() {
  const lesson = lessons[lessonIndex], s = states[lessonIndex];
  const inChrome = phaseIndex > 0 && phaseIndex < 4;
  $('hero-heading').hidden = inChrome; $('chrome-title').hidden = !inChrome;
  $('hero-heading').dataset.phase = phaseIndex;
  $(inChrome ? 'chrome-title' : 'title-slot').append($('lesson-title'));
  $('lesson-title').innerHTML = phaseIndex === 0 ? (lessonIndex === 0 ? 'The <span class="title-accent">Training</span> Loop' : 'Evaluating <span class="title-accent">DEEP SCAN</span>') : escape(lesson.title);
  $('mission-eyebrow').hidden = phaseIndex !== 0;
  $('mission-eyebrow').textContent = `Sector training loop · Mission ${lesson.order} · ${lesson.minutes} min · 1 exercise`;
  $('steps').innerHTML = phases.map((phase,i)=>`<a class="step" href="${urlFor(lessonIndex,i)}" data-lesson="${lessonIndex}" data-phase="${i}" data-filled="${i <= phaseIndex}" ${i === phaseIndex ? 'aria-current="step"' : ''} aria-label="Step ${i+1}: ${phase}"><span class="step-bar" aria-hidden="true"></span><span class="step-label">${phase}</span></a>`).join('');
  $('step-count').textContent = `${phaseIndex+1} / 5 · ${phases[phaseIndex]}`;
  $('lesson-list').innerHTML = lessons.map((item,i)=>`<a href="${urlFor(i,0)}" data-lesson="${i}" data-phase="0" ${i === lessonIndex ? 'aria-current="page"' : ''}>${item.order}. ${item.title}</a>`).join('');
  $('lesson-menu').open = false;
  $('lesson-body').innerHTML = [briefing,concept,challenge,recall,epilogue][phaseIndex](lesson,s);
  $('lesson-select').value = lessonIndex; $('step-select').value = phaseIndex;
  const back = $('back-button'), next = $('next-button');
  back.setAttribute('aria-disabled', String(phaseIndex === 0));
  if (phaseIndex === 0) { back.removeAttribute('href'); back.removeAttribute('data-phase'); back.removeAttribute('data-lesson'); }
  else { back.href = urlFor(lessonIndex,phaseIndex-1); back.dataset.lesson = lessonIndex; back.dataset.phase = phaseIndex-1; }
  if (phaseIndex === 4 && lessonIndex === 1) {
    next.href = '../foundations/index.html'; next.textContent = 'Return to Foundations preview'; delete next.dataset.lesson; delete next.dataset.phase;
  } else {
    const nextLesson = phaseIndex === 4 ? lessonIndex+1 : lessonIndex, nextPhase = phaseIndex === 4 ? 0 : phaseIndex+1;
    next.href = urlFor(nextLesson,nextPhase); next.dataset.lesson = nextLesson; next.dataset.phase = nextPhase;
    next.textContent = phaseIndex === 4 ? 'Continue to Evaluating DEEP SCAN' : `Continue to ${phases[phaseIndex+1]}`;
  }
  if (phaseIndex === 1 && lessonIndex === 1) updateEvaluation(false);
  if (phaseIndex === 2) resultFeedback();
  if ($('recall-answer')) $('recall-answer').addEventListener('toggle', event => { s.answerOpen = event.target.open; });
  document.title = `${lesson.title} / ${phases[phaseIndex]} | Tensorcraft pilot`;
}
function updateTheme() {
  const light = document.documentElement.dataset.scheme === 'light';
  $('theme-toggle').textContent = light ? 'Dark appearance' : 'Light appearance';
  $('theme-toggle').setAttribute('aria-label', `Use ${light ? 'dark' : 'light'} appearance`);
  document.querySelector('meta[name="theme-color"]').content = light ? '#f5f5f2' : '#181818';
}
let reviewOpener;
function openReview(notes) {
  reviewOpener = document.activeElement;
  $('review-title').textContent = notes ? 'Design notes' : 'Preview settings';
  $('settings-panel').hidden = notes; $('notes-panel').hidden = !notes;
  $('lesson-select').value = lessonIndex; $('step-select').value = phaseIndex;
  $('review-dialog').showModal(); $('close-review').focus();
}
$('close-review').addEventListener('click', ()=> $('review-dialog').close());
$('review-dialog').addEventListener('close', ()=> reviewOpener?.focus());
$('open-settings').addEventListener('click', ()=>openReview(false));
$('open-notes').addEventListener('click', ()=>openReview(true));
$('preview-navigation').addEventListener('submit', event=>{
  event.preventDefault(); $('review-dialog').close();
  navigate(Number($('lesson-select').value),Number($('step-select').value));
});
$('theme-toggle').addEventListener('click', ()=> {
  document.documentElement.dataset.scheme = document.documentElement.dataset.scheme === 'light' ? 'dark' : 'light';
  try { sessionStorage.setItem('tensorcraft:pilots:scheme',document.documentElement.dataset.scheme); } catch {}
  updateTheme();
});
document.addEventListener('click', event=>{
  const link = event.target.closest('a[data-phase]');
  if (link && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(Number(link.dataset.lesson),Number(link.dataset.phase)); return; }
  if (event.target.closest('#next-epoch')) { states[0].epoch = Math.min(24,states[0].epoch+1); updateTraining(); }
  if (event.target.closest('#end-trace')) { states[0].epoch = 24; updateTraining(); }
  if (event.target.closest('#reveal-errors')) { states[1].revealed = !states[1].revealed; updateEvaluation(); }
  const tile = event.target.closest('[data-signal]');
  if (tile) { states[1].selected = Number(tile.dataset.signal); states[1].revealed = true; updateEvaluation(); }
  if (event.target.closest('#focus-misses')) { states[1].misses = !states[1].misses; updateEvaluation(); }
  if (event.target.closest('#run-checks')) runChecks();
  if (event.target.closest('#stop-run')) stopRun();
  if (event.target.closest('#retry-load')) location.reload();
});
document.addEventListener('input', event=>{
  if (event.target.id === 'epoch-range') { states[0].epoch = Number(event.target.value); updateTraining(false); }
  if (event.target.id === 'draft') { states[lessonIndex].draft = event.target.value; save(); resultFeedback(); }
  if (event.target.id === 'recall-response') { states[lessonIndex].recall = event.target.value; save(); }
});
document.addEventListener('change', event=>{ if (event.target.id === 'epoch-range') updateTraining(); });
document.addEventListener('keydown', event=>{
  if (event.key === 'Escape') $('lesson-menu').open = false;
  const tile = event.target.closest('[data-signal]');
  if (!tile || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const columns = getComputedStyle(document.querySelector('.signal-board')).gridTemplateColumns.split(' ').length;
  const current = Number(tile.dataset.signal);
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? 49 : Math.max(0,Math.min(49,current + ({ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[event.key])));
  states[1].selected = index;
  updateEvaluation(false);
  document.querySelector(`[data-signal="${index}"]`).focus();
  if (states[1].revealed) announce($('tile-detail').textContent);
});
document.addEventListener('click', event=>{ if (!$('lesson-menu').contains(event.target)) $('lesson-menu').open = false; });
window.addEventListener('popstate', ()=>{ stopRun(true); readLocation(); render(); $('lesson-title').focus({ preventScroll: true }); });
window.addEventListener('pagehide', ()=>stopRun(true));
updateTheme(); render();
