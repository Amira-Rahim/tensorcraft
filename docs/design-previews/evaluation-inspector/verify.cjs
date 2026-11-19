// Local prototype verification. This does not exercise production routes or
// establish learner understanding. Run after starting the local preview server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const base = process.env.TC_EVALUATION_PREVIEW_URL ||
  'http://127.0.0.1:8768/docs/design-previews/evaluation-inspector/index.html';
const screenshots = path.join(__dirname, 'screenshots');
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'maintainer-run.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const report = {
  checkedAt: new Date().toISOString(),
  status: 'running',
  scope: 'Local evaluation-inspector prototype with selected current lesson passages',
  referenceRun: { capturedAt: source.capturedAt, runtimeVersion: source.runtimeVersion,
    sourceHashes: source.sourceHashes },
  sourceFiles: {},
  views: [],
  checks: [],
  accessibility: [],
  screenshots: [],
  pageErrors: [],
  failedRequests: [],
  limits: [
    'This is a local prototype, not an authenticated production lesson integration.',
    'The maintainer reference is actual captured output. Alternative state examples are synthetic.',
    'Browser checks and screenshots do not establish learning effectiveness.',
    'Automated accessibility checks do not replace assistive-technology observation.',
    'Production grading, ownership, persistence and account access are outside this preview.',
  ],
};

async function check(name, action) {
  try {
    await action();
    report.checks.push({ name, passed: true });
  } catch (error) {
    report.checks.push({ name, passed: false, error: error.message });
    throw error;
  }
}

