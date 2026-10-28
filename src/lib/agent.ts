import type { Bridge, HarmonizationResult, ProjectSpec, RequestTrace, Resolution } from './types';
import { findBridges, ProductError, resolveSeeds } from './qloo';
import { buildComposition } from './plan';
import { imagePrompt, markdownBrief } from './presenters';
export { validateInput } from './project-spec';

export class ResolutionRequired extends ProductError {
  constructor(public resolutions: Resolution[]) { super('Confirm the meaning of these cultural references.', 409, 'RESOLUTION_REQUIRED'); }
}
export class DirectionRequired extends ProductError {
  constructor(public candidates: Bridge[], public resolutions: Resolution[], public warnings: string[]) {
    super('Choose a shared cultural direction and what you want to borrow from it. If this page has no shared-direction choices, refresh it to load the current flow.', 409, 'DIRECTION_REQUIRED');
  }
}
export async function runHarmonizerAgent(spec: ProjectSpec, signal?: AbortSignal): Promise<HarmonizationResult> {
  const start = Date.now(), trace: RequestTrace[] = [];
  const choices = Object.fromEntries(spec.references.flatMap(r => r.entityId ? [[r.query, r.entityId]] : []));
  const resolutions = await resolveSeeds(spec.references.map(r => r.query), choices, trace, signal);
  if (resolutions.some(r => !r.selected)) throw new ResolutionRequired(resolutions);
  if (new Set(resolutions.map(r => r.selected!.id)).size !== resolutions.length) throw new ProductError('Choose references that resolve to different entities.', 400, 'DUPLICATE_ENTITIES');
  const { bridges, warnings } = await findBridges(resolutions, trace, signal);
  const candidates = Object.values(bridges).flat().filter(b => b.coverage === resolutions.length && b.weakestAffinity !== null && b.weakestAffinity > 0);
  // Keep Qloo's balanced ranking within each domain. Scores from different
  // entity categories are not treated as one calibrated ranking.
  if (!candidates.length) throw new ProductError('No candidate has positive individual evidence from every reference. Try changing one reference; separate partial matches are not a shared direction.', 422, 'NO_SHARED_DIRECTION');
  const direction = candidates.find(b => b.id === spec.direction?.entityId);
  if (!direction) throw new DirectionRequired(candidates, resolutions, warnings);
  const confirmed: ProjectSpec = { ...spec, references: spec.references.map(r => ({ ...r, entityId: resolutions.find(x => x.query === r.query)!.selected!.id })) };
  const plan = buildComposition(confirmed, resolutions, undefined, direction);
  const evidence = { resolutions, bridges, warnings, trace };
  return { version: 2, plan, evidence, prompt: imagePrompt(plan), brief: markdownBrief(plan, evidence), createdAt: new Date().toISOString(), elapsedMs: Date.now() - start };
}
