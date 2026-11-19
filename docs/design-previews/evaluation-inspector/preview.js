const $ = (id) => document.getElementById(id);
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reference = await fetch('maintainer-run.json').then((r) => { if (!r.ok) throw new Error('The reference run could not load.'); return r.json(); });
const state = { phase: 'briefing', scenario: 'measured', filter: 'all', selectedId: reference.cases[0].id };
const className = (label) => label === 1 ? 'flagged' : 'calm';
const category = (c) => c.label === 1 ? (c.score > .5 ? 'tp' : 'fn') : (c.score > .5 ? 'fp' : 'tn');
const error = (c) => ['fn','fp'].includes(category(c));
const categoryName = (c) => ({tp:'Caught anomaly',tn:'Correct calm prediction',fp:'False alarm',fn:'Missed anomaly'}[category(c)]);
const sourceName = (c) => c.source === 'story' ? 'Hand-written story case' : 'Generated practice case';
const format = (n) => n.toLocaleString('en-US', {maximumFractionDigits: 6});
function cases() {
  if (state.scenario === 'empty') return [];
  if (state.scenario === 'zero') return reference.cases.map((c) => ({...c, score: c.label === 1 && c.score <= .5 ? .6 + (c.id - 40) * .04 : c.score}));
  if (state.scenario === 'partial') return reference.cases.slice(0,40);
  return reference.cases;
}
function counts(rows = cases()) {
  const result = {tp:0,tn:0,fp:0,fn:0};
  rows.forEach((c) => result[category(c)]++);
  return {...result, correct:result.tp+result.tn, total:rows.length};
}
function matches(c) { return state.filter === 'all' || (state.filter === 'correct' ? !error(c) : category(c) === state.filter); }
function visible() { return cases().filter(matches); }
function announce(text) { $('announcement').textContent = text; }
const scene = () => `<figure class="scene"><img src="../../../apps/web/public/scenes/deep-orbit/training-loop/evaluating-deep-scan.webp" alt="Mirza stands at the Archimedes command tier beside the crew's evaluation display." width="1536" height="1024"><figcaption>Archimedes bridge. The crew reviews the classifier before a supervised prototype test.</figcaption></figure>`;
const dialogue = (who, portrait, text) => `<div data-dialogue data-layout="speech"><div data-dialogue-header><img data-dialogue-avatar src="../../../apps/web/public/characters/deep-orbit/${portrait}.webp" alt="" width="64" height="64"><span data-dialogue-speaker>${who}</span></div><div data-dialogue-text><p>${text}</p></div></div>`;
const mirza = () => dialogue('Commander Mirza','commander-mirza-resolved','Run the evaluation suite. I want real numbers on signals the network has never seen.');
const action = (label,phase) => `<div class="actions"><button class="primary" data-open-phase="${phase}">${label}</button></div>`;

