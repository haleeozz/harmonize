import type { Bridge, Quality } from '@/lib/types';
import { QUALITIES } from '@/lib/project-spec';

export type DirectionChoice = { entityId: string; quality: Quality | '' } | undefined;
export function SharedDirection({ candidates, choice, disabled, onChange }: {
  candidates: Bridge[];
  choice: DirectionChoice;
  disabled: boolean;
  onChange: (choice: DirectionChoice) => void;
}) {
  const selected = candidates.find(b => b.id === choice?.entityId);
  const primary = candidates.filter((b, index) => candidates.findIndex(c => c.domain === b.domain) === index);
  const alternatives = candidates.filter(b => !primary.includes(b));
  const card = (b: Bridge) => <button key={b.id} type="button" className={`direction-option ${choice?.entityId === b.id ? 'direction-selected' : ''}`} aria-pressed={choice?.entityId === b.id} disabled={disabled} onClick={() => onChange({ entityId: b.id, quality: choice?.quality || '' })}>
    <span className="eyebrow">{b.domain}</span><strong>{b.name}</strong>
    <span className="bridge-description">{b.description || 'No description returned. Choose only if you recognize this reference.'}</span>
    <span className="direction-scores">{b.perSignal.map((s, i) => <span key={i}>{s.name}: {s.affinity?.toFixed(3) ?? 'Not returned'}</span>)}</span>
  </button>;
  return <section className="direction-panel form-section" aria-label="Choose a shared direction">
    <span className="eyebrow">THE THREAD BETWEEN YOUR TASTES / FROM QLOO</span>
    <h3>Which connection opens a new direction?</h3>
    <p className="field-hint">Each option has positive individual evidence from every reference you entered. Start with the strongest balanced connection in each category, or explore the alternatives. Affinity describes a cultural connection, not a visual style.</p>
    <div className="direction-options">{primary.map(card)}</div>
    {alternatives.length > 0 && <details className="direction-alternatives"><summary>Explore {alternatives.length} other connections</summary><p className="field-hint">Ranked by weakest individual affinity within each category. Categories are not compared as one calibrated ranking.</p><div className="direction-options">{alternatives.map(card)}</div></details>}
    {selected && <div className="direction-interpretation"><h4>Your shared reference: {selected.name}</h4>
      <p>{selected.description || 'No description returned. Choose only if you recognize this reference.'}</p>
      {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Explore the source ↗</a>}
      <label htmlFor="direction-quality">How would you like to interpret it in your project?</label>
      <select id="direction-quality" disabled={disabled} value={choice?.quality || ''} onChange={e => onChange({ entityId: selected.id, quality: e.target.value as Quality | '' })}>
        <option value="">Choose what you want to borrow…</option>
        {QUALITIES.map(q => <option value={q.id} key={q.id}>{q.label} — {q.description}</option>)}
      </select>
      <p className="field-hint">This is your creative interpretation. We do not infer shapes, materials or colors from an affinity score. It guides the main design decision while your original influences keep their own roles.</p>
    </div>}
  </section>;
}
