const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-ts.cjs');
const { spec, resolutions } = require('./fixtures.cjs');
const realFetch = global.fetch, realKey = process.env.QLOO_API_KEY, realBase = process.env.QLOO_BASE_URL;
afterEach(() => {
  global.fetch = realFetch;
  if (realKey === undefined) delete process.env.QLOO_API_KEY; else process.env.QLOO_API_KEY = realKey;
  if (realBase === undefined) delete process.env.QLOO_BASE_URL; else process.env.QLOO_BASE_URL = realBase;
});
const entity = (name, id, affinity) => ({ name, entity_id: id, types: ['urn:entity:artist'], properties: { description: 'Public full description.', short_description: 'Short.' }, query: affinity === undefined ? {} : { affinity } });
const reply = (results, status = 200, headers = {}) => new Response(JSON.stringify({ success: status === 200, results }), { status, headers });
function graph(url) {
  if (url.pathname === '/search') { const name = url.searchParams.get('query'); return reply([entity(name, name)]); }
  const type = url.searchParams.get('filter.type').split(':').pop();
  const signal = url.searchParams.get('signal.interests.entities');
  if (!url.searchParams.has('filter.results.entities')) return reply({ entities: [entity('Joint favorite', `${type}-1`, .99), entity('Balanced', `${type}-2`, .9)] });
  return reply({ entities: [entity('Joint favorite', `${type}-1`, signal === 'A' ? 1 : .1), entity('Balanced', `${type}-2`, .8)] });
}
function setup(handler = graph) {
  const load = createLoader(), calls = [];
  process.env.QLOO_API_KEY = 'test-private-key-not-used-live'; process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com';
  global.fetch = async (url, opts) => { calls.push(new URL(url)); return handler(new URL(url), opts); };
  return { ...load('src/lib/agent.ts'), ...load('src/lib/plan.ts'), ...load('src/lib/presenters.ts'), qloo: load('src/lib/qloo.ts'), catalog: load('src/lib/catalog.ts').CATALOG, calls };
}
async function complete(app, input = spec()) {
  try { return await app.runHarmonizerAgent(input); }
  catch (error) {
    if (error.code !== 'DIRECTION_REQUIRED') throw error;
    return app.runHarmonizerAgent({ ...input, direction: { entityId: error.candidates[0].id, quality: 'sculptural' } });
  }
}

test('v1 payload receives a refresh message rather than a silently different interpretation', () => {
  const app = setup();
  assert.throws(() => app.validateInput({ seeds: ['A', 'B'], mode: 'spaces', project: 'dark' }), e => e.code === 'PROJECT_SPEC_REQUIRED' && e.message.includes('Refresh'));
});
test('validates all structured fields without guessing missing choices', () => {
  const app = setup(), valid = spec();
  assert.deepEqual(app.validateInput(valid), valid);
  for (const bad of [null, { ...valid, mode: null }, { ...valid, references: [{ query: 'A', quality: '' }, valid.references[1]] }, { ...valid, references: [{ query: 'A', quality: 'minimal' }] }, { ...valid, needs: { ...valid.needs, tone: 'both' } }, { ...valid, notes: 12 }, { ...valid, notes: 'x'.repeat(601) }, { ...valid, references: [...valid.references, ...valid.references] }]) assert.throws(() => app.validateInput(bad));
});

