import type { CompositionPlan, EvidenceBundle } from './types';
import { modeLabel } from './project-spec';

export function imagePrompt(plan: CompositionPlan): string {
  return [
    `Create an illustrative ${modeLabel(plan.spec.mode).toLowerCase()} composition study.`,
    ...plan.summary,
    ...(plan.direction ? [`Shared cultural reference: ${plan.direction.bridge.name} (${plan.direction.bridge.domain}); user-approved interpretation: ${plan.direction.role}. Cultural affinity is not visual evidence.`] : []),
    plan.synthesis.combination,
    ...plan.decisions.map(d => `${d.role}: ${d.colorName} (${d.hex}), ${d.materialName}. Role: ${d.designRole}. Surface: ${d.surface}. ${d.application}`),
    'Use the stated main color as the foundation, with support and accent as smaller compositional roles. No numeric area allocation is specified.',
    'No logos or lettering. This is a speculative schematic concept, not an existing product or an endorsed collaboration.',
  ].join('\n');
}
export function markdownBrief(plan: CompositionPlan, evidence: EvidenceBundle): string {
  const notes = plan.spec.notes ? plan.spec.notes.split('\n').map(line => `> ${line}`).join('\n') : 'No additional notes.';
  const cultural = Object.values(evidence.bridges).flatMap(items => items.slice(0, 1)).map(b => `- ${b.name} (${b.domain}): ${b.perSignal.map(s => `${s.name}: ${s.affinity === null ? 'not returned' : s.affinity.toFixed(3)}`).join('; ')}. Qloo ID: ${b.id}`).join('\n');
  return [
    `# Harmonize — ${plan.title}`, '## Your confirmed project', ...plan.summary.map(s => `- ${s}`),
    ...(plan.direction ? ['## Your shared cultural direction', `${plan.direction.bridge.name} (${plan.direction.bridge.domain}). Qloo ID: ${plan.direction.bridge.id}`, plan.direction.bridge.description || 'No description returned.', ...(plan.direction.bridge.sourceUrl ? [`Reference website: ${plan.direction.bridge.sourceUrl}`] : []), `Individual affinities: ${plan.direction.bridge.perSignal.map(s => `${s.name}: ${s.affinity === null ? 'not returned' : s.affinity.toFixed(3)}`).join('; ')}`, `Your interpretation: ${plan.direction.role}. This was selected by you, not extracted from a cultural affinity score.`] : []),
    '## Each influence', ...plan.influences.map(i => `- ${i.name}: you chose **${i.qualityLabel}**. Preserve it through ${i.role}.`),
    '## Common direction', plan.synthesis.commonGround, '## What may clash', plan.synthesis.tension,
    '## How to combine them', plan.synthesis.combination,
    '## Three decisions', ...plan.decisions.map(d => `### ${d.role}\n${d.colorName} (${d.hex}) · ${d.materialName}\n\n${d.rationale}\n\nSurface: ${d.surface}. ${d.application}\n\nCare: ${d.care}`),
    '## First experiment', plan.experiment,
    '## Cultural discoveries', 'These are cultural-affinity recommendations, not design specifications. Full candidates and request records are in the separate evidence download.', cultural,
    ...(evidence.warnings.length ? ['## Evidence gaps', ...evidence.warnings.map(w => `- ${w}`)] : []),
    '## Notes retained without interpretation', notes,
    '## Image prompt', imagePrompt(plan),
    '## Limits', ...plan.caveats.map(c => `- ${c}`),
  ].join('\n\n') + '\n';
}
