import { CATALOG, materialById } from './catalog';
import { ProductError } from './errors';
import { needsSummary, qualityLabel } from './project-spec';
import type { Bridge, CatalogMaterial, CompositionPlan, PlanDecision, PlanRole, ProjectMode, ProjectNeeds, ProjectSpec, Quality, Resolution } from './types';

const roles: Record<ProjectMode, Record<Quality, string>> = {
  spaces: { minimal: 'clear circulation and a simple furniture outline', sculptural: 'one curved chair or shaped cushion as the focal form', organic: 'one tactile woven surface and rounded edges', technical: 'one repeated straight edge or aligned seam', cinematic: 'a bounded tonal focal area with layered lighting' },
  fashion: { minimal: 'a clean silhouette with repeatable layers', sculptural: 'one shaped shoulder or sleeve balanced by a simple lower half', organic: 'a relaxed cut and a softly textured inner layer', technical: 'a functional cut with one repeated seam or closure detail', cinematic: 'layered tones and a gradual change of texture between garments' },
  decor: { minimal: 'a simple outline and concealed fittings', sculptural: 'one curved or offset outline', organic: 'a tactile contact surface and rounded edges', technical: 'an aligned joint or repeated rib', cinematic: 'a tonal outer body with one contrasting inset' },
  art: { minimal: 'an unworked margin and one clear focal event', sculptural: 'one folded or raised shape', organic: 'an irregular fiber texture or hand-drawn edge', technical: 'a measured grid or repeated interval', cinematic: 'a gradual tonal reveal and one concentrated field' },
};
const tensions: Record<string, string> = {
  'organic|technical': 'Measured repetition can feel rigid beside irregular texture. Keep the geometry consistent and vary one contact surface.',
  'cinematic|sculptural': 'Atmosphere and expressive form can both demand attention. Keep one focal object and quieter surrounding forms.',
  'cinematic|technical': 'A strict grid can flatten atmosphere. Use it to organize edges while gradual tone changes carry depth.',
  'cinematic|organic': 'Heavy tonal contrast can conceal texture. Keep the tactile surface distinct from the main field.',
  'cinematic|minimal': 'Layered atmosphere can crowd a restrained composition. Confine the tonal event to one clear area.',
  'minimal|sculptural': 'Expressive form can overwhelm a quiet composition. Give it one focal position and simplify the surrounding outlines.',
  'minimal|organic': 'Visible grain can make a restrained composition busy. Repeat one texture and keep the other surfaces plain.',
  'minimal|technical': 'Functional details can become visual noise. Use one interval or seam language and remove duplicates.',
  'organic|sculptural': 'An expressive outline and irregular texture can compete. Keep the surface treatment consistent around the main form.',
  'sculptural|technical': 'Free-form volume and mechanical repetition can look disconnected. Repeat one edge, seam or interval across both.',
};
const experiments: Record<ProjectMode, string> = {
  spaces: 'Put one wall-color sample beside one textile sample in the actual room. Check them together in daylight and evening light before buying or painting.',
  fashion: 'Try one outer layer, one inner layer and one accessory together. Check movement and the full-length silhouette, then remove the detail that competes with the focal shape.',
  decor: 'Make a paper or cardboard mock-up of one object. Check its scale, outline and contact surface before selecting the final finish.',
  art: 'Make three thumbnails using the same motifs and palette. Change only their size and spacing; choose the version with the clearest focal point.',
};
export function roleFor(mode: ProjectMode, quality: Quality, needs: ProjectNeeds): string {
  const role = roles[mode][quality];
  if (needs.scale !== 'compact') return role;
  if (mode === 'spaces') return {
    minimal: 'clear circulation around the existing furniture and fewer visible objects',
    sculptural: 'one compact curved chair or shaped cushion, within the existing circulation space',
    organic: 'one small tactile cover and softly rounded edges',
    technical: 'one slim aligned edge or repeated seam on an existing piece',
    cinematic: 'one bounded tonal focal area with layered lighting in the small room',
  }[quality];
  if (mode === 'fashion') return `${role}, repeated across a few interchangeable pieces`;
  if (mode === 'decor') return `${role}, contained in one small multipurpose object`;
  return `${role}, contained in one small-format study`;
}