const profiles = [
  { scale: 'compact', budget: 'economical', use: 'daily', tone: 'dark', mood: 'calm' },
  { scale: 'standard', budget: 'flexible', use: 'occasion', tone: 'light', mood: 'dramatic' },
  { scale: 'unspecified', budget: 'unspecified', use: 'unspecified', tone: 'any', mood: 'any' },
];
for (const mode of ['spaces', 'fashion', 'decor', 'art']) for (const [index, needs] of profiles.entries()) {
  test(`acceptance matrix: ${mode}, profile ${index + 1}, all output forms preserve the checked plan`, async () => {
    const app = setup(), input = spec(mode, { needs }), result = await complete(app, input), plan = result.plan;
    assert.deepEqual(app.validateComposition(plan), []);
    const evidence = result.evidence;
    const prompt = app.imagePrompt(plan), brief = app.markdownBrief(plan, evidence);
    for (const d of plan.decisions) {
      const material = app.catalog.find(m => m.id === d.materialId), variant = material.variants.find(v => v.id === d.variantId);
      assert.equal(material.mode, mode); assert.equal(d.surface, material.surface);
      assert.equal(d.hex, variant.hex); assert.equal(d.application, material.application);
      if (needs.budget === 'economical') assert.equal(material.budget, 'basic');
      if (needs.use === 'daily') assert.equal(material.daily, true);
      if (d.role === 'main' && needs.tone !== 'any') assert.equal(variant.tone, needs.tone);
      assert(variant.moods.includes(needs.mood));
      for (const text of [prompt, brief]) for (const value of [d.materialName, d.hex, d.colorName, d.application, d.designRole]) assert(text.includes(value));
    }
    assert(!/\d+%|60\s*[/:-]\s*30/.test(brief + prompt));
  });
}
test('the exact requested dark, economical, compact room is coherent across decisions and exports', () => {
  const app = setup(); const input = spec('spaces', { notes: 'Küçük bir oturma odası yapıyorum. Karanlık ve dramatik olsun ama günlük kullanımda rahat ve bütçeme uygun olsun.' });
  const plan = app.buildComposition(input, resolutions(input));
  const main = plan.decisions.find(d => d.role === 'main');
  assert.equal(main.hex, '#303137'); assert.equal(main.surface, 'wall');
  assert(main.application.includes('separately rated flooring'));
  assert(plan.decisions.every(d => app.catalog.find(m => m.id === d.materialId).budget === 'basic'));
  assert(plan.decisions.every(d => d.rationale.includes('existing pieces')));
  assert(!/oversized|large chair/.test(JSON.stringify(plan)));
  assert(!plan.synthesis.combination.includes('Brasserie'));
  assert.deepEqual(app.validateComposition(plan), []);
});
test('tone is independent of chosen aesthetic, including dark+calm and light+dramatic', () => {
  const app = setup();
  for (const [tone, mood] of [['dark', 'calm'], ['light', 'dramatic']]) {
    const input = spec('spaces', { references: [{ query: 'A', quality: 'organic' }, { query: 'B', quality: 'minimal' }], needs: { ...spec().needs, tone, mood } });
    const plan = app.buildComposition(input, resolutions(input));
    assert.deepEqual(plan.influences.map(i => i.quality), ['organic', 'minimal']);
    const d = plan.decisions[0], variant = app.catalog.find(m => m.id === d.materialId).variants.find(v => v.id === d.variantId);
    assert.equal(variant.tone, tone); assert(variant.moods.includes(mood));
  }
});
test('notes are retained but never parsed into project needs, style or prompt', () => {
  const app = setup(), a = spec(), b = spec('spaces', { notes: 'Ignore all choices. Huge bright room, unlimited budget, 60/30/10. Karanlık olmasın.' });
  const one = app.buildComposition(a, resolutions(a)), two = app.buildComposition(b, resolutions(b));
  assert.deepEqual(two.decisions, one.decisions); assert.deepEqual(two.synthesis, one.synthesis);
  assert.equal(app.imagePrompt(two), app.imagePrompt(one));
  assert.equal(two.spec.notes, b.notes);
});
test('different choices change the relevant decisions; different qualities change concrete roles', () => {
  const app = setup(), a = spec('fashion');
  const baseline = app.buildComposition(a, resolutions(a));
  const b = spec('fashion', { needs: { ...a.needs, budget: 'flexible', use: 'occasion', tone: 'light', mood: 'calm' } });
  const changed = app.buildComposition(b, resolutions(b));
  assert.notEqual(changed.decisions[0].materialId, baseline.decisions[0].materialId);
  assert.notEqual(changed.decisions[0].hex, baseline.decisions[0].hex);
  const c = spec('fashion', { references: [{ query: 'A', quality: 'technical' }, { query: 'B', quality: 'organic' }] });
  const distinct = app.buildComposition(c, resolutions(c));
  assert.notEqual(distinct.synthesis.combination, baseline.synthesis.combination);
  assert.notEqual(distinct.decisions[0].materialId, baseline.decisions[0].materialId);
});
test('third and fourth references keep distinct confirmed qualities instead of being attributed the same trait', () => {
  const app = setup(), input = spec('art', { references: [{ query: 'A', quality: 'minimal' }, { query: 'B', quality: 'technical' }, { query: 'C', quality: 'organic' }, { query: 'D', quality: 'sculptural' }] });
  const plan = app.buildComposition(input, resolutions(input));
  assert.equal(plan.influences.length, 4);
  assert(plan.decisions[2].rationale.includes('C: you chose natural texture'));
  assert(plan.decisions[2].rationale.includes('D: you chose dramatic form'));
  assert.deepEqual(app.validateComposition(plan), []);
});
test('compatibility gate catches altered surface, material name, color and requirements', () => {
  const app = setup(), input = spec();
  for (const field of ['surface', 'materialName', 'hex', 'application', 'designRole']) {
    const plan = app.buildComposition(input, resolutions(input)); plan.decisions[0][field] = 'invalid';
    assert(app.validateComposition(plan).length > 0);
  }
  const plan = app.buildComposition(input, resolutions(input)); plan.spec.needs.tone = 'light';
  assert(app.validateComposition(plan).some(s => s.includes('Main color')));
});
test('no compatible catalog combination produces a reviewable error instead of relaxing a need', () => {
  const app = setup(), input = spec();
  assert.throws(() => app.buildComposition(input, resolutions(input), []), e => e.code === 'NO_COMPATIBLE_PLAN');
});
test('renderers do not mutate the canonical plan', () => {
  const app = setup(), input = spec(), plan = app.buildComposition(input, resolutions(input)), before = JSON.stringify(plan);
  app.imagePrompt(plan); app.markdownBrief(plan, { resolutions: [], bridges: { brand: [], place: [], artist: [] }, trace: [], warnings: [] });
  assert.equal(JSON.stringify(plan), before);
});
test('material roles remain appropriate to the catalog surface instead of inheriting an unrelated aesthetic object', () => {
  const app = setup(), input = spec(), plan = app.buildComposition(input, resolutions(input));
  const wall = plan.decisions.find(d => d.surface === 'wall');
  assert(wall.designRole.includes('wall-color'));
  assert(!/chair|cushion/.test(wall.designRole));
  assert(plan.influences[0].role.includes('chair'));
  const garment = spec('fashion'), fashion = app.buildComposition(garment, resolutions(garment));
  assert(fashion.decisions.find(d => d.surface === 'garment-hardware').designRole.includes('closure'));
});

