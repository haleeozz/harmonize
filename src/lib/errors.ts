export class ProductError extends Error {
  constructor(message: string, public status = 502, public code = 'QLOO_UNAVAILABLE', public retryAfter?: number) { super(message); }
}