// A material's job is constrained by its actual surface, not copied from a
// reference's broad aesthetic role (a wall finish cannot itself be a chair).
export function decisionRoleFor(spec: ProjectSpec, slot: PlanRole): string {
  const compact = spec.needs.scale === 'compact';
  return {
    spaces: {
      main: 'a wall-color backdrop for the chosen focal form',
      support: compact ? 'one removable textile on a compact existing seat or cushion' : 'one removable textile on the selected upholstered element',
      accent: 'one repeated finish on small existing objects or compatible furniture edges',
    },
    fashion: {
      main: 'the fabric of the main garment silhouette',
      support: 'one contrasting inner layer that supports the outer silhouette',
      accent: 'one repeated closure and accessory finish',
    },
    decor: {
      main: compact ? 'the body of one small multipurpose object' : 'the body of the selected object',
      support: 'one replaceable contact surface or liner',
      accent: 'one repeated fitting finish',
    },
    art: {
      main: compact ? 'the prepared main color field of one small-format paper study' : 'the prepared main color field on paper',
      support: 'one secondary shape or line field over the prepared ground',
      accent: 'one small repeated pigment mark',
    },
  }[spec.mode][slot];
}

function selectDecision(spec: ProjectSpec, slot: PlanRole, quality: Quality, queries: string[], catalog: readonly CatalogMaterial[]): PlanDecision {
  const candidates = catalog.filter(m => m.mode === spec.mode && m.slot === slot && m.qualities.includes(quality) &&
    (spec.needs.budget !== 'economical' || m.budget === 'basic') && (spec.needs.use !== 'daily' || m.daily));
  candidates.sort((a, b) => spec.needs.budget === 'flexible' ? Number(b.budget === 'premium') - Number(a.budget === 'premium') : Number(a.budget === 'premium') - Number(b.budget === 'premium'));
  for (const material of candidates) {
    const variants = material.variants.filter(v => (slot !== 'main' || v.tone === (spec.needs.tone === 'any' ? 'light' : spec.needs.tone)) && v.moods.includes(spec.needs.mood));
    const variant = variants[0];
    if (!variant) continue;
    const related = spec.references.filter(r => queries.includes(r.query));
    const designRole = decisionRoleFor(spec, slot);
    const practical = spec.needs.budget === 'economical' ? 'Keep suitable existing pieces; use this catalog’s basic material option only where a change is needed. ' : '';
    return {
      role: slot, influenceQueries: queries, materialId: material.id, variantId: variant.id,
      materialName: material.name, colorName: variant.name, hex: variant.hex, surface: material.surface,
      application: material.application, care: material.care, designRole,
      rationale: `${related.map(r => `${r.query}: you chose ${qualityLabel(r.quality).toLowerCase()}`).join('; ')}. The influence roles above preserve those qualities; this material provides ${designRole}. ${practical}`.trim(),
    };
  }
  throw new ProductError(`No checked ${slot} material fits these choices. Review the budget, use or color setting; no need has been silently relaxed.`, 422, 'NO_COMPATIBLE_PLAN');
}