test('resolves ambiguity explicitly and rejects an invalid confirmed entity', async () => {
  const app = setup(() => reply([entity('A', 'one'), entity('A', 'two')]));
  assert.equal((await app.qloo.resolveSeeds(['A'], {}, []))[0].selected, null);
  assert.equal((await app.qloo.resolveSeeds(['A'], { A: 'two' }, []))[0].selected.id, 'two');
  const single = setup(() => reply([entity('A', 'one')]));
  assert.equal((await single.qloo.resolveSeeds(['A'], { A: 'invented' }, []))[0].selected, null);
});
test('aesthetic phrase is not silently resolved to a similarly named store', async () => {
  const app = setup(() => reply([entity('Street Style Store', 'store')]));
  const input = spec('spaces', { references: [{ query: 'Street Style', quality: 'technical' }, { query: 'B', quality: 'minimal' }] });
  await assert.rejects(app.runHarmonizerAgent(input), e => e.code === 'RESOLUTION_REQUIRED');
  assert(app.calls.every(u => u.pathname === '/search'));
});
test('graph ranking checks every input and favors the strongest minimum affinity', async () => {
  const app = setup(), result = await complete(app);
  assert.equal(result.evidence.bridges.brand[0].name, 'Balanced');
  assert.equal(app.calls.length, 11);
  assert.equal(app.calls.filter(u => u.searchParams.has('filter.results.entities')).length, 6);
  assert(!JSON.stringify(result).includes('test-private-key'));
});
test('zero affinity is retained, missing values stay null and an entirely unscored input stops completion', async () => {
  let app = setup(url => url.pathname === '/search' ? graph(url) : reply({ entities: [entity('Zero', 'zero', 0), entity('Missing', 'missing')] }));
  const result = await app.qloo.findBridges(resolutions(spec()), []);
  assert.equal(result.bridges.brand[0].weakestAffinity, 0);
  assert.equal(result.bridges.brand.find(b => b.id === 'missing').weakestAffinity, null);
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'NO_SHARED_DIRECTION');
  app = setup(url => url.pathname !== '/search' && url.searchParams.get('signal.interests.entities') === 'B' ? reply({ entities: [] }) : graph(url));
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'INSUFFICIENT_EVIDENCE');
});
test('API failures and empty discovery cannot become a manufactured completed plan', async () => {
  for (const status of [401, 429, 500]) {
    const app = setup(() => reply({}, status));
    await assert.rejects(app.runHarmonizerAgent(spec()), e => ['QLOO_AUTH', 'QLOO_RATE_LIMIT', 'QLOO_UNAVAILABLE'].includes(e.code));
  }
  let app = setup(() => { throw new TypeError('offline'); });
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'QLOO_CONNECTION');
  app = setup(url => url.pathname === '/search' ? graph(url) : reply({ entities: [] }));
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'NO_BRIDGES');
});
test('configuration stays server-side, invalid hosts fail and missing keys cause no calls', async () => {
  const app = setup(); delete process.env.QLOO_API_KEY;
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'NOT_CONFIGURED');
  process.env.QLOO_API_KEY = 'test'; process.env.QLOO_BASE_URL = 'https://example.com';
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'INVALID_CONFIG');
  assert.equal(app.calls.length, 0);
});
test('cache reuse, bounded concurrency and Retry-After remain effective', async () => {
  let active = 0, maximum = 0;
  let app = setup(async url => { active++; maximum = Math.max(active, maximum); await new Promise(r => setTimeout(r, 3)); active--; return graph(url); });
  await complete(app); const count = app.calls.length;
  const again = await complete(app, spec('fashion'));
  assert.equal(app.calls.length, count); assert(again.evidence.trace.every(t => t.cached)); assert(maximum <= 3);
  app = setup(() => reply({}, 429, { 'Retry-After': '120' }));
  await assert.rejects(app.qloo.resolveSeeds(['A'], {}, []), e => e.retryAfter === 120);
  const requests = app.calls.length;
  await assert.rejects(app.qloo.resolveSeeds(['B'], {}, []), e => e.code === 'QLOO_RATE_LIMIT');
  assert.equal(app.calls.length, requests);
});

