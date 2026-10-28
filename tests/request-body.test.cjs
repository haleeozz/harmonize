const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readProjectBody } = require('./load-ts.cjs')()('src/lib/request-body.ts');
const req = (body, headers = {}) => new Request('http://localhost/api/harmonize', { method: 'POST', body, headers, duplex: 'half' });

test('body reader preserves UTF-8 JSON and rejects invalid encoding or syntax', async () => {
  assert.deepEqual(await readProjectBody(req(JSON.stringify({ notes: 'Küçük, günlük kullanım — 静か' }))), { notes: 'Küçük, günlük kullanım — 静か' });
  for (const body of ['{bad', new Uint8Array([0xff, 0xfe])]) await assert.rejects(readProjectBody(req(body)), e => e.code === 'INVALID_JSON');
});
test('body reader bounds bytes without trusting Content-Length or buffering an entire oversized stream', async () => {
  await assert.rejects(readProjectBody(req('{}', { 'Content-Length': '9000' })), e => e.status === 413);
  let cancelled = false;
  const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(9000)); }, cancel() { cancelled = true; } });
  await assert.rejects(readProjectBody(req(stream)), e => e.status === 413);
  assert.equal(cancelled, true);
  await assert.rejects(readProjectBody(req(JSON.stringify('é'.repeat(4100)))), e => e.status === 413);
});
