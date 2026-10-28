import type { Bridge, Candidate, Domain, RequestTrace, Resolution } from './types';

import { ProductError } from './errors';
export { ProductError } from './errors';
interface Entity {
  name: string; entity_id: string; types?: string[]; type?: string; subtype?: string;
  properties?: { description?: string; short_description?: string; style_description?: string; website?: string };
  query?: { affinity?: number };
}
interface ApiResponse { success?: boolean; results?: Entity[] | { entities?: Entity[] } }
const cache = new Map<string, { expires: number; data: ApiResponse }>();
const pending = new Map<string, Promise<ApiResponse>>();
let active = 0;
let cooldownUntil = 0;
const waiting: (() => void)[] = [];
// Shared upstream work has its own timeout. Each subscriber may stop waiting
// without aborting another user's request for the same cached resource.
async function subscribed<T>(task: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return task;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const abort = () => { cleanup(); reject(signal.reason); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    task.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}
async function withRequestSlot<T>(action: () => Promise<T>): Promise<T> {
  if (active < 3) active++; else await new Promise<void>(resolve => waiting.push(resolve));
  try {
    if (cooldownUntil > Date.now()) {
      const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      throw new ProductError(`Qloo’s request limit was reached. Please wait ${seconds} seconds before trying again.`, 429, 'QLOO_RATE_LIMIT', seconds);
    }
    return await action();
  } finally {
    const next = waiting.shift();
    if (next) next(); else active--;
  }
}
const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function entities(data: ApiResponse): Entity[] {
  const list = Array.isArray(data.results) ? data.results : data.results?.entities || [];
  return list.filter(e => typeof e?.name === 'string' && typeof e?.entity_id === 'string');
}
function configuration() {
  const key = process.env.QLOO_API_KEY?.trim();
  if (!key || key.startsWith('your_')) throw new ProductError('Qloo is not configured yet. The host needs to set QLOO_API_KEY.', 503, 'NOT_CONFIGURED');
  let base: URL;
  try { base = new URL(process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com'); }
  catch { throw new ProductError('Use an official Qloo HTTPS server address.', 503, 'INVALID_CONFIG'); }
  if (base.protocol !== 'https:' || !['hackathon.api.qloo.com', 'api.qloo.com'].includes(base.hostname) || base.port || base.username || base.password) {
    throw new ProductError('Use an official Qloo HTTPS server address.', 503, 'INVALID_CONFIG');
  }
  return { key, base };
}
async function request(path: string, params: Record<string, string>, purpose: string, trace: RequestTrace[], signal?: AbortSignal): Promise<ApiResponse> {
  const { key, base } = configuration();
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const endpoint = url.pathname + url.search;
  const cacheKey = key + ':' + url.toString(); // Never included in traces or responses.
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    trace.push({ purpose, endpoint, status: 200, count: entities(hit.data).length, cached: true });
    return hit.data;
  }
  try {
    let task = pending.get(cacheKey);
    const shared = Boolean(task);
    if (!task) {
      task = withRequestSlot(async () => {
        const timeout = AbortSignal.timeout(10_000);
        const response = await fetch(url, { headers: { 'X-Api-Key': key, Accept: 'application/json' }, cache: 'no-store', signal: timeout });
        if (!response.ok) {
          const status = response.status;
          if (status === 429) {
            const retry = response.headers.get('retry-after');
            const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : retry ? Math.ceil((Date.parse(retry) - Date.now()) / 1000) : 60;
            const delay = Number.isFinite(seconds) ? Math.max(1, Math.min(seconds, 3600)) : 60;
            cooldownUntil = Date.now() + delay * 1000;
            throw new ProductError(`Qloo’s request limit was reached. Please wait ${delay} seconds before trying again.`, 429, 'QLOO_RATE_LIMIT', delay);
          }
          throw new ProductError(
            status === 401 || status === 403 ? 'Qloo rejected the API credential. The host needs to check its key.' : status === 429 ? 'Qloo’s request limit was reached. Please try again later.' : `Qloo could not complete this request (HTTP ${status}). Please try again.`,
            status === 429 ? 429 : 502,
            status === 401 || status === 403 ? 'QLOO_AUTH' : status === 429 ? 'QLOO_RATE_LIMIT' : 'QLOO_UNAVAILABLE',
          );
        }
        const data: ApiResponse = await response.json();
        if (data.success === false || !data.results || (!Array.isArray(data.results) && !Array.isArray(data.results.entities))) throw new ProductError('Qloo returned an unexpected response. No recommendations were substituted.', 502, 'INVALID_RESPONSE');
        if (cache.size >= 200) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, { expires: Date.now() + 15 * 60_000, data });
        return data;
      });
      pending.set(cacheKey, task);
      void task.finally(() => pending.delete(cacheKey)).catch(() => {});
    }
    const data = await subscribed(task, signal);
    trace.push({ purpose, endpoint, status: 200, count: entities(data).length, cached: shared });
    return data;
  } catch (error) {
    trace.push({ purpose, endpoint, status: error instanceof ProductError ? error.status : 504, count: 0, cached: false });
    if (error instanceof ProductError) throw error;
    throw new ProductError('Qloo could not be reached in time. Please try again; no example data has been used.', 504, 'QLOO_CONNECTION');
  }
}
export async function resolveSeeds(seeds: string[], selections: Record<string, string>, trace: RequestTrace[], signal?: AbortSignal): Promise<Resolution[]> {
  return Promise.all(seeds.map(async query => {
    const candidates: Candidate[] = entities(await request('/search', { query, take: '5' }, `Resolve “${query}”`, trace, signal)).map(e => ({
      id: e.entity_id, name: e.name, type: e.types?.find(t => t.startsWith('urn:entity:') && t !== 'urn:entity') || e.subtype || e.type || 'urn:entity',
      description: [e.properties?.style_description, e.properties?.description || e.properties?.short_description].filter(Boolean).join(' ').slice(0, 8000),
    }));
    const chosen = candidates.find(c => c.id === selections[query]);
    const exact = candidates.filter(c => normalize(c.name) === normalize(query));
    const selected = selections[query] ? chosen || null : (exact.length === 1 ? exact[0] : null);
    return { query, candidates, selected, status: chosen ? 'confirmed' : selected ? 'exact' : candidates.length ? 'needs-choice' : 'unresolved' };
  }));
}
function affinity(e: Entity | undefined): number | null {
  const value = e?.query?.affinity;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}
function safeUrl(value?: string): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export async function findBridges(resolutions: Resolution[], trace: RequestTrace[], signal?: AbortSignal): Promise<{ bridges: Record<Domain, Bridge[]>; warnings: string[] }> {
  const selected = resolutions.flatMap(r => r.selected ? [r.selected] : []);
  const warnings: string[] = [];
  const entries = await Promise.all((['brand', 'place', 'artist'] as const).map(async domain => {
    const filterType = `urn:entity:${domain}`;
    const joint = entities(await request('/v2/insights', { 'filter.type': filterType, 'signal.interests.entities': selected.map(s => s.id).join(','), take: '6' }, `Discover ${domain} bridges across all references`, trace, signal)).filter(e => !selected.some(s => s.id === e.entity_id));
    if (!joint.length) return [domain, []] as const;
    // Check the SAME shortlist against every input, rather than assuming that
    // a joint recommendation proves support from each individual reference.
    const rankings = await Promise.all(selected.map(async seed => ({
      id: seed.id, name: seed.name,
      entities: entities(await request('/v2/insights', { 'filter.type': filterType, 'filter.results.entities': joint.map(e => e.entity_id).join(','), 'signal.interests.entities': seed.id, take: String(joint.length) }, `Check ${domain} shortlist against ${seed.name}`, trace, signal)),
    })));
    const bridges: Bridge[] = joint.map(e => {
      const perSignal = rankings.map(r => ({ entityId: r.id, name: r.name, affinity: affinity(r.entities.find(x => x.entity_id === e.entity_id)) }));
      const measured = perSignal.flatMap(s => s.affinity === null ? [] : [s.affinity]);
      return { id: e.entity_id, name: e.name, domain, description: e.properties?.style_description || e.properties?.short_description || e.properties?.description || '', combinedAffinity: affinity(e), perSignal, weakestAffinity: measured.length === selected.length ? Math.min(...measured) : null, coverage: measured.length, sourceUrl: safeUrl(e.properties?.website) };
    });
    bridges.sort((a, b) => b.coverage - a.coverage || (b.weakestAffinity ?? -1) - (a.weakestAffinity ?? -1) || (b.combinedAffinity ?? -1) - (a.combinedAffinity ?? -1));
    return [domain, bridges] as const;
  }));
  const bridges = Object.fromEntries(entries) as Record<Domain, Bridge[]>;
  if (!Object.values(bridges).some(items => items.length)) throw new ProductError('Qloo found no recommendations for this combination. Try another reference.', 422, 'NO_BRIDGES');
  const unsupported = selected.filter(seed => Object.values(bridges).flat().every(b => b.perSignal.find(s => s.entityId === seed.id)?.affinity == null));
  if (unsupported.length) throw new ProductError(`Qloo returned no individual recommendation scores for ${unsupported.map(s => s.name).join(', ')}. We cannot verify that the result includes this influence. Try another reference or a different entity with the intended meaning.`, 422, 'INSUFFICIENT_EVIDENCE');
  for (const [domain, items] of entries) {
    if (!items.length) warnings.push(`No ${domain} recommendations were returned. This part of the brief is left empty.`);
    else if (items.some(b => b.coverage < selected.length)) warnings.push(`Some ${domain} candidates have incomplete per-reference scores. Missing values are not evidence of a bridge.`);
  }
  return { bridges, warnings };
}
