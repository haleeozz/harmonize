// Real production UI acceptance. Requires a running local server and a real Qloo key.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { scenarios } = require('../tests/fixtures.cjs');
const load = require('../tests/load-ts.cjs')();
const { validateComposition } = load('src/lib/plan.ts');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const out = path.resolve(process.env.TEST_ARTIFACT_DIR || 'artifacts/shared-direction');
const cases = [...scenarios, { ...scenarios[0], id: 'compact-object', mode: 'decor', notes: 'A small regularly handled object.' }, {
  id: 'spontaneous-mix', mode: 'art', references: [
    { query: 'Lana Del Rey', quality: 'sculptural', type: 'artist' },
    { query: 'White Fang', quality: 'minimal', type: 'book' },
    { query: 'se7en', quality: 'cinematic', type: 'movie' },
  ], needs: { scale: 'standard', budget: 'economical', use: 'daily', tone: 'dark', mood: 'dramatic' }, notes: '',
}];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], results = [];
  async function submit(label) {
    const pending = page.waitForResponse(r => r.url().endsWith('/api/harmonize') && r.request().method() === 'POST', { timeout: 55_000 });
    await page.getByRole('button', { name: label, exact: true }).click();
    const response = await pending;
    if (response.status() === 429) {
      console.log('Application burst guard observed; respecting Retry-After.');
      const seconds = Math.min(60, Number(response.headers()['retry-after']) || 60);
      await page.waitForTimeout(seconds * 1000 + 500);
      return submit(label);
    }
    return response;
  }
  page.on('pageerror', e => errors.push(e.message));
  try {
    for (const scenario of cases) {
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.mode[aria-pressed="true"]').count(), 0);
      assert.equal(await page.locator('.quality-card').count(), 0);
      assert.equal(await page.getByLabel('Main color direction', { exact: true }).inputValue(), 'any');
      const labels = { spaces: 'Living spaces', fashion: 'Fashion capsule', decor: 'Objects & decor', art: 'Visual art' };
      await page.getByRole('button', { name: new RegExp(labels[scenario.mode]) }).click();
      for (const reference of scenario.references) {
        await page.getByRole('textbox', { name: 'Add a cultural reference' }).fill(reference.query);
        await page.getByRole('button', { name: 'Add reference', exact: true }).click();
        await page.getByLabel(reference.query, { exact: true }).selectOption(reference.quality);
      }
      for (const [label, key] of [['Scale', 'scale'], ['Budget approach', 'budget'], ['Use', 'use'], ['Main color direction', 'tone'], ['Atmosphere', 'mood']]) await page.getByRole('combobox', { name: label, exact: true }).selectOption(scenario.needs[key]);
      await page.getByLabel('Extra notes — saved, not interpreted', { exact: true }).fill(scenario.notes);
      await page.getByRole('button', { name: 'Review my choices' }).click();
      await page.getByRole('heading', { name: 'Is this your mix?' }).waitFor();
      assert((await page.locator('.review-panel').innerText()).includes(scenario.needs.tone === 'dark' ? 'Dark' : 'Light'));
      let response = await submit('Find my shared directions'), body = await response.json();
      if (response.status() === 409 && body.code === 'RESOLUTION_REQUIRED') {
        assert.equal(body.code, 'RESOLUTION_REQUIRED');
        assert.equal(await page.getByRole('button', { name: 'Find my shared directions', exact: true }).isDisabled(), true);
        for (const resolution of body.resolutions.filter(r => !r.selected)) {
          const ref = scenario.references.find(r => r.query === resolution.query);
          const chosen = resolution.candidates.find(c => (c.name.toLowerCase() === ref.query.toLowerCase() || (ref.query === 'se7en' && c.name === 'Seven')) && c.type === `urn:entity:${ref.type}`);
          assert(chosen, `Missing intended entity: ${ref.query}`);
          await page.getByLabel(`“${resolution.query}”`, { exact: true }).selectOption(chosen.id);
        }
        response = await submit('Find my shared directions'); body = await response.json();
      }
      assert.equal(body.code, 'DIRECTION_REQUIRED', JSON.stringify(body));
      assert(body.candidates.length > 0);
      assert(body.candidates.every(b => b.coverage === scenario.references.length && b.perSignal.every(s => s.affinity > 0)));
      await page.locator('.direction-option').first().waitFor();
      assert.equal(await page.getByRole('button', { name: 'Create my composition', exact: true }).isDisabled(), true);
      await page.locator('.direction-option').first().click();
      assert.equal(await page.getByRole('button', { name: 'Create my composition', exact: true }).isDisabled(), true);
      await page.getByLabel('How would you like to interpret it in your project?', { exact: true }).selectOption(scenario.references[0].quality);
      const chosenDirection = body.candidates[0];
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `direction overflow at ${width}px`);
      }
      await page.locator('.direction-panel').screenshot({ path: path.join(out, `${scenario.id}-direction-mobile.png`) });
      await page.setViewportSize({ width: 1440, height: 1000 });
      response = await submit('Create my composition'); body = await response.json();
      assert.equal(response.status(), 200, JSON.stringify({ scenario: scenario.id, error: body.error }));
      assert.equal(body.data.version, 2);
      const result = body.data, plan = result.plan;
      assert.equal(plan.direction.bridge.id, chosenDirection.id);
      assert.equal(plan.direction.quality, scenario.references[0].quality);
      assert(result.brief.includes(chosenDirection.name) && result.prompt.includes(chosenDirection.name));
      assert.deepEqual(validateComposition(plan), []);
      assert.deepEqual(plan.spec.needs, scenario.needs);
      assert.deepEqual(plan.influences.map(i => i.quality), scenario.references.map(r => r.quality));
      assert.equal(plan.spec.notes, scenario.notes);
      await page.getByRole('heading', { name: 'A small first experiment.' }).waitFor();
      assert((await page.locator('.shared-result').innerText()).includes(chosenDirection.name));
      const order = await page.evaluate(() => ['.confirmed-project', '.influences-section', '.synthesis-grid', '.decisions-section', '.palette-section', '.trial-card'].map(selector => document.querySelector('#brief ' + selector).getBoundingClientRect().top + scrollY));
      assert(order.every((y, i) => !i || y > order[i - 1]));
      assert.equal(await page.locator('.allocation').count(), 0);
      for (const decision of plan.decisions) {
        const card = page.locator(`[data-role="${decision.role}"]`);
        assert((await card.innerText()).includes(decision.application));
        assert((await page.locator(`[data-material="${decision.materialId}"]`).innerText()).includes(decision.hex));
        assert(result.brief.includes(decision.hex) && result.prompt.includes(decision.hex));
      }
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Save brief', exact: true }).click();
      const file = await downloaded; const briefPath = path.join(out, `${scenario.id}.md`);
      await file.saveAs(briefPath);
      assert.equal(fs.readFileSync(briefPath, 'utf8'), result.brief);
      assert(!/\d+%|60\s*[/:-]\s*30/.test(result.brief + result.prompt));
      if (scenario.id === 'shadow-room') {
        assert.equal(plan.decisions[0].hex, '#303137');
        assert.equal(plan.decisions[0].surface, 'wall');
        assert(!/oversized/.test(plan.synthesis.combination));
        assert(plan.synthesis.combination.includes(chosenDirection.name));
        assert(plan.decisions[0].rationale.includes('You chose'));
        await page.getByText('Take the plan to an image tool', { exact: true }).click();
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.getByRole('button', { name: 'Copy image prompt', exact: true }).click();
        await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
        assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), result.prompt);
        await page.getByText('Evidence and request records', { exact: false }).first().click();
        const evidenceFile = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download evidence', exact: true }).click();
        await (await evidenceFile).saveAs(path.join(out, 'evidence-download.json'));
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'evidence-download.json'), 'utf8')).plan, plan);
      }
      await page.locator('.confirmed-project').screenshot({ path: path.join(out, `${scenario.id}-confirmation.png`) });
      await page.locator('.synthesis-grid').screenshot({ path: path.join(out, `${scenario.id}-strategy.png`) });
      await page.locator('.palette-section').screenshot({ path: path.join(out, `${scenario.id}-palette.png`) });
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${scenario.id} overflow at ${width}px`);
        if (width === 390) await page.locator('.synthesis-grid').screenshot({ path: path.join(out, `${scenario.id}-mobile.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      fs.writeFileSync(path.join(out, `${scenario.id}.json`), JSON.stringify(result, null, 2));
      results.push({ scenario: scenario.id, passed: true, direction: plan.direction, summary: plan.summary, influences: plan.influences.map(i => ({ name: i.name, quality: i.qualityLabel, role: i.role })), decisions: plan.decisions.map(d => ({ role: d.role, material: d.materialName, color: d.colorName, hex: d.hex, surface: d.surface })), warnings: result.evidence.warnings });
      fs.writeFileSync(path.join(out, 'browser-validation.json'), JSON.stringify({ complete: false, results, errors }, null, 2));
    }
    const legacy = await page.request.post(base + '/api/harmonize', { data: { seeds: ['A', 'B'], mode: 'spaces', project: 'dark' } });
    assert.equal(legacy.status(), 400); assert.equal((await legacy.json()).code, 'PROJECT_SPEC_REQUIRED');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'browser-validation.json'), JSON.stringify({ complete: true, checkedAt: new Date().toISOString(), results, errors }, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