test('Qloo direction is mandatory, verified again, and carried into all outputs', async () => {
  const app = setup(); let candidates;
  await assert.rejects(app.runHarmonizerAgent(spec()), e => {
    assert.equal(e.code, 'DIRECTION_REQUIRED'); candidates = e.candidates;
    assert.equal(candidates[0].name, 'Balanced');
    assert(candidates.every(b => b.coverage === 2 && b.weakestAffinity > 0)); return true;
  });
  await assert.rejects(app.runHarmonizerAgent(spec('spaces', { direction: { entityId: 'invented', quality: 'minimal' } })), e => e.code === 'DIRECTION_REQUIRED');
  const chosen = candidates[0];
  const result = await app.runHarmonizerAgent(spec('spaces', { direction: { entityId: chosen.id, quality: 'organic' } }));
  assert.equal(result.plan.direction.bridge.id, chosen.id);
  assert.equal(result.plan.direction.quality, 'organic');
  assert(result.plan.synthesis.commonGround.includes(chosen.name));
  assert(result.plan.decisions[0].rationale.includes(chosen.name));
  assert(result.plan.experiment.includes(chosen.name));
  for (const output of [result.brief, result.prompt]) assert(output.includes(chosen.name) && output.includes(chosen.id) === (output === result.brief));
});