(async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  for (const file of ['index.html', 'preview.css', 'preview.js', 'maintainer-run.json']) {
    const location = path.join(__dirname, file);
    if (fs.existsSync(location)) report.sourceFiles[file] = hash(fs.readFileSync(location));
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce', colorScheme: 'dark', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(),
    error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() >= 400)
      report.failedRequests.push({ url: response.url(), status: response.status() });
  });

  const phase = async name => {
    await page.locator(`button[data-phase="${name}"]`).click();
    await page.locator('#phase-body').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
  };
  const scheme = async wanted => {
    if (await page.locator('html').getAttribute('data-scheme') !== wanted)
      await page.locator('#scheme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-scheme'), wanted);
  };
  const scenario = async wanted => {
    const settings = page.locator('#preview-settings');
    if (!(await settings.getAttribute('open'))) {
      // An open boolean attribute can be an empty string.
      if (!(await settings.evaluate(el => el.open))) await settings.locator('summary').click();
    }
    await page.locator('#preview-state').selectOption(wanted);
    if (await settings.evaluate(el => el.open)) await settings.locator('summary').click();
  };
  const snapshot = async name => {
    await page.screenshot({ path: path.join(screenshots, `${name}.png`), fullPage: true });
    report.screenshots.push(`${name}.png`);
  };
  const inspectorSnapshot = async name => {
    await page.locator('#inspector').screenshot({ path: path.join(screenshots, `${name}.png`) });
    report.screenshots.push(`${name}.png`);
  };
  const scan = async label => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const violations = results.violations.map(item => ({ id: item.id,
      impact: item.impact, description: item.description,
      targets: item.nodes.map(node => node.target) }));
    report.accessibility.push({ label, violations });
    assert.deepEqual(violations, [], `Accessibility scan: ${label}`);
  };
  const inspectLayout = async label => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.complete ? null :
        new Promise(resolve => { image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true }); })));
    });
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      headingCount: document.querySelectorAll('h1').length,
      missingImages: [...document.images].filter(image => !image.complete || image.naturalWidth === 0)
        .map(image => image.getAttribute('src')),
      interLoaded: document.fonts.check('18px Inter'),
      visiblePhases: [...document.querySelectorAll('button[data-phase]')]
        .filter(button => button.getBoundingClientRect().width > 0).length,
      navigationTextFits: [...document.querySelectorAll('button[data-phase]')].every(button => {
        const range = document.createRange();
        range.selectNodeContents(button);
        const text = range.getBoundingClientRect(), box = button.getBoundingClientRect();
        return text.width <= box.width + 1 && text.left >= box.left - 1 &&
          text.right <= box.right + 1 && text.top >= box.top - 1 && text.bottom <= box.bottom + 1;
      }),
      controlsDoNotOverlap: ['.phase-nav button', '.filters button'].every(selector => {
        const boxes = [...document.querySelectorAll(selector)].map(button => button.getBoundingClientRect());
        return boxes.every((a, i) => boxes.slice(i + 1).every(b =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 ||
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1));
      }),
      filtersBeforePlot: (() => {
        const plot = document.querySelector('#score-plot');
        const filters = document.querySelector('.filters');
        return !plot || !filters || filters.getBoundingClientRect().bottom <= plot.getBoundingClientRect().top;
      })(),
      caseButtonsEqualHeight: (() => {
        const previous = document.querySelector('#previous-case');
        const next = document.querySelector('#next-case');
        return innerWidth > 320 || !previous || !next ||
          Math.abs(previous.getBoundingClientRect().height - next.getBoundingClientRect().height) <= 1;
      })(),
      selectedOptionFits: (() => {
        const select = document.querySelector('#case-select');
        if (!select) return true;
        const css = getComputedStyle(select);
        const context = document.createElement('canvas').getContext('2d');
        context.font = css.font;
        const label = select.selectedOptions[0]?.textContent || '';
        const textWidth = context.measureText(label).width;
        const available = select.clientWidth - parseFloat(css.paddingLeft) -
          parseFloat(css.paddingRight) - 24;
        return textWidth <= available + 1;
      })(),
      chart: (() => {
        const svg = document.querySelector('#score-plot');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const texts = [...svg.querySelectorAll('text')].map(text => {
          const box = text.getBoundingClientRect();
          return { text: text.textContent, left: box.left, right: box.right,
            top: box.top, bottom: box.bottom,
            fontSize: parseFloat(getComputedStyle(text).fontSize) *
              (svg.viewBox.baseVal.width ? rect.width / svg.viewBox.baseVal.width : 1) };
        });
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, texts };
      })(),
    }));
    assert.equal(layout.overflow, false, `${label}: horizontal page overflow`);
    assert.equal(layout.headingCount, 1, `${label}: one document heading`);
    assert.deepEqual(layout.missingImages, [], `${label}: images loaded`);
    assert.equal(layout.interLoaded, true, `${label}: Inter loaded`);
    assert.equal(layout.visiblePhases, 5, `${label}: all five navigation items visible`);
    assert.equal(layout.navigationTextFits, true, `${label}: navigation text fits its controls`);
    assert.equal(layout.controlsDoNotOverlap, true, `${label}: controls do not overlap`);
    assert.equal(layout.filtersBeforePlot, true, `${label}: category controls precede the plot`);
    assert.equal(layout.caseButtonsEqualHeight, true, `${label}: previous and next controls have equal heights at 320px`);
    assert.equal(layout.selectedOptionFits, true, `${label}: selected case label fits with 24px reserved for the native arrow`);
    if (layout.chart) for (const text of layout.chart.texts) {
      assert(text.fontSize >= 11.5, `${label}: chart label too small: ${text.text}`);
      assert(text.left >= layout.chart.left - 1 && text.right <= layout.chart.right + 1,
        `${label}: chart label clipped horizontally: ${text.text}`);
      assert(text.top >= layout.chart.top - 1 && text.bottom <= layout.chart.bottom + 1,
        `${label}: chart label clipped vertically: ${text.text}`);
    }
    report.views.push({ label, overflow: false, imagesLoaded: true, phases: 5,
      chartLabels: layout.chart?.texts.length || 0, navigationTextFits: true,
      controlsDoNotOverlap: true, filtersBeforePlot: true,
      caseButtonsEqualHeight: true, selectedOptionFits: true });
  };
  const state = () => page.evaluate(() => window.tcEvaluationPreview.getState());

  try {
    await page.goto(base);
    await page.locator('button[data-phase="challenge"]').waitFor();
    await check('Reference source identifies an actual maintainer run and all 43 cases reconcile', async () => {
      assert.match(source.origin, /maintainer/);
      assert.equal(source.runtimeVersion, '4.22.0');
      assert.equal(source.cases.length, 43);
      assert.equal(new Set(source.cases.map(row => row.id)).size, 43);
      const correct = source.cases.filter(row => Number(row.score > 0.5) === row.label).length;
      assert(Math.abs(correct / 43 - source.test.accuracy) < 0.000002);
    });

    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const appearance of ['dark', 'light']) {
        await scheme(appearance);
        for (const name of ['briefing', 'concept', 'takeaways', 'epilogue']) {
          await phase(name);
          await inspectLayout(`${name}-${width}-${appearance}`);
          if ([1440, 390].includes(width) && ['briefing', 'epilogue'].includes(name))
            await snapshot(`${name}-${width}-${appearance}`);
        }
        await phase('challenge');
        for (const name of ['measured', 'empty', 'zero', 'partial', 'stale', 'failed']) {
          await scenario(name);
          await inspectLayout(`${name}-${width}-${appearance}`);
          if (name === 'measured') {
            await snapshot(`challenge-${width}-${appearance}`);
            if ([1440, 390].includes(width))
              await inspectorSnapshot(`inspector-${width}-${appearance}`);
            await scan(`measured-${width}-${appearance}`);
          } else if (width === 390) {
            await snapshot(`${name}-${width}-${appearance}`);
            await scan(`${name}-${width}-${appearance}`);
          }
        }
      }
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await scheme('dark');
    await phase('challenge');
    await scenario('measured');
    await check('Measured points preserve the complete captured distribution', async () => {
      const current = await state();
      assert.equal(current.cases.length, 43);
      assert.equal(await page.locator('#score-plot [data-case-id]').count(), 43);
      assert.match(await page.locator('#run-origin').innerText(), /maintainer/i);
      assert.equal(current.cases.filter(row => row.source === 'story').length, 3);
      for (const row of current.cases)
        assert.equal(row.score, source.cases.find(captured => captured.id === row.id).score);
    });
    await check('Selecting missed anomalies retains all points and selects a real missed case', async () => {
      await page.locator('#filter-fn').click();
      assert.equal(await page.locator('#filter-fn').getAttribute('aria-pressed'), 'true');
      const current = await state();
      assert.equal(await page.locator('#score-plot [data-case-id]').count(), 43);
      const selected = current.cases.find(row => row.id === Number(current.selectedId));
      assert(selected && selected.label === 1 && selected.score <= 0.5);
      assert.match(await page.locator('#case-detail').innerText(), /missed/i);
    });
    await snapshot('missed-case-1440-dark');
    await check('Next case and the case selector remain coordinated', async () => {
      const before = await state();
      await page.locator('#next-case').click();
      const after = await state();
      assert.notEqual(after.selectedId, before.selectedId);
      assert.equal(await page.locator('#case-select').inputValue(), String(after.selectedId));
      await page.locator('#previous-case').click();
      assert.equal((await state()).selectedId, before.selectedId);
    });
    await check('Case selection updates the captured values and source explanation', async () => {
      await page.locator('#filter-all').click();
      await page.locator('#case-select').selectOption('42');
      assert.equal(Number((await state()).selectedId), 42);
      const detail = await page.locator('#case-detail').innerText();
      assert.match(detail, /42/);
      assert.match(detail, /hand.written|authored|story/i);
      assert.match(detail, /0\.5/);
    });
    await check('Keyboard navigation exposes a visible focus state', async () => {
      await page.locator('#filter-all').focus();
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const element = document.activeElement;
        const css = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { id: element.id, focusVisible: element.matches(':focus-visible'),
          outline: css.outlineStyle, outlineWidth: parseFloat(css.outlineWidth),
          visible: rect.width > 0 && rect.height > 0 };
      });
      assert(focus.visible && focus.focusVisible && focus.outline !== 'none' && focus.outlineWidth >= 2,
        `Expected visible keyboard focus: ${JSON.stringify(focus)}`);
    });
    await snapshot('keyboard-focus-1440-dark');
    await check('Reduced motion leaves no running inspector animations', async () => {
      const running = await page.locator('#inspector').evaluate(element =>
        element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length);
      assert.equal(running, 0);
    });
    await check('Zero-error fixture is labeled synthetic and an empty category stays honest', async () => {
      await scenario('zero');
      assert.match(await page.locator('#run-origin').innerText(), /synthetic/i);
      assert.equal((await state()).cases.filter(row => Number(row.score > 0.5) !== row.label).length, 0);
      await page.locator('#filter-fn').click();
      assert.equal(await page.locator('#score-plot [data-case-id]').count(), 43);
      assert.match(await page.locator('#chart-status').innerText(), /no|0|zero/i);
    });
    await check('Partial fixture identifies missing evidence and never claims a complete 43-row result', async () => {
      await scenario('partial');
      assert.match(await page.locator('#run-origin').innerText(), /synthetic/i);
      assert((await state()).cases.length < 43);
      assert.match(await page.locator('#state-notice').innerText(), /partial|missing|incomplete/i);
    });
    await check('Empty result has direction and no fabricated plot', async () => {
      await scenario('empty');
      assert.equal(await page.locator('#score-plot').count(), 0);
      assert.match(await page.locator('#state-notice').innerText(), /run|record|result/i);
    });
    await check('Stale and failed previews retain the earlier captured values with explicit status', async () => {
      for (const name of ['stale', 'failed']) {
        await scenario(name);
        assert.equal((await state()).cases.length, 43);
        assert.match(await page.locator('#state-notice').innerText(),
          name === 'stale' ? /changed|edited|stale|earlier/i : /fail|error/i);
      }
    });
    await check('Save and download identify the separate preview record', async () => {
      await scenario('measured');
      const before = await page.evaluate(() => Object.keys(sessionStorage));
      await page.locator('#save-run').click();
      const after = await page.evaluate(() => Object.keys(sessionStorage));
      assert(after.some(key => !before.includes(key) && /preview|evaluation/i.test(key)) ||
        /saved/i.test(await page.locator('#save-run').innerText()), 'Preview save must acknowledge its result');
      const waiting = page.waitForEvent('download');
      await page.locator('#download-run').click();
      const download = await waiting;
      const data = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      assert.match(data.origin, /maintainer|preview/i);
      assert.equal(data.cases.length, 43);
    });
    await check('No page script failures or failed resources', async () => {
      assert.deepEqual(report.pageErrors, []);
      assert.deepEqual(report.failedRequests, []);
    });
    report.status = 'passed';
    console.log(`Passed ${report.views.length} layout views, ${report.checks.length} interaction/data checks, and ${report.accessibility.length} accessibility scans.`);
  } catch (error) {
    report.status = 'failed';
    report.failure = error.stack || error.message;
    await page.screenshot({ path: path.join(screenshots, 'verification-failure.png'), fullPage: true }).catch(() => {});
    process.exitCode = 1;
    console.error(error);
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
