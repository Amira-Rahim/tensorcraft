const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const root = path.resolve(__dirname, '../../..');
const store = path.join(root, 'node_modules/.pnpm');
const yamlPath = fs.readdirSync(store).find(name => name.startsWith('yaml@'));
const yaml = require(path.join(store, yamlPath, 'node_modules/yaml'));
const base = process.env.DEEP_ORBIT_PILOT_URL || 'http://127.0.0.1:8767/docs/design-previews/deep-orbit-pilots/index.html';
const screenshots = path.join(__dirname, 'screenshots');
const report = { date: '2026-10-06', scope: 'Two local visual pilots; production is unchanged', views: 0, accessibility: [], interactions: [], runner: [], pageErrors: [], limits: ['No participant sessions have been conducted.', 'Automated accessibility scans do not replace assistive technology testing.', 'Production routes, paid access, progress, decisions and transfer assignment integration are outside this pilot.'] };
const exercises = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises.json')));
const sources = exercises.map(e => {
  const raw = fs.readFileSync(path.join(root, `packages/content/content/deep-orbit/training-loop/exercises/${e.slug}.yaml`), 'utf8');
  assert.equal(e.sourceHash, crypto.createHash('sha256').update(raw).digest('hex'), 'Run build.cjs: source exercise changed');
  const source = yaml.parse(raw);
  assert.equal(e.testCode,source.testCode);
  assert.equal(e.setup + e.starter,source.starterCode);
  return source;
});

