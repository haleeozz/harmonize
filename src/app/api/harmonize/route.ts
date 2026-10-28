import { NextResponse } from 'next/server';
import { DirectionRequired, ResolutionRequired, runHarmonizerAgent, validateInput } from '@/lib/agent';
import { ProductError } from '@/lib/qloo';
import { readProjectBody } from '@/lib/request-body';
export const maxDuration = 60;
// Per-process burst guard; add hosting-level limits for multi-instance scale.
const visits = new Map<string, { count: number; reset: number }>();
export async function POST(req: Request) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415 });
    const body = await readProjectBody(req);
    const input = validateInput(body);
    const client = req.headers.get('x-vercel-forwarded-for')?.split(',')[0] || req.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
    const now = Date.now();
    for (const [key, visit] of visits) if (visit.reset <= now) visits.delete(key);
    const visit = visits.get(client) || { count: 0, reset: now + 60_000 };
    if (visit.count >= 8) return NextResponse.json({ error: 'Please wait a minute before making another brief.' }, { status: 429, headers: { 'Retry-After': '60' } });
    if (visits.size > 5000) return NextResponse.json({ error: 'The demo is busy. Please try again shortly.' }, { status: 503 });
    visit.count++; visits.set(client, visit);
    const data = await runHarmonizerAgent(input, AbortSignal.any([req.signal, AbortSignal.timeout(45_000)]));
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof DirectionRequired) return NextResponse.json({ error: error.message, code: error.code, candidates: error.candidates, resolutions: error.resolutions, warnings: error.warnings }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    if (error instanceof ResolutionRequired) return NextResponse.json({ error: error.message, code: error.code, resolutions: error.resolutions }, { status: 409 });
    if (error instanceof ProductError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: { 'Cache-Control': 'no-store', ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) } });
    console.error('Harmonize: unexpected internal failure');
    return NextResponse.json({ error: 'The brief could not be completed. Please try again.' }, { status: 500 });
  }
}
