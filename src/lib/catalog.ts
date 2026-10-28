import type { CatalogMaterial, ColorVariant, PlanRole, ProjectMode, Quality } from './types';

// Color targets are authored finish variants, not measured real product colors.
const neutral: ColorVariant[] = [
  { id: 'charcoal', name: 'Charcoal', hex: '#303137', tone: 'dark', moods: ['calm', 'dramatic', 'any'] },
  { id: 'ivory', name: 'Warm ivory', hex: '#E8E4DA', tone: 'light', moods: ['calm', 'dramatic', 'any'] },
];
const textile: ColorVariant[] = [
  { id: 'taupe', name: 'Muted taupe', hex: '#A89A87', tone: 'mid', moods: ['calm', 'any'] },
  { id: 'burgundy', name: 'Deep burgundy', hex: '#713D4B', tone: 'dark', moods: ['dramatic', 'any'] },
  { id: 'oat', name: 'Oat', hex: '#D4C8B3', tone: 'light', moods: ['calm', 'dramatic', 'any'] },
];
const coatings: ColorVariant[] = [
  { id: 'slate', name: 'Muted slate', hex: '#7D888A', tone: 'mid', moods: ['calm', 'any'] },
  { id: 'bronze-tone', name: 'Warm bronze tone', hex: '#B58B4A', tone: 'mid', moods: ['dramatic', 'any'] },
];
const metal: ColorVariant[] = [
  { id: 'silver', name: 'Brushed silver', hex: '#A1AAAD', tone: 'mid', moods: ['calm', 'any'] },
  { id: 'brass', name: 'Warm brass', hex: '#B58B4A', tone: 'mid', moods: ['dramatic', 'any'] },
];
const pigment: ColorVariant[] = [
  { id: 'graphite', name: 'Graphite gray', hex: '#737B7D', tone: 'mid', moods: ['calm', 'any'] },
  { id: 'oxblood', name: 'Oxblood', hex: '#62363F', tone: 'dark', moods: ['dramatic', 'any'] },
];
const all: Quality[] = ['minimal', 'sculptural', 'organic', 'technical', 'cinematic'];
function item(id: string, mode: ProjectMode, slot: PlanRole, name: string, surface: string, qualities: Quality[], application: string, variants: ColorVariant[], extra: Partial<Pick<CatalogMaterial, 'budget' | 'daily' | 'care'>> = {}): CatalogMaterial {
  return { id, mode, slot, name, surface, qualities, application, variants, budget: 'basic', daily: true,
    care: 'Check the actual product’s substrate, care and finish instructions before use.', ...extra };
}
export const CATALOG: readonly CatalogMaterial[] = [
  item('wall-paint', 'spaces', 'main', 'Washable matte wall paint', 'wall', all,
    'Apply to a chosen wall with the correct primer for its substrate. Retain the existing floor or choose a separately rated flooring product.', neutral),
  item('mineral-wall', 'spaces', 'main', 'Mineral wall finish', 'wall', ['organic', 'sculptural'],
    'Use on one wall as a tactile surface. Check its cleanability against the room’s actual use.', neutral, { budget: 'premium', daily: false }),
  item('canvas-cover', 'spaces', 'support', 'Removable cotton canvas cover', 'upholstery', ['organic', 'minimal'],
    'Use on an existing seat or removable cushion cover; confirm upholstery suitability and care instructions.', textile),
  item('velvet-cover', 'spaces', 'support', 'Removable cotton velvet cover', 'upholstery', ['sculptural', 'cinematic'],
    'Use for one upholstered piece or cushion, checking wear suitability and the manufacturer’s care requirements.', textile),
  item('ribbed-cover', 'spaces', 'support', 'Ribbed cotton-blend cover', 'upholstery', ['technical'],
    'Repeat the rib direction on one removable upholstered element; check the fabric is intended for the selected use.', textile),
  item('leather-cover', 'spaces', 'support', 'Leather upholstery', 'upholstery', ['cinematic'],
    'Use on one existing-size upholstered piece, checking finish and maintenance needs.', textile, { budget: 'premium' }),
  item('paint-detail', 'spaces', 'accent', 'Painted object detail', 'small-object', all,
    'Repeat a compatible coating on two existing small objects or furniture edges. Do not apply ordinary decorative paint to electrical parts.', coatings),
  item('twill-shell', 'fashion', 'main', 'Structured cotton twill', 'garment-shell', ['sculptural', 'cinematic'],
    'Use for one jacket or overshirt; test drape and movement with a fabric sample.', neutral),
  item('linen-shell', 'fashion', 'main', 'Cotton-linen blend', 'garment-shell', ['organic'],
    'Use for a relaxed outer layer; check shrinkage and care before cutting.', neutral),
  item('poplin-shell', 'fashion', 'main', 'Cotton poplin', 'garment-shell', ['minimal'],
    'Use for a clean-cut shirt or overshirt, keeping the seam language consistent.', neutral),
  item('ripstop-shell', 'fashion', 'main', 'Cotton-nylon ripstop', 'garment-shell', ['technical'],
    'Use for one functional outer layer; choose a garment-weight fabric rather than assuming all ripstop behaves alike.', neutral),
  item('wool-shell', 'fashion', 'main', 'Wool gabardine', 'garment-shell', ['sculptural', 'cinematic'],
    'Use for a structured special-use jacket; check tailoring and care requirements.', neutral, { budget: 'premium', daily: false }),
  item('jersey-layer', 'fashion', 'support', 'Cotton jersey', 'inner-layer', ['minimal', 'technical', 'cinematic'],
    'Use as a contrasting inner layer; check stretch recovery and comfort.', textile),
  item('slub-layer', 'fashion', 'support', 'Slub cotton jersey', 'inner-layer', ['organic', 'sculptural'],
    'Use one soft textured inner layer so the outer silhouette remains legible.', textile),
  item('metal-closures', 'fashion', 'accent', 'Standard metal closures', 'garment-hardware', all,
    'Repeat one finish on closures and one accessory; check weight and compatibility with the garment fabric.', metal),
  item('plywood-body', 'decor', 'main', 'Sealed painted plywood', 'object-body', all,
    'Use for a small object or cabinet body with rounded contact edges; validate dimensions and load separately.', neutral),
  item('solid-wood-body', 'decor', 'main', 'Finished solid timber', 'object-body', ['organic', 'sculptural'],
    'Use a suitable finished timber for one object body; verify joinery and load for the intended use.', neutral, { budget: 'premium' }),
  item('cotton-inset', 'decor', 'support', 'Replaceable cotton inset', 'object-contact', ['organic', 'minimal', 'cinematic'],
    'Use as a replaceable liner or contact pad; check that the surface fits how the object is handled.', textile),
  item('felt-inset', 'decor', 'support', 'Replaceable felt inset', 'object-contact', ['technical', 'sculptural'],
    'Use as one aligned inset or contact pad; keep it removable for replacement.', textile),
  item('standard-pull', 'decor', 'accent', 'Standard metal pull or rim', 'object-hardware', all,
    'Repeat one standard fitting finish; check fixing dimensions and intended load.', metal),
  item('paper-ground', 'art', 'main', 'Heavyweight mixed-media paper with acrylic ground', 'art-ground', all,
    'Prepare a small paper sample with the chosen ground color. Check buckling, drying and adhesion before the final piece.', neutral),
  item('acrylic-field', 'art', 'support', 'Water-based acrylic wash', 'art-layer', ['minimal', 'cinematic', 'organic'],
    'Build one tonal field over the prepared paper; test drying and layer compatibility on the same stock.', pigment),
  item('paper-relief', 'art', 'support', 'Painted folded-paper relief', 'art-layer', ['sculptural'],
    'Fold a small piece of compatible paper, apply the chosen color, and test its attachment to the prepared ground.', pigment),
  item('ink-grid', 'art', 'support', 'Water-based ink linework', 'art-layer', ['technical'],
    'Draw a measured line grid on a dry test ground; check whether the ink feathers or reactivates the underlying paint.', pigment),
  item('acrylic-mark', 'art', 'accent', 'Small acrylic pigment mark', 'art-detail', all,
    'Repeat one small accent mark using a compatible water-based paint; test the full layer sequence first.', coatings),
];
export const materialById = (id: string) => CATALOG.find(m => m.id === id);
