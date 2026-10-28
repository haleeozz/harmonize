import { ProductError } from './errors';

export async function readProjectBody(req: Request, limit = 8192): Promise<unknown> {
  const declared = req.headers.get('content-length');
  if (declared && Number(declared) > limit) throw new ProductError('This request is too large.', 413, 'REQUEST_TOO_LARGE');
  const reader = req.body?.getReader();
  if (!reader) throw new ProductError('Send a JSON request body.', 400, 'INVALID_JSON');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => {});
        throw new ProductError('This request is too large.', 413, 'REQUEST_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)); }
  catch { throw new ProductError('This request is not valid JSON.', 400, 'INVALID_JSON'); }
}