export function validateComposition(plan: CompositionPlan, catalog: readonly CatalogMaterial[] = CATALOG): string[] {
  const issues: string[] = [];
  const n = plan.spec.needs;
  if (plan.decisions.length !== 3 || new Set(plan.decisions.map(d => d.role)).size !== 3) issues.push('The plan must have one main, support and accent decision.');
  for (const d of plan.decisions) {
    const material = catalog.find(m => m.id === d.materialId);
    const variant = material?.variants.find(v => v.id === d.variantId);
    if (!material || !variant) { issues.push(`Unknown catalog selection for ${d.role}.`); continue; }
    if (material.mode !== plan.spec.mode || material.slot !== d.role || material.surface !== d.surface) issues.push(`Wrong category or surface for ${d.role}.`);
    if (d.materialName !== material.name || d.application !== material.application || d.care !== material.care || d.hex !== variant.hex || d.colorName !== variant.name) issues.push(`Catalog fields were changed after selection for ${d.role}.`);
    if (n.budget === 'economical' && material.budget !== 'basic') issues.push(`Budget conflict in ${d.role}.`);
    if (n.use === 'daily' && !material.daily) issues.push(`Use conflict in ${d.role}.`);
    if (!variant.moods.includes(n.mood)) issues.push(`Mood conflict in ${d.role}.`);
    if (d.role === 'main' && n.tone !== 'any' && variant.tone !== n.tone) issues.push('Main color conflicts with the confirmed tone.');
    const related = plan.spec.references.filter(r => d.influenceQueries.includes(r.query));
    const expectedRole = decisionRoleFor(plan.spec, d.role);
    if (!related.length || d.designRole !== expectedRole) issues.push(`An influence role changed after selection for ${d.role}.`);
  }
  for (const ref of plan.spec.references) {
    if (!plan.influences.some(i => i.query === ref.query && i.quality === ref.quality && i.source === 'user') || !plan.decisions.some(d => d.influenceQueries.includes(ref.query))) issues.push(`Missing confirmed influence: ${ref.query}.`);
  }
  if (JSON.stringify(plan.summary) !== JSON.stringify(needsSummary(plan.spec))) issues.push('Summary no longer matches the confirmed needs.');
  if (n.scale === 'compact' && plan.influences.some(i => i.role !== roleFor(plan.spec.mode, i.quality, n))) issues.push('An influence role ignores the confirmed compact scale.');
  if (plan.spec.direction) {
    const d = plan.direction;
    if (!d || d.bridge.id !== plan.spec.direction.entityId || d.quality !== plan.spec.direction.quality || d.role !== roleFor(plan.spec.mode, d.quality, n)) issues.push('Shared direction does not match the confirmed choice.');
    if (d && (d.bridge.coverage !== plan.influences.length || d.bridge.perSignal.length !== plan.influences.length || d.bridge.perSignal.some(s => s.affinity === null || s.affinity <= 0))) issues.push('Shared direction lacks evidence from every reference.');
    if (d && plan.influences.some(i => !d.bridge.perSignal.some(s => s.entityId === i.entityId))) issues.push('Shared direction scores do not match the confirmed entities.');
  }
  return issues;
}

