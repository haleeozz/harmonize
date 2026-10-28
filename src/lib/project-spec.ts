import type { ProjectMode, ProjectNeeds, ProjectSpec, Quality } from './types';
import { ProductError } from './errors';

export const MODES: { id: ProjectMode; label: string; description: string; compact: string; daily: string }[] = [
  { id: 'spaces', label: 'Living spaces', description: 'Surface, furniture and lighting direction', compact: 'Small room / clear circulation', daily: 'Everyday living' },
  { id: 'fashion', label: 'Fashion capsule', description: 'Silhouette, textiles and accessories', compact: 'Few interchangeable pieces', daily: 'Everyday wear' },
  { id: 'decor', label: 'Objects & decor', description: 'Object shape, surface and details', compact: 'Small multipurpose object', daily: 'Frequent handling' },
  { id: 'art', label: 'Visual art', description: 'Motifs, composition and medium', compact: 'Small-format composition', daily: 'Regular creative practice' },
];
export const QUALITIES: { id: Quality; label: string; description: string }[] = [
  { id: 'minimal', label: 'Quiet structure', description: 'Simple shapes and breathing room' },
  { id: 'sculptural', label: 'Dramatic form', description: 'Expressive shapes and a focal point' },
  { id: 'organic', label: 'Natural texture', description: 'Tactile surfaces and irregular detail' },
  { id: 'technical', label: 'Technical order', description: 'Precise lines and repeated structure' },
  { id: 'cinematic', label: 'Cinematic atmosphere', description: 'Layered depth and tonal reveals' },
];
export const DEFAULT_NEEDS: ProjectNeeds = { scale: 'unspecified', budget: 'unspecified', use: 'unspecified', tone: 'any', mood: 'any' };
export const NEED_OPTIONS = {
  scale: ['unspecified', 'compact', 'standard'], budget: ['unspecified', 'economical', 'flexible'],
  use: ['unspecified', 'daily', 'occasion'], tone: ['any', 'dark', 'light'], mood: ['any', 'calm', 'dramatic'],
} as const;
export const qualityLabel = (id: Quality) => QUALITIES.find(q => q.id === id)!.label;
export const modeLabel = (id: ProjectMode) => MODES.find(m => m.id === id)!.label;
export function needsSummary(spec: ProjectSpec): string[] {
  const mode = MODES.find(m => m.id === spec.mode)!;
  return [
    `Project: ${mode.label}`,
    `Scale: ${spec.needs.scale === 'compact' ? mode.compact : spec.needs.scale === 'standard' ? 'Standard' : 'Not specified'}`,
    `Budget: ${spec.needs.budget === 'economical' ? 'Economical; retain usable existing pieces' : spec.needs.budget === 'flexible' ? 'Flexible' : 'Not specified'}`,
    `Use: ${spec.needs.use === 'daily' ? mode.daily : spec.needs.use === 'occasion' ? 'Occasional / special use' : 'Not specified'}`,
    `Main color: ${spec.needs.tone === 'any' ? 'No preference' : spec.needs.tone === 'dark' ? 'Dark' : 'Light'}`,
    `Atmosphere: ${spec.needs.mood === 'any' ? 'No preference' : spec.needs.mood === 'calm' ? 'Calm' : 'Bold and dramatic'}`,
  ];
}
export function validateInput(body: unknown): ProjectSpec {
  const invalid = (message: string): never => { throw new ProductError(message, 400, 'INVALID_PROJECT'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid('Choose your project type and references.');
  const b = body as Record<string, unknown>;
  if (b.version !== 2) throw new ProductError('This page uses an older project format. Refresh the page and confirm the structured choices.', 400, 'PROJECT_SPEC_REQUIRED');
  if (!MODES.some(m => m.id === b.mode)) return invalid('Choose a project type.');
  if (!Array.isArray(b.references) || b.references.length < 2 || b.references.length > 4) return invalid('Add two to four distinct cultural references.');
  const references = b.references.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid('Check your references.');
    const r = raw as Record<string, unknown>;
    if (typeof r.query !== 'string' || !r.query.trim() || r.query.trim().length > 80) return invalid('Each reference needs a name of 1–80 characters.');
    if (!QUALITIES.some(q => q.id === r.quality)) return invalid(`Choose what you want to keep from ${r.query}.`);
    if (r.entityId !== undefined && (typeof r.entityId !== 'string' || !r.entityId || r.entityId.length > 100)) return invalid('Check the selected entity.');
    return { query: r.query.trim(), quality: r.quality as Quality, ...(r.entityId ? { entityId: r.entityId as string } : {}) };
  });
  if (new Set(references.map(r => r.query.normalize('NFKC').toLowerCase())).size !== references.length) return invalid('Use distinct references.');
  if (!b.needs || typeof b.needs !== 'object' || Array.isArray(b.needs)) return invalid('Review the project needs.');
  const needs = b.needs as Record<string, unknown>;
  for (const [key, options] of Object.entries(NEED_OPTIONS)) if (!(options as readonly unknown[]).includes(needs[key])) return invalid(`Choose a valid ${key} setting.`);
  if (typeof b.notes !== 'string' || b.notes.length > 600) return invalid('Notes must be text of at most 600 characters.');
  let direction: ProjectSpec['direction'];
  if (b.direction !== undefined) {
    if (!b.direction || typeof b.direction !== 'object' || Array.isArray(b.direction)) return invalid('Choose a shared direction.');
    const d = b.direction as Record<string, unknown>;
    if (typeof d.entityId !== 'string' || !d.entityId || d.entityId.length > 100 || !QUALITIES.some(q => q.id === d.quality)) return invalid('Choose a shared direction and what you want to borrow from it.');
    direction = { entityId: d.entityId, quality: d.quality as Quality };
  }
  return {
    version: 2, mode: b.mode as ProjectMode, references,
    needs: Object.fromEntries(Object.keys(NEED_OPTIONS).map(k => [k, needs[k]])) as unknown as ProjectNeeds,
    notes: b.notes.trim(),
    ...(direction ? { direction } : {}),
  };
}
