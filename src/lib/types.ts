export type ProjectMode = 'spaces' | 'fashion' | 'decor' | 'art';
export type Domain = 'brand' | 'place' | 'artist';
export type Quality = 'minimal' | 'sculptural' | 'organic' | 'technical' | 'cinematic';
export type PlanRole = 'main' | 'support' | 'accent';
export interface ProjectNeeds {
  scale: 'compact' | 'standard' | 'unspecified';
  budget: 'economical' | 'flexible' | 'unspecified';
  use: 'daily' | 'occasion' | 'unspecified';
  tone: 'dark' | 'light' | 'any';
  mood: 'calm' | 'dramatic' | 'any';
}
export interface ProjectSpec {
  version: 2;
  mode: ProjectMode;
  references: { query: string; quality: Quality; entityId?: string }[];
  needs: ProjectNeeds;
  notes: string;
  direction?: { entityId: string; quality: Quality };
}
export interface Candidate { id: string; name: string; type: string; description: string }
export interface Resolution { query: string; candidates: Candidate[]; selected: Candidate | null; status: 'exact' | 'confirmed' | 'needs-choice' | 'unresolved' }
export interface RequestTrace { purpose: string; endpoint: string; status: number; count: number; cached: boolean }
export interface Bridge {
  id: string; name: string; domain: Domain; description: string;
  combinedAffinity: number | null; perSignal: { entityId: string; name: string; affinity: number | null }[];
  weakestAffinity: number | null; coverage: number; sourceUrl: string | null;
}
export interface ColorVariant {
  id: string; name: string; hex: string; tone: 'dark' | 'light' | 'mid';
  moods: ('calm' | 'dramatic' | 'any')[];
}
export interface CatalogMaterial {
  id: string; mode: ProjectMode; slot: PlanRole; name: string; surface: string;
  budget: 'basic' | 'premium'; daily: boolean; qualities: Quality[];
  application: string; care: string; variants: ColorVariant[];
}
export interface PlanDecision {
  role: PlanRole; influenceQueries: string[];
  materialId: string; variantId: string; materialName: string; colorName: string;
  hex: string; surface: string; application: string; care: string;
  designRole: string; rationale: string;
}
export interface CompositionPlan {
  version: 2; spec: ProjectSpec; title: string; summary: string[];
  direction?: { bridge: Bridge; quality: Quality; role: string };
  influences: { query: string; name: string; entityId: string; quality: Quality; qualityLabel: string; source: 'user'; role: string }[];
  synthesis: { commonGround: string; tension: string; combination: string };
  decisions: PlanDecision[]; experiment: string; caveats: string[];
}
export interface EvidenceBundle {
  resolutions: Resolution[]; bridges: Record<Domain, Bridge[]>;
  warnings: string[]; trace: RequestTrace[];
}
export interface HarmonizationResult {
  version: 2; plan: CompositionPlan; evidence: EvidenceBundle;
  brief: string; prompt: string; createdAt: string; elapsedMs: number;
}