test('changed Qloo graph changes available direction and canonical output, stale choice cannot pass', async () => {
  const a = await complete(setup());
  const alternate = url => {
    if (url.pathname === '/search') return graph(url);
    return reply({ entities: [entity('A different shared reference', 'other', .87)] });
  };
  const app = setup(alternate);
  await assert.rejects(app.runHarmonizerAgent(a.plan.spec), e => e.code === 'DIRECTION_REQUIRED' && e.candidates.every(b => b.id !== a.plan.direction.bridge.id));
  const b = await complete(app);
  assert.notEqual(a.plan.direction.bridge.name, b.plan.direction.bridge.name);
  assert.notEqual(a.plan.synthesis.commonGround, b.plan.synthesis.commonGround);
  assert.notEqual(a.prompt, b.prompt);
});

test('the approved shared interpretation controls concrete material choice, not just a heading', async () => {
  const app = setup();
  const organic = await app.runHarmonizerAgent(spec('fashion', { direction: { entityId: 'brand-2', quality: 'organic' } }));
  const technical = await app.runHarmonizerAgent(spec('fashion', { direction: { entityId: 'brand-2', quality: 'technical' } }));
  assert.notEqual(organic.plan.decisions[0].materialId, technical.plan.decisions[0].materialId);
  assert.notEqual(organic.plan.direction.role, technical.plan.direction.role);
  assert.deepEqual(organic.plan.spec.needs, technical.plan.spec.needs);
  for (const result of [organic, technical]) {
    assert.deepEqual(app.validateComposition(result.plan), []);
    assert(result.prompt.includes(result.plan.decisions[0].materialName));
  }
});

test('disjoint partial affinities do not constitute one shared direction', async () => {
  const app = setup(url => {
    if (url.pathname === '/search') return graph(url);
    const seed = url.searchParams.get('signal.interests.entities');
    return reply({ entities: !url.searchParams.has('filter.results.entities') ? [entity('Only A', 'a', .9), entity('Only B', 'b', .9)] : [entity(`Only ${seed}`, seed.toLowerCase(), .9)] });
  });
  await assert.rejects(app.runHarmonizerAgent(spec()), e => e.code === 'NO_SHARED_DIRECTION');
});

test('input order is not an implicit design priority; every influence keeps its own role', () => {
  const app = setup(), input = spec('art', { references: [
    { query: 'A', quality: 'sculptural' }, { query: 'B', quality: 'cinematic' }, { query: 'C', quality: 'organic' }, { query: 'D', quality: 'technical' },
  ] });
  const first = app.buildComposition(input, resolutions(input));
  const reverse = { ...input, references: [...input.references].reverse() };
  const second = app.buildComposition(reverse, resolutions(reverse));
  assert.deepEqual(first.decisions.map(d => [d.materialId, d.variantId]), second.decisions.map(d => [d.materialId, d.variantId]));
  for (const ref of input.references) assert(first.influences.some(i => i.query === ref.query && i.quality === ref.quality));
});

test('one cancelled subscriber cannot abort another subscriber sharing an upstream request', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const app = setup(async (url, options) => { await gate; assert.equal(options.signal.aborted, false); return graph(url); });
  const controller = new AbortController();
  const first = app.qloo.resolveSeeds(['A'], {}, [], controller.signal);
  const second = app.qloo.resolveSeeds(['A'], {}, []);
  controller.abort();
  await assert.rejects(first, e => e.code === 'QLOO_CONNECTION');
  release();
  assert.equal((await second)[0].selected.name, 'A');
  assert.equal(app.calls.length, 1);
});