function renderPhase() {
  document.querySelectorAll('[data-phase]').forEach((button) => {
    if (button.dataset.phase === state.phase) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
  });
  const body = $('phase-body');
  if (state.phase === 'briefing') body.innerHTML = `${scene()}<p data-story-passage>Training is complete. Mirza wants results on separate readings before allowing a supervised prototype test. A fleet release still needs the runtime and release checks in later modules.</p>${mirza()}<h2>The evidence for Mirza's review</h2><p>Inspect what the classifier missed and explain what the crew should investigate next.</p><p class="source-note">This prototype uses a recorded maintainer run of the current exercise. The model has three features and 673 parameters. It is separate from the earlier eight-feature practice network.</p>${action('Inspect the recorded example','challenge')}`;
  if (state.phase === 'concept') body.innerHTML = `${mirza()}<h2>The mistakes behind the score</h2><p>A missed anomaly and a false alarm have different costs. Inspect these alongside accuracy and individual errors.</p><div class="context-copy"><p>The challenge supplies 100 synthetic training rows and 43 evaluation rows: 40 generated examples and three hand-written story cases.</p><p>Keep those evaluation rows and labels out of training. Their scores describe this fixture. Evaluating a live spacecraft system would require representative measurements.</p></div><p class="source-note">Selected current lesson passages. The production lesson's separate twelve-case threshold experiment remains unchanged and is outside this preview.</p>${action('Inspect the recorded example','challenge')}`;
  if (state.phase === 'challenge') {
    body.innerHTML = `${mirza()}<div class="context-copy"><h2>The evaluation record</h2><p>Which cases did this classifier miss, and what should the crew investigate next?</p><p class="source-note">The exercise creates a separate three-feature model. The inspector below shows one recorded maintainer run. It is available before saving.</p></div><section id="inspector" aria-label="Evaluation run inspector"></section><section class="investigation"><h2>The next investigation</h2><p>Which result would you ask the crew to investigate next, and what further evidence would help?</p><p class="source-note">Optional reflection. This response does not change the score or earn completion credit.</p><details><summary>Questions to guide your investigation</summary><p>Check which labels disagree with the predictions. Consider the supplied inputs and which kinds of cases training covered. The error alone cannot identify its cause. Compare proposed changes on separate validation data, then reserve fresh test evidence for the final check.</p></details></section><p class="source-note">The existing validation-cost decision and independent build-triage assignment follow this work in the course. They use separate data and are outside this prototype.</p>${action('Continue to takeaways','takeaways')}`;
    body.insertAdjacentHTML('afterbegin',scene());
    body.querySelector('.context-copy .source-note').textContent = 'This exercise uses a separate three-feature model. Inspect the result before saving it.';
    body.querySelector('.investigation .source-note').textContent = 'Optional, ungraded reflection.';
    renderInspector();
  }
  if (state.phase === 'takeaways') body.innerHTML = `<h2>What the result supports</h2><p>Overall accuracy can hide important mistakes. Check individual errors before deciding what to investigate.</p><div class="recall-grid"><h3>Explain the limit</h3><p class="reading">What would you investigate before treating a 95% training versus 60% test accuracy gap as overfitting?</p><details><summary>Compare with the lesson's explanation</summary><p>The model may have memorized details of the training set. Different data, wrong labels, or different preprocessing can also cause the gap. Check those first. Use validation data to compare possible fixes.</p></details></div><p class="source-note">A selected current recall prompt, with an ungraded explanation reveal for this layout review. Production recall grading remains outside the prototype.</p>${action('Continue to the epilogue','epilogue')}`;
  if (state.phase === 'epilogue') body.innerHTML = `${scene()}<p class="source-note">Fictional crew result. The following 94% and 0.518 belong to the authored story and are separate from the recorded example.</p><p data-story-passage>After Mirza allows the supervised prototype test, Farah stays on the quiet bridge. Signal 3 scored 0.518, between the crew's cutoffs for dismissing a reading and raising an alert. The network scored 94% on the small test set, but it has not settled this case.</p><p data-story-passage>She looks up the reading in the archive: sample 7741 again. Her pencil note still says to check the sensors and their calibration first. The new score has brought her back to the same reading without explaining it.</p>${dialogue('Dr. Farah','dr-farah',"Ninety-four percent accurate, and the one reading it can't decide on is the one I couldn't explain by hand. What are you?")}${action('Return to the evaluation record','challenge')}`;
  body.querySelectorAll('[data-open-phase]').forEach((button) => button.addEventListener('click',() => navigate(button.dataset.openPhase)));
}
function navigate(phase) {
  state.phase = phase;
  renderPhase();
  $('phase-body').focus({preventScroll:true});
  $('phase-body').scrollIntoView({behavior:'instant',block:'start'});
}
function scenarioNotice() {
  return {
    measured:'',
    empty:'No run is available in this preview state. Open the recorded example to inspect the proposed result.',
    zero:'Synthetic layout fixture. The three missed-case scores were changed for a zero-error display check. These are not model measurements.',
    partial:'Synthetic incomplete-state fixture. Three case records were removed for this display check. A whole-run accuracy cannot be verified from these 40 rows.',
    stale:'Edited-code state preview. These measurements belong to the previously captured source. Changed code needs a new run.',
    failed:'Failed-rerun state preview. The simulated new run produced no output. The earlier maintainer record remains available below.',
  }[state.scenario];
}
function renderInspector() {
  const rows = cases(), n = counts(rows);
  const synthetic = ['zero','partial'].includes(state.scenario);
  const origin = synthetic ? 'Synthetic display fixture. For visual state checks only.' : 'Recorded maintainer run on 43 supplied practice cases.';
  const notice = scenarioNotice();
  const section = $('inspector');
  if (!rows.length) {
    section.innerHTML = `<div class="empty"><h3>No evaluation run yet</h3><p id="run-origin">Empty-state preview. No measurements are available.</p><p id="state-notice" role="status">${notice}</p><button class="primary" id="load-reference">Open recorded example</button></div>`;
    $('load-reference').onclick = () => setScenario('measured');
    return;
  }
  section.innerHTML = `<div class="inspector-heading"><h3>The cases behind this score</h3><p id="run-origin">${origin}</p><p class="result-line">${state.scenario === 'partial' ? `<strong>${n.correct} correct in ${n.total} available cases.</strong> Three cases are missing.` : `<strong>${n.correct} of ${n.total} correct (${(n.correct/n.total*100).toFixed(1)}%).</strong> ${n.fn} missed ${n.fn===1?'anomaly':'anomalies'}. ${n.fp} false alarms.`}</p></div><p id="state-notice" role="status" ${notice?'':'hidden'}>${notice}</p><figure aria-labelledby="plot-title" aria-describedby="plot-description"><div class="plot-header"><p id="plot-title">Scores from the captured run</p><p>Flag when score &gt; 0.5</p></div><div class="plot-key"><span><i class="key-circle" aria-hidden="true"></i>Generated case</span><span><i class="key-square" aria-hidden="true"></i>Hand-written case</span><span><i class="key-error" aria-hidden="true"></i>Incorrect prediction</span></div><div id="plot-host"></div><figcaption id="plot-description">Each point is one case. Left of the fixed boundary predicts calm. A score above 0.5 predicts flagged. The two lanes show the supplied labels.</figcaption></figure><div class="filters" role="group" aria-label="Cases to inspect"><button id="filter-all" data-filter="all">All ${n.total} cases</button><button id="filter-fn" data-filter="fn">Missed anomalies ${n.fn}</button><button id="filter-fp" data-filter="fp">False alarms ${n.fp}</button><button id="filter-correct" data-filter="correct">Correct ${n.correct}</button></div><p id="chart-status" role="status" aria-live="polite"></p><div class="case-controls"><label class="case-field" for="case-select">Case to inspect<select id="case-select"></select></label><button id="previous-case">Previous case</button><button id="next-case">Next case</button></div><div id="case-detail"></div><details class="result-details"><summary>Captured values and run details</summary><div><p>${synthetic?'Synthetic display values.':`The final training epoch logged ${(reference.train.accuracy*100).toFixed(1)}% accuracy. The separate held-out evaluation measured ${(reference.test.accuracy*100).toFixed(1)}%.`} ${state.scenario==='partial'?'The missing rows prevent a whole-run comparison.':`The recorded gap label is ${escape(reference.verdict)}. This label does not approve deployment.`}</p><p class="source-note">100 training rows. Model layers: 32, 16, and 1 units. The three displayed inputs are dimensionless practice features in their supplied order. Their values do not explain why the model assigned a score.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Captured case values"><table><caption>${synthetic?'Synthetic display cases':'All captured evaluation cases'}</caption><thead><tr><th scope="col">Case</th><th scope="col">Source</th><th scope="col">Feature 1</th><th scope="col">Feature 2</th><th scope="col">Feature 3</th><th scope="col">Label</th><th scope="col">Score</th><th scope="col">Outcome</th></tr></thead><tbody>${rows.map((c)=>`<tr><th scope="row">${c.id}</th><td>${sourceName(c)}</td>${c.features.map((v)=>`<td>${format(v)}</td>`).join('')}<td>${className(c.label)}</td><td>${format(c.score)}</td><td>${categoryName(c)}</td></tr>`).join('')}</tbody></table></div></div></details><div class="actions"><button id="save-run">Save preview run</button><button id="download-run">Download displayed record</button></div><p id="save-status" class="source-note" role="status">Saving this example only keeps a preview record in this browser tab. Production storage is unchanged.</p>`;
  // Keep the action ahead of the plot so its visual response follows it.
  const figure = section.querySelector('figure');
  section.insertBefore(section.querySelector('.filters'), figure);
  section.insertBefore($('chart-status'), figure);
  $('plot-description').textContent = 'Each point is one case. Points stack to stay visible. Only horizontal position shows score. The two lanes show the supplied labels.';
  section.querySelector('.result-details > div').insertAdjacentHTML('beforeend','<p class="source-note">Reference runtime: TensorFlow.js 4.22.0 on CPU. The reference uses the current authored solution. A fresh run can produce different scores.</p>');
  section.querySelectorAll('[data-filter]').forEach((button) => button.onclick = () => {
    state.filter = button.dataset.filter;
    updateInspection(true);
  });
  $('case-select').onchange = (event) => { state.selectedId = Number(event.target.value); updateInspection(false); };
  $('previous-case').onclick = () => step(-1);
  $('next-case').onclick = () => step(1);
  $('save-run').onclick = () => {
    try { sessionStorage.setItem('tc:evaluation-visual-preview',JSON.stringify(displayRecord())); $('save-status').textContent = 'Preview record saved in this tab. No course progress changed.'; $('save-run').textContent='Preview run saved'; }
    catch { $('save-status').textContent = 'The preview record could not be saved. Download the displayed record to keep a copy.'; }
  };
  $('download-run').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(displayRecord(),null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='tensorcraft-evaluation-preview.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  updateInspection(true);
}
function displayRecord() { return {origin:['zero','partial'].includes(state.scenario)?'synthetic visual state fixture':reference.origin,scenario:state.scenario,threshold:.5,operator:'>',cases:cases(),counts:counts(),referenceCapturedAt:reference.capturedAt}; }
function step(delta) {
  const items = visible();
  const index = items.findIndex((c)=>c.id===state.selectedId);
  state.selectedId = items[Math.max(0,Math.min(items.length-1,index+delta))]?.id ?? null;
  updateInspection(false);
}
function updateInspection(rebuildOptions) {
  const items = visible();
  if (!items.some((c)=>c.id===state.selectedId)) state.selectedId=items[0]?.id ?? null;
  const current = items.find((c)=>c.id===state.selectedId);
  document.querySelectorAll('[data-filter]').forEach((b)=>b.setAttribute('aria-pressed',String(b.dataset.filter===state.filter)));
  if (rebuildOptions) $('case-select').innerHTML = items.length ? items.map((c)=>`<option value="${c.id}">Case ${c.id} (${c.source==='story'?'story':'generated'})</option>`).join('') : '<option>No matching cases</option>';
  $('case-select').disabled = !items.length;
  if (current) $('case-select').value=String(current.id);
  const index = items.findIndex((c)=>c.id===state.selectedId);
  $('previous-case').disabled = index<=0;
  $('next-case').disabled = index<0 || index===items.length-1;
  const emptyCategory = state.filter === 'fp' ? 'No false alarms' : state.filter==='fn' ? 'No missed anomalies' : 'No matching cases';
  $('chart-status').textContent = items.length ? `${items.length} of ${cases().length} available cases highlighted. Inspecting case ${current.id}.` : `${emptyCategory} in these ${cases().length} available cases. The full distribution remains visible.`;
  $('case-detail').innerHTML = current ? `<div class="case-title"><h3>Case ${current.id}</h3><p>${sourceName(current)}</p></div><p class="outcome" data-error="${error(current)}">${categoryName(current)}</p><p class="case-explanation">The model scored this case <strong>${format(current.score)}</strong>. ${current.score>.5?'That is above 0.5, so the rule predicts flagged.':'That is at or below 0.5, so the rule predicts calm.'} The supplied label is <strong>${className(current.label)}</strong>.</p><p class="feature-title">The three supplied inputs</p><div class="features">${current.features.map((v,i)=>`<div class="feature"><span>Practice feature ${i+1}</span><div class="track" aria-hidden="true"><span style="width:${v*100}%"></span></div><output>${v.toFixed(3)}</output></div>`).join('')}</div><p class="source-note">Feature order matches the fixture. Values use a dimensionless 0 to 1 scale. The inputs alone do not establish the cause of this prediction.</p>` : `<p class="case-explanation">${emptyCategory} in this selection. Choose another category to inspect a case.</p>`;
  drawPlot();
}
function drawPlot() {
  if (!$('plot-host')) return;
  const width = Math.max(220,Math.round($('plot-host').getBoundingClientRect().width));
  const pad = 16, span=width-pad*2;
  const x=(score)=>pad+score*span;
  let y=22;
  const lanes=[];
  const marks=[];
  for (const label of [0,1]) {
    const laneRows=cases().filter((c)=>c.label===label).sort((a,b)=>a.score-b.score || a.id-b.id);
    const levels=[];
    const positioned=laneRows.map((c)=>{
      let level=0;
      while (levels[level]?.some((other)=>Math.abs(other-x(c.score))<10)) level++;
      (levels[level]??=[]).push(x(c.score));
      return {c,level};
    });
    const laneHeight=Math.max(60,levels.length*10+24);
    lanes.push(`<text x="${pad}" y="${y}" class="lane-label">Supplied ${className(label)} (${laneRows.length})</text><rect class="lane-surface" x="0" y="${y+14}" width="${width}" height="${laneHeight}" rx="3"/>`);
    positioned.forEach(({c,level})=>{
      const cy=y+32+level*10;
      const selected=c.id===state.selectedId;
      const shape=c.source==='story'?`<rect x="${x(c.score)-4}" y="${cy-4}" width="8" height="8" class="plot-point ${error(c)?'plot-error':''}"/>`:`<circle cx="${x(c.score)}" cy="${cy}" r="4" class="plot-point ${error(c)?'plot-error':''}"/>`;
      marks.push(`<g data-case-id="${c.id}" role="button" tabindex="-1" aria-label="Case ${c.id}, ${categoryName(c)}, score ${format(c.score)}" class="${matches(c)?'':'point-muted'}"><title>Case ${c.id}: ${categoryName(c)}</title>${shape}${selected?`<circle cx="${x(c.score)}" cy="${cy}" r="10" class="selection"/>`:''}</g>`);
    });
    y+=laneHeight+66;
  }
  const axisY=y-18;
  const ticks=[0,.25,.5,.75,1].map((v)=>`<text x="${x(v)}" y="${axisY+25}" text-anchor="${v===0?'start':v===1?'end':'middle'}">${v}</text>`).join('');
  const grid=[0,.25,.75,1].map((v)=>`<line class="plot-grid" x1="${x(v)}" y1="36" x2="${x(v)}" y2="${axisY}"/>`).join('');
  $('plot-host').innerHTML=`<svg id="score-plot" viewBox="0 0 ${width} ${axisY+65}" role="group" aria-label="Captured scores by supplied class"><title>Captured scores by supplied class</title>${lanes.join('')}${grid}<line class="plot-rule" x1="${x(.5)}" y1="36" x2="${x(.5)}" y2="${axisY}"/>${marks.join('')}${ticks}<text x="${width/2}" y="${axisY+55}" text-anchor="middle">Model score</text></svg>`;
  $('score-plot').querySelectorAll('[data-case-id]').forEach((point)=>point.onclick=()=>{
    const target=cases().find((c)=>c.id===Number(point.dataset.caseId));
    if (!target) return;
    if (!matches(target)) state.filter='all';
    state.selectedId=target.id; updateInspection(true);
  });
}
function setScenario(scenario) {
  state.scenario=scenario; state.filter='all'; state.selectedId=cases()[0]?.id ?? null;
  $('preview-state').value=scenario;
  if(state.phase!=='challenge') navigate('challenge'); else renderInspector();
}
document.querySelectorAll('[data-phase]').forEach((button)=>button.onclick=()=>navigate(button.dataset.phase));
$('preview-state').onchange=(event)=>setScenario(event.target.value);
$('scheme-toggle').onclick=()=>{
  const light=document.documentElement.dataset.scheme!=='light';
  document.documentElement.dataset.scheme=light?'light':'dark';
  $('scheme-toggle').textContent=light?'Dark appearance':'Light appearance';
};
new ResizeObserver(()=>drawPlot()).observe($('phase-body'));
window.tcEvaluationPreview={getState:()=>({...state,cases:cases(),counts:counts()}),setScenario};
renderPhase();