export function buildComposition(spec: ProjectSpec, resolutions: Resolution[], catalog: readonly CatalogMaterial[] = CATALOG, bridge?: Bridge): CompositionPlan {
  const influences = spec.references.map(ref => {
    const entity = resolutions.find(r => r.query === ref.query)?.selected;
    if (!entity) throw new ProductError(`Confirm the meaning of ${ref.query} first.`, 409, 'RESOLUTION_REQUIRED');
    return { query: ref.query, name: entity.name, entityId: entity.id, quality: ref.quality, qualityLabel: qualityLabel(ref.quality), source: 'user' as const, role: roleFor(spec.mode, ref.quality, spec.needs) };
  });
  // Order is not a priority signal. Rank unique user qualities by frequency,
  // then stable quality ID; every original influence remains represented.
  const unique = [...new Set(influences.map(i => i.quality))].sort((a, b) => influences.filter(i => i.quality === b).length - influences.filter(i => i.quality === a).length || a.localeCompare(b));
  const primary = spec.direction?.quality || unique[0], secondary = unique.find(q => q !== primary) || primary;
  const accent = unique.find(q => q !== primary && q !== secondary) || secondary;
  const allQueries = influences.map(i => i.query);
  const decisions = [
    selectDecision(spec, 'main', primary, allQueries, catalog),
    selectDecision(spec, 'support', secondary, allQueries, catalog),
    selectDecision(spec, 'accent', accent, allQueries, catalog),
  ];
  const direction = bridge && spec.direction ? { bridge, quality: spec.direction.quality, role: roleFor(spec.mode, spec.direction.quality, spec.needs) } : undefined;
  if (spec.direction && !direction) throw new ProductError('A verified shared direction is required.', 422, 'INVALID_DIRECTION');
  if (direction) {
    decisions[0].rationale = `Qloo connected ${direction.bridge.name} to every confirmed reference. You chose ${qualityLabel(direction.quality).toLowerCase()} as your interpretation of that shared reference: ${direction.role}. This material supplies ${decisions[0].designRole}. ${spec.needs.budget === 'economical' ? 'Retain usable existing pieces and test only a small sample first.' : 'Test the selected finish before committing.'}`;
  }
  const contrastPairs: string[] = [];
  for (let i = 0; i < unique.length; i++) for (let j = i + 1; j < unique.length; j++) {
    const text = tensions[[unique[i], unique[j]].sort().join('|')];
    if (text) contrastPairs.push(text);
  }
  const mood = spec.needs.mood === 'calm' ? 'Keep one focal event and reduce competing detail.' : spec.needs.mood === 'dramatic' ? 'Make one focal form clearly legible; keep the supporting detail subordinate.' : 'Use one repeated detail to connect the different roles.';
  const plan: CompositionPlan = {
    version: 2, spec: structuredClone(spec), title: influences.map(i => i.name).join(' × '), summary: needsSummary(spec), influences,
    ...(direction ? { direction } : {}),
    synthesis: {
      commonGround: unique.length === 1 ? `You chose ${qualityLabel(primary).toLowerCase()} across these references. Connect them through that quality, with contrast in surface or scale.` : `You want ${unique.map(qualityLabel).join(' and ').toLowerCase()} in one project. Preserve each as a separate role and connect them through one repeated detail.`,
      tension: contrastPairs.join(' ') || 'These references share your chosen quality. Vary one surface or scale rather than inventing a clash between styles.',
      combination: `${influences.map(i => `${i.name}: preserve ${i.qualityLabel.toLowerCase()} through ${i.role}.`).join(' ')} ${mood}`,
    },
    decisions, experiment: direction ? `Study ${direction.bridge.name} alongside your original references. Make one trial of ${direction.role}; your chosen ${qualityLabel(direction.quality).toLowerCase()} is a creative interpretation, not a property inferred from affinity. ${experiments[spec.mode]}` : experiments[spec.mode],
    caveats: [
      'Your confirmed selections guide the design. Free-text notes are saved without inferring additional needs.',
      'Catalog colors are authored sample targets. They are not measured product colors or certified aesthetic compatibility.',
      'Basic and premium are relative catalog groupings, not current price quotes. Verify actual prices, dimensions, care and suitability before committing.',
      'Qloo scores describe cultural affinity, not a probability of liking a design, product suitability or a visual match.',
    ],
  };
  if (direction) {
    plan.synthesis.commonGround = `Qloo returned ${direction.bridge.name} (${direction.bridge.domain}) with positive individual affinity for every reference. You selected it as the shared starting point, and chose ${qualityLabel(direction.quality).toLowerCase()} to carry into this project.`;
    plan.synthesis.combination = `Use ${direction.bridge.name} as a shared reference, interpreted through ${direction.role}. ${plan.synthesis.combination}`;
  }
  const issues = validateComposition(plan, catalog);
  if (issues.length) throw new ProductError(`The plan could not pass compatibility checks: ${issues.join(' ')}`, 422, 'NO_COMPATIBLE_PLAN');
  return plan;
}

// Useful for verifying exported decisions without an independent material lookup.
export { materialById };
