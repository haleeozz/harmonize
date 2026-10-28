const needs = { scale: 'compact', budget: 'economical', use: 'daily', tone: 'dark', mood: 'dramatic' };
function spec(mode = 'spaces', overrides = {}) {
  return { version: 2, mode, references: [{ query: 'A', quality: 'sculptural' }, { query: 'B', quality: 'cinematic' }], needs: { ...needs }, notes: '', ...overrides };
}
function resolutions(s) {
  return s.references.map(r => ({ query: r.query, selected: { id: r.entityId || r.query, name: r.query, type: 'urn:entity:artist', description: 'Public cultural description.' }, candidates: [], status: 'confirmed' }));
}
const scenarios = [
  { id: 'shadow-room', mode: 'spaces', references: [{ query: 'Rick Owens', quality: 'sculptural', type: 'brand' }, { query: 'Massive Attack', quality: 'cinematic', type: 'artist' }], needs: { ...needs }, notes: 'Küçük bir oturma odası yapıyorum. Karanlık ve dramatik olsun ama günlük kullanımda rahat ve bütçeme uygun olsun.' },
  { id: 'organic-capsule', mode: 'fashion', references: [{ query: 'Aesop', quality: 'technical', type: 'brand' }, { query: 'Bon Iver', quality: 'organic', type: 'artist' }], needs: { scale: 'compact', budget: 'economical', use: 'daily', tone: 'light', mood: 'calm' }, notes: 'A calm everyday capsule.' },
  { id: 'cinema-art', mode: 'art', references: [{ query: 'Blade Runner 2049', quality: 'cinematic', type: 'movie' }, { query: 'Ryoji Ikeda', quality: 'technical', type: 'artist' }], needs: { scale: 'compact', budget: 'economical', use: 'daily', tone: 'dark', mood: 'calm' }, notes: 'A small art study.' },
];
module.exports = { spec, resolutions, scenarios };