(async()=>{
  fs.mkdirSync(screenshots,{recursive:true});
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const page = await context.newPage();
    page.on('pageerror',error=>report.pageErrors.push(error.message));
    const visit = async (lesson,phase) => {
      await page.goto(`${base}?lesson=${lesson}&phase=${phase}`);
      await page.waitForFunction(()=>document.getElementById('lesson-title').textContent.length>0);
      await page.evaluate(()=>document.fonts.ready);
    };
    const scheme = async wanted => {
      if (await page.locator('html').getAttribute('data-scheme') !== wanted) await page.locator('#theme-toggle').click();
    };
    const scan = async label => {
      const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      report.accessibility.push({label,violations:result.violations});
      assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);
    };
    for (const width of [1440,1024,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const appearance of ['dark','light']) {
        for(let lesson=0;lesson<2;lesson++) for(let phase=0;phase<5;phase++) {
          await visit(lesson,phase); await scheme(appearance);
          if(phase===1) {
            if(lesson===0) await page.locator('#end-trace').click();
            else await page.locator('#reveal-errors').click();
          }
          const layout=await page.evaluate(()=>({
            overflow: document.documentElement.scrollWidth>innerWidth+1,
            headings: document.querySelectorAll('h1').length,
            missing: [...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),
            headerSize: getComputedStyle(document.querySelector('h1')).fontSize,
            sceneTop: document.querySelector('.scene')?.getBoundingClientRect().top,
            steps: document.querySelectorAll('.step').length,
          }));
          assert.equal(layout.overflow,false,`${width} ${appearance} ${lesson}/${phase} overflow`);
          assert.equal(layout.headings,1); assert.deepEqual(layout.missing,[]); assert.equal(layout.steps,5);
          if(phase===0) {
            assert.equal(layout.headerSize,width>=1024?'60px':'36px');
            if(width===1440)assert(layout.sceneTop<365,'Preserve the opening scene position');
          }
          if(lesson===0&&phase===1&&width<=390) {
            const renderedLabelSize=await page.locator('.plot text').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)*el.closest('svg').getBoundingClientRect().width/540);
            assert(renderedLabelSize>=11,'Phone chart labels must remain readable after SVG scaling');
          }
          report.views++;
          if(width===1440||width===390) await scan(`${width} ${appearance} ${lesson}/${phase}`);
          const prefix=lesson===0?'training':'evaluation';
          const name=['briefing','concept','challenge','takeaways','epilogue'][phase];
          if((width===1440&&appearance==='dark')||(width===390&&appearance==='dark'&&[0,1,2,4].includes(phase))||(width===1440&&appearance==='light'&&phase===1)) {
            await page.screenshot({path:path.join(screenshots,`${prefix}-${name}-${width===390?'phone':'desktop'}${appearance==='light'?'-light':''}.png`),fullPage:true});
          }
        }
      }
    }
    console.log(`${report.views} responsive views and ${report.accessibility.length} accessibility scans passed`);
    await page.setViewportSize({width:1440,height:1000});
    await visit(0,1); await scheme('dark');
    await page.locator('.teaching-reference details').first().locator('summary').click();
    await page.locator('#epoch-range').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#epoch-range').inputValue(),'24');
    assert.equal(await page.locator('#train-value').textContent(),'0.14');
    assert.equal(await page.locator('#val-value').textContent(),'0.25');
    assert.equal(await page.locator('.patience-marks .spent').count(),5);
    assert.match(await page.locator('#training-observation').textContent(),/would stop here/);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'epoch-range');
    assert.equal(await page.locator('.teaching-reference details').first().getAttribute('open'),'');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('.patience-marks .spent').count(),4);
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#epoch-range').inputValue(),'1');
    report.interactions.push('Training slider is keyboard operable, preserves focus/reference state, and follows the shared-axis trace and five-epoch stopping rule.');
    await page.locator('#next-epoch').click();
    assert.equal(await page.locator('#epoch-range').inputValue(),'2');
    report.interactions.push('Next epoch and end-of-trace controls update the same timeline.');
    await visit(1,1);
    await page.locator('#reveal-errors').click();
    assert.equal(await page.locator('[data-kind="tp"]').count(),23);
    assert.equal(await page.locator('[data-kind="tn"]').count(),24);
    assert.equal(await page.locator('[data-kind="fn"]').count(),3);
    await page.locator('[data-signal="31"]').click();
    assert.match(await page.locator('#tile-detail').textContent(),/Actual: Anomalous. Prediction: No alarm/);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.signal),'31');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.signal),'32');
    assert.equal(await page.locator('.signal-tile[tabindex="0"]').count(),1);
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.signal),'49');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'focus-misses');
    await page.locator('#focus-misses').click();
    assert.equal(await page.locator('[data-dim="true"]').count(),47);
    await scan('highlighted evaluation misses');
    await page.locator('#reveal-errors').click();
    assert.equal(await page.locator('#evaluation-detail').isVisible(),false);
    report.interactions.push('All 50 outcomes reconcile with the 23/24/3/0 matrix; selecting, highlighting and hiding retain usable controls.');
    await page.locator('.step').nth(3).click();
    await page.locator('#recall-response').fill('The baseline catches none. I need error costs and a representative test slice.');
    assert.equal(await page.locator('#recall-answer').getAttribute('open'),null);
    await page.locator('#recall-answer summary').click();
    assert.equal(await page.locator('#recall-answer').getAttribute('open'),'');
    await page.locator('#next-button').click(); await page.goBack();
    assert.equal(await page.locator('#recall-answer').getAttribute('open'),'');
    assert.match(await page.locator('#recall-response').inputValue(),/baseline catches none/);
    await page.reload(); await page.locator('#recall-response').waitFor();
    assert.match(await page.locator('#recall-response').inputValue(),/baseline catches none/);
    assert.equal(await page.locator('.dialogue').count(),0);
    report.interactions.push('Recall notes survive navigation and reload; answer reveal is explicit and Takeaways contain no new story.');
    await visit(0,0);
    await page.keyboard.press('Tab');
    // Explicitly focus the first link after navigating, independent of platform autofocus.
    await page.locator('.skip-link').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'lesson-main');
    await page.locator('.step').nth(1).click(); await page.locator('.step').nth(2).click();
    await page.goBack(); assert.match(await page.title(),/Concept/);
    await page.goForward(); assert.match(await page.title(),/Challenge/);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'lesson-title');
    report.interactions.push('Skip link, semantic step links, history and heading focus work.');
    await page.locator('#lesson-menu summary').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lesson-menu').getAttribute('open'),null);
    report.interactions.push('Lesson menu supports Escape without navigating.');
    for(const width of [1440,390,320]) for(const appearance of ['dark','light']) {
      await page.setViewportSize({width,height:900}); await scheme(appearance);
      for(const kind of ['settings','notes']) {
        await page.locator(`#open-${kind}`).click();
        assert.equal(await page.locator('#review-dialog').evaluate(e=>e.open),true);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'close-review');
        const bounds=await page.locator('#review-dialog').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
        assert(bounds.scroll<=bounds.client+1);
        if(kind==='settings') {
          assert.equal(await page.locator('#lesson-select').evaluate(e=>getComputedStyle(e).paddingRight),'44px');
          assert.equal(await page.locator('.review-select svg').first().evaluate(e=>getComputedStyle(e).right),'16px');
        }
        await scan(`${width} ${appearance} review ${kind}`);
        if(width===390&&appearance==='dark')await page.screenshot({path:path.join(screenshots,`review-${kind}-phone.png`),fullPage:false});
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(()=>document.activeElement.id),`open-${kind}`);
      }
    }
    report.interactions.push('Review drawers fit desktop and phone in both themes, preserve select padding, trap native dialog focus and restore the opener.');
    await page.emulateMedia({reducedMotion:'reduce'});
    await visit(0,1);
    await page.locator('#end-trace').click();
    assert.equal(await page.locator('#epoch-range').inputValue(),'24');
    assert.equal(await page.locator('#next-epoch').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    report.interactions.push('Reduced motion keeps all teaching states available without an autoplay dependency.');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:1440,height:1000});
    for(let lesson=0;lesson<2;lesson++) {
      await visit(lesson,2);
      await page.locator('#draft').fill(exercises[lesson].starter);
      await page.locator('#run-checks').click();
      await page.waitForFunction(()=>!document.getElementById('run-checks').disabled,{},{timeout:45000});
      assert.equal(await page.locator('#feedback .fail').count()>0,true);
      assert.equal(await page.locator('#draft').inputValue(),exercises[lesson].starter);
      report.runner.push({lesson:exercises[lesson].slug,case:'canonical starter rejected',passed:true});
      const marker=lesson===0?'function makeEarlyStopping()':'const history = await';
      const solution=sources[lesson].solutionCode.slice(sources[lesson].solutionCode.indexOf(marker));
      await page.locator('#draft').fill(solution);
      await page.locator('#run-checks').click();
      await page.waitForFunction(()=>!document.getElementById('run-checks').disabled,{},{timeout:45000});
      const failure=await page.locator('#feedback .fail').count();
      assert.equal(failure,0,await page.locator('#feedback').textContent());
      const passed=await page.locator('#feedback .pass').count();
      assert(passed>0);
      assert.match(await page.locator('.run-readout').textContent(),lesson===0?/Epochs recorded:/:/Test accuracy:/);
      report.runner.push({lesson:exercises[lesson].slug,case:'canonical solution passes unchanged exercise checks in browser worker',checks:passed,passed:true});
      await page.locator('#draft').fill(solution+'\n// changed draft');
      assert.match(await page.locator('.run-summary').textContent(),/Code changed/);
      await page.reload(); await page.locator('#draft').waitFor();
      assert.match(await page.locator('#draft').inputValue(),/changed draft/);
      console.log(`${exercises[lesson].slug}: starter rejected; solution passed ${passed} checks`);
    }
    report.interactions.push('Real runner rejects untouched starters and passes canonical solutions; edits mark old results stale and drafts survive reload.');
    await page.locator('#draft').fill('const broken = ;');
    await page.locator('#run-checks').click();
    await page.waitForFunction(()=>!document.getElementById('run-checks').disabled);
    assert.match(await page.locator('#feedback').textContent(),/syntax|Syntax/);
    report.runner.push({case:'syntax error is reported as an uncompleted run',passed:true});
    await page.locator('#draft').fill('while (true) {}');
    await page.locator('#run-checks').click();
    await page.locator('#stop-run').click();
    assert.equal(await page.locator('#run-checks').isEnabled(),true);
    assert.equal(await page.locator('#draft').inputValue(),'while (true) {}');
    report.runner.push({case:'stop terminates worker and preserves draft',passed:true});
    await page.locator('#run-checks').click();
    await page.locator('.step').nth(1).click();
    await page.locator('.step').nth(2).click();
    assert.equal(await page.locator('#run-checks').isEnabled(),true);
    assert.equal(await page.locator('#stop-run').isVisible(),false);
    report.runner.push({case:'leaving Challenge cancels execution without leaking results into another step',passed:true});
    // Perturb procedure without setting an accuracy target: train on held-out rows.
    const evalSolution=sources[1].solutionCode.slice(sources[1].solutionCode.indexOf('const history = await'));
    await page.locator('#draft').fill(evalSolution.replace('model.fit(trainX, trainY,','model.fit(testX, testY,'));
    await page.locator('#run-checks').click();
    await page.waitForFunction(()=>!document.getElementById('run-checks').disabled,{},{timeout:45000});
    assert(await page.locator('#feedback .fail').count()>0);
    report.runner.push({case:'training on held-out rows is rejected by original provenance checks',passed:true});
    await scan('actual failing exercise feedback');
    await page.screenshot({path:path.join(screenshots,'evaluation-challenge-feedback-desktop.png'),fullPage:true});
    // Session state is intentionally tab-scoped; no course credentials or progress writes.
    await page.evaluate(()=>sessionStorage.removeItem('tensorcraft:pilots:drafts:v1'));
    assert.deepEqual(report.pageErrors,[]);
    fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`${report.interactions.length} interaction checks; ${report.runner.length} real-runner scenarios; ${report.accessibility.length} accessibility scans passed`);
  } catch(error) {
    fs.writeFileSync(path.join(__dirname,'verification.failed.json'),JSON.stringify(report,null,2)+'\n');
    throw error;
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
