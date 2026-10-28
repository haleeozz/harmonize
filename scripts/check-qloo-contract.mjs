// Read-only live contract check; logs public entity IDs, never credentials.
import { mkdir, writeFile } from 'node:fs/promises';
try { process.loadEnvFile('.env.local'); } catch {}
const key = process.env.QLOO_API_KEY;
if (!key) throw new Error('QLOO_API_KEY is required.');
const base = new URL(process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com');
if (base.protocol !== 'https:' || !['hackathon.api.qloo.com', 'api.qloo.com'].includes(base.hostname) || base.username || base.password || base.port) throw new Error('Official Qloo host required.');
async function get(path, params) {
  const url = new URL(path, base);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Contract check HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : data.results?.entities || [];
}
const seed = (await get('/search', { query: 'Rick Owens', take: '1' }))[0];
if (!seed?.entity_id) throw new Error('No diagnostic seed resolved.');
const common = { 'filter.type': 'urn:entity:brand', 'signal.interests.entities': seed.entity_id, take: '3' };
const joint = await get('/v2/insights', common);
if (joint.length < 2) throw new Error('Not enough diagnostic candidates.');
// Deliberately request only the SECOND result. An ignored filter is observable.
const target = joint[1].entity_id;
const checks = [];
for (const parameter of ['filter.entities', 'filter.results.entities']) {
  const rows = await get('/v2/insights', { ...common, [parameter]: target });
  checks.push({ parameter, requestedId: target, returned: rows.map(e => ({ id: e.entity_id, name: e.name, affinity: e.query?.affinity ?? null })), restrictedToRequested: rows.length > 0 && rows.every(e => e.entity_id === target) });
}
await mkdir('artifacts/contract', { recursive: true });
const report = { checkedAt: new Date().toISOString(), host: base.origin, checks };
await writeFile('artifacts/contract/qloo-filter.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!checks.find(c => c.parameter === 'filter.results.entities')?.restrictedToRequested) process.exitCode = 1;
