'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Check, ChevronDown, Copy, Download, LoaderCircle, Plus, X } from 'lucide-react';
import type { Bridge, HarmonizationResult, ProjectMode, ProjectNeeds, ProjectSpec, Quality, Resolution } from '@/lib/types';
import { DEFAULT_NEEDS, MODES, QUALITIES, needsSummary, validateInput } from '@/lib/project-spec';
import { MaterialStudy } from '@/components/material-study';
import { SharedDirection, type DirectionChoice } from '@/components/shared-direction';

type DraftRef = { query: string; quality: Quality | '' };
const packs = [
  { label: 'Monastic shadow', seeds: ['Rick Owens', 'Massive Attack'] },
  { label: 'A slower kind of living', seeds: ['Aesop', 'Bon Iver'] },
  { label: 'Future, quietly', seeds: ['Blade Runner 2049', 'Ryoji Ikeda'] },
];
const score = (n: number | null) => n === null ? 'Not returned' : n.toFixed(3);
function download(name: string, content: string, type = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Discovery({ bridge }: { bridge: Bridge }) {
  return <article className="bridge-card"><span className="eyebrow">RELATED {bridge.domain.toUpperCase()}</span><h4>{bridge.name}</h4><p className="bridge-description">{bridge.description || 'No description returned.'}</p><div className="score-table">{bridge.perSignal.map((s, i) => <div key={i}><span>{s.name}</span><span className="mono">{score(s.affinity)}</span></div>)}</div><small className="muted">Cultural affinity only; no design transfer is assumed.</small></article>;
}
function Result({ result }: { result: HarmonizationResult }) {
  const { plan, evidence } = result;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  return <>
    <div className="result-top"><span className="eyebrow">YOUR COMPOSITION / CONFIRMED CHOICES</span><button className="secondary-button" onClick={() => download('harmonize-brief.md', result.brief)}><Download size={14} /> Save brief</button></div>
    <h2>{plan.title}</h2><p className="result-deck">Different influences. One considered project.</p>
    <section className="confirmed-project" aria-label="Your confirmed project"><div className="eyebrow">01 / YOUR CONFIRMED PROJECT</div><h3>This is what we’re working with.</h3><ul>{plan.summary.map(s => <li key={s}>{s}</li>)}</ul>{plan.spec.notes && <details><summary>Your notes · retained without interpretation <ChevronDown size={12} /></summary><p className="saved-notes">{plan.spec.notes}</p></details>}</section>
    {plan.direction && <section className="shared-result"><span className="eyebrow">YOUR SHARED CULTURAL DIRECTION</span><h3>{plan.direction.bridge.name}</h3><p>{plan.direction.bridge.description || 'No description returned.'}</p><p>Your interpretation: {plan.direction.role}.</p><div className="score-table">{plan.direction.bridge.perSignal.map((s, i) => <div key={i}><span>{s.name}</span><span className="mono">{score(s.affinity)}</span></div>)}</div><small>Qloo supplied the cultural connection. You chose its creative interpretation; these scores do not measure visual similarity.</small></section>}
    <section className="influences-section"><div className="eyebrow">02 / WHAT TO KEEP FROM EACH INFLUENCE</div><p className="field-hint">These qualities are your selections. They are not guessed from a name or measured by Qloo.</p><div className="influence-grid">{plan.influences.map(i => <article key={i.query}><h4>{i.name}</h4><span className="influence-trait">You chose: {i.qualityLabel}</span><p>Preserve it through {i.role}.</p></article>)}</div></section>
    <div className="synthesis-grid"><article><span className="eyebrow">03 / WHAT MAY CLASH</span><h3>Give each influence a role.</h3><p>{plan.synthesis.tension}</p></article><article><span className="eyebrow">HOW TO BRING IT TOGETHER</span><h3>Different voices. One composition.</h3><p>{plan.synthesis.commonGround}</p><p>{plan.synthesis.combination}</p></article></div>
    <section className="decisions-section"><div className="eyebrow">04 / THREE PRACTICAL DECISIONS</div><h3>What goes where — and why.</h3>{plan.decisions.map(d => <article className="decision" key={d.role} data-role={d.role}><span className="mono">{d.role.toUpperCase()}</span><div><h4>{d.materialName} · {d.colorName}</h4><p>{d.rationale}</p><p><strong>Where:</strong> {d.application}</p><small className="muted">{d.care}</small></div></article>)}</section>
    <section className="palette-section"><div className="sub-heading"><div><div className="eyebrow">05 / COLOR & MATERIAL OPTIONS</div><h3>A supporting palette.</h3></div><span className="editorial-label">Authored catalog options</span></div><div className="palette-study-grid"><div><MaterialStudy plan={plan} /><p className="study-caption">Schematic palette study, not a finished design or a coverage calculation.</p></div><div className="palette-options">{plan.decisions.map(d => <article className="material-card" key={d.role} data-material={d.materialId}><div className="material-top"><span className="material-swatch" style={{ background: d.hex }} /><span className="eyebrow">{d.role.toUpperCase()}</span></div><h4>{d.colorName} · {d.materialName}</h4><span className="mono hex">{d.hex}</span><p>Intended surface: {d.surface}.</p></article>)}</div></div></section>
    <section className="trial-card"><span className="eyebrow">06 / TRY IT BEFORE COMMITTING</span><h3>A small first experiment.</h3><p>{plan.experiment}</p></section>
    <details className="prompt-card"><summary>Take the plan to an image tool <ChevronDown size={14} /></summary><p className="prompt-text">{result.prompt}</p><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(result.prompt); setCopied(true); setCopyError(''); setTimeout(() => setCopied(false), 2000); } catch { setCopyError('Copy is unavailable. Save the brief to keep the same prompt.'); } }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy image prompt'}</button>{copyError && <p role="alert">{copyError}</p>}<small>The prompt uses this same plan. This app does not generate a photograph.</small></details>
    <details className="cultural-details"><summary>Cultural connections from Qloo <ChevronDown size={14} /></summary><p className="section-description">Qloo checked recommendations against each cultural reference. These scores are not probabilities, product recommendations or proof of a visual match. Cultural discoveries stay separate from the design decisions above.</p>{evidence.warnings.map(w => <p className="notice" key={w}>{w}</p>)}<div className="bridge-grid">{Object.entries(evidence.bridges).map(([domain, items]) => items[0] ? <Discovery bridge={items[0]} key={domain} /> : <p key={domain}>No {domain} recommendation returned.</p>)}</div><details className="alternatives"><summary>Other candidates <ChevronDown size={13} /></summary>{Object.entries(evidence.bridges).map(([domain, items]) => <div key={domain}><h4>{domain}</h4>{items.map(b => <div className="alternative-row" key={b.id}><span>{b.name}</span><span className="mono">{score(b.weakestAffinity)} minimum individual affinity</span></div>)}</div>)}</details></details>
    <details className="trace-panel"><summary><span>Evidence and request records <small>{evidence.trace.length} records · {(result.elapsedMs / 1000).toFixed(1)}s</small></span><ChevronDown size={14} /></summary><button className="secondary-button" onClick={() => download('harmonize-evidence.json', JSON.stringify(result, null, 2), 'application/json')}><Download size={13} /> Download evidence</button><div className="trace-scroll"><table><thead><tr><th>Purpose</th><th>Status</th><th>Results</th><th>Source</th></tr></thead><tbody>{evidence.trace.map((t, i) => <tr key={i}><td>{t.purpose}<code>{t.endpoint}</code></td><td>{t.status}</td><td>{t.count}</td><td>{t.cached ? 'Cache / shared' : 'Qloo API'}</td></tr>)}</tbody></table></div><p>Created {new Date(result.createdAt).toLocaleString()}. Successful Qloo data is cached for fifteen minutes. No paid model is called.</p></details>
    <details className="avoid-details"><summary>Limits of this plan <ChevronDown size={14} /></summary><ul>{plan.caveats.map(c => <li key={c}>{c}</li>)}</ul></details>
  </>;
}

export default function HarmonizeApp() {
  const [mode, setMode] = useState<ProjectMode | null>(null);
  const [references, setReferences] = useState<DraftRef[]>([]);
  const [input, setInput] = useState('');
  const [needs, setNeeds] = useState<ProjectNeeds>({ ...DEFAULT_NEEDS });
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState<ProjectSpec | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [entities, setEntities] = useState<Record<string, string>>({});
  const [directions, setDirections] = useState<Bridge[]>([]);
  const [direction, setDirection] = useState<DirectionChoice>();
  const [result, setResult] = useState<HarmonizationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const output = useRef<HTMLElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function edited() { setReview(null); setResult(null); setError(''); setDirections([]); setDirection(undefined); }
  function replaceReferences(refs: DraftRef[]) { edited(); setReferences(refs); setResolutions([]); setEntities({}); }
  function add() {
    const query = input.trim(); if (!query) return;
    if (references.length >= 4 || references.some(r => r.query.toLowerCase() === query.toLowerCase())) { setError('Add a distinct reference; keep the mix to four names.'); return; }
    replaceReferences([...references, { query, quality: '' }]); setInput('');
  }
  function prepare() {
    if (input.trim()) { add(); setError('Choose what you want to keep from the added reference, then review your choices.'); return; }
    try { setReview(validateInput({ version: 2, mode, references, needs, notes })); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Check your choices.'); }
  }
  async function create() {
    if (!review || loading) return;
    setLoading(true); setError(''); setResult(null);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort('timeout'), 50_000);
    try {
      const spec: ProjectSpec = { ...review, references: review.references.map(r => ({ ...r, ...(entities[r.query] ? { entityId: entities[r.query] } : {}) })), ...(direction?.quality ? { direction: { entityId: direction.entityId, quality: direction.quality } } : {}) };
      const response = await fetch('/api/harmonize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(spec), signal: abort.signal });
      const data = await response.json();
      if (response.status === 409 && data.code === 'RESOLUTION_REQUIRED') { setResolutions(data.resolutions); return; }
      if (response.status === 409 && data.code === 'DIRECTION_REQUIRED') {
        setResolutions(data.resolutions); setDirections(data.candidates); setDirection(undefined);
        setEntities(Object.fromEntries(data.resolutions.filter((r: Resolution) => r.selected).map((r: Resolution) => [r.query, r.selected!.id])));
        setTimeout(() => document.querySelector('.direction-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.error || 'The composition could not be completed.');
      setResult(data.data); setResolutions([]);
      setTimeout(() => { output.current?.scrollIntoView({ behavior: 'smooth' }); output.current?.focus({ preventScroll: true }); }, 80);
    } catch (e) { setError(abort.signal.aborted ? 'Stopped. Your choices are preserved; try again when ready.' : e instanceof Error ? e.message : 'The request could not complete.'); }
    finally { clearTimeout(timeout); controller.current = null; setLoading(false); }
  }
  function chooseNeed<K extends keyof ProjectNeeds>(key: K, value: ProjectNeeds[K]) { edited(); setNeeds(n => ({ ...n, [key]: value })); }
  const category = MODES.find(m => m.id === mode);
  const unresolved = resolutions.filter(r => !r.selected);
  const meaningsReady = unresolved.every(r => entities[r.query]);
  return <div className="app-shell"><header className="site-header"><a className="wordmark" href="#"><span className="brand-symbol">h.</span> harmonize</a><span className="header-note"><span className="status-dot" /> Cultural connections, by Qloo</span><a className="header-link" href="#how-it-works">How it works <ArrowDown size={13} /></a></header>
    <main><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="tiny-line" /> Different tastes. One project.</div><h1>Your tastes don’t<br />have to <em>match.</em><br />They can <span className="purple">harmonize.</span></h1><p>Choose what you love about different cultural references. Give each influence a role in one project, with materials and colors that respect your confirmed needs.</p><a className="text-link hero-link" href="#workspace">Build your mix <ArrowDown size={15} /></a></div><div className="hero-art" aria-label="Decorative illustration, not a generated result"><div className="hero-art-label mono">UNEXPECTED HARMONY / AN ILLUSTRATION</div><div className="arch arch-one" /><div className="arch arch-two" /><div className="art-orb" /><div className="art-plinth" /><span className="art-caption">Different notes.<br /><em>One composition.</em></span><span className="art-credit mono">ILLUSTRATIVE DESIGN STUDY</span></div></section>
      <section className="workspace section-anchor" id="workspace" aria-label="Create a composition"><div className="section-heading"><div><span className="eyebrow">YOUR MIXING DESK</span><h2>Bring your different tastes together.</h2></div><span className="step-note">Choose → review → compose</span></div>
        <fieldset className="project-fields" disabled={loading}><legend className="sr-only">Your project choices</legend>
          <div className="form-section"><h3>01 — What are you making?</h3><div className="modes" role="group" aria-label="Project type">{MODES.map(m => <button key={m.id} className={`mode ${mode === m.id ? 'mode-selected' : ''}`} aria-pressed={mode === m.id} onClick={() => { edited(); setMode(m.id); }}><span><strong>{m.label}</strong><small>{m.description}</small></span>{mode === m.id && <Check size={15} />}</button>)}</div></div>
          <div className="form-section"><h3>02 — Which cultural references do you love?</h3><p className="field-hint">Add two to four artists, brands, films, books or places. Type a name and press Enter.</p><div className="reference-entry"><input aria-label="Add a cultural reference" maxLength={80} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Type a specific cultural name…" /><button className="secondary-button" onClick={add} disabled={!input.trim() || references.length >= 4}><Plus size={14} /> Add reference</button></div><div className="packs">{packs.map(p => <button key={p.label} className="pack" onClick={() => { replaceReferences(p.seeds.map(query => ({ query, quality: '' }))); setInput(''); }}><span><strong>{p.label}</strong><small>{p.seeds.join(' + ')} · optional starting names</small></span><ArrowRight size={13} /></button>)}</div></div>
          <div className="form-section"><h3>03 — What do you want to keep from each?</h3><p className="field-hint">You choose the quality. We won’t assume what you like about a musician, film or brand.</p>{references.length === 0 && <p className="empty-hint">Add your references above to choose their roles.</p>}<div className="reference-quality-grid">{references.map((r, i) => <article className="quality-card" key={r.query}><div className="field-heading"><label htmlFor={`quality-${i}`}>{r.query}</label><button className="remove-ref" aria-label={`Remove ${r.query}`} onClick={() => replaceReferences(references.filter((_, n) => n !== i))}><X size={14} /></button></div><select id={`quality-${i}`} value={r.quality} onChange={e => { edited(); setReferences(references.map((ref, n) => n === i ? { ...ref, quality: e.target.value as Quality } : ref)); }}><option value="">Choose the quality you love…</option>{QUALITIES.map(q => <option key={q.id} value={q.id}>{q.label} — {q.description}</option>)}</select></article>)}</div></div>
          <div className="form-section"><h3>04 — What should the project respect?</h3><p className="field-hint">These choices control the result. “Not specified” keeps a need open.</p><div className="needs-grid">
            <label>Scale<select aria-label="Scale" value={needs.scale} onChange={e => chooseNeed('scale', e.target.value as ProjectNeeds['scale'])}><option value="unspecified">Not specified</option><option value="compact">{category?.compact || 'Compact / fewer elements'}</option><option value="standard">Standard</option></select></label>
            <label>Budget approach<select aria-label="Budget approach" value={needs.budget} onChange={e => chooseNeed('budget', e.target.value as ProjectNeeds['budget'])}><option value="unspecified">Not specified</option><option value="economical">Economical — retain usable pieces</option><option value="flexible">Flexible</option></select></label>
            <label>Use<select aria-label="Use" value={needs.use} onChange={e => chooseNeed('use', e.target.value as ProjectNeeds['use'])}><option value="unspecified">Not specified</option><option value="daily">{category?.daily || 'Frequent / everyday use'}</option><option value="occasion">Occasional / special use</option></select></label>
            <label>Main color direction<select aria-label="Main color direction" value={needs.tone} onChange={e => chooseNeed('tone', e.target.value as ProjectNeeds['tone'])}><option value="any">No preference</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label>Atmosphere<select aria-label="Atmosphere" value={needs.mood} onChange={e => chooseNeed('mood', e.target.value as ProjectNeeds['mood'])}><option value="any">No preference</option><option value="calm">Calm</option><option value="dramatic">Bold and dramatic</option></select></label>
          </div><label className="notes-label" htmlFor="notes">Extra notes — saved, not interpreted</label><textarea id="notes" rows={2} maxLength={600} value={notes} onChange={e => { edited(); setNotes(e.target.value); }} placeholder="Optional notes to keep with your project." /><p className="field-hint">Notes do not override the choices above. Put must-have needs in the selections.</p></div>
        </fieldset>
        {review && <div className="review-panel" aria-label="Review your choices"><span className="eyebrow">BEFORE WE COMPOSE</span><h3>Is this your mix?</h3><ul>{needsSummary(review).map(s => <li key={s}>{s}</li>)}</ul>{review.references.map(r => <p key={r.query}><strong>{r.query}</strong> → {QUALITIES.find(q => q.id === r.quality)!.label}</p>)}{review.notes && <p>Notes are retained without inferring extra needs.</p>}</div>}
        {unresolved.length > 0 && <div className="resolution-panel" aria-label="Confirm reference meanings"><span className="eyebrow">ONE MEANING CHECK</span><h3>Which reference did you mean?</h3>{unresolved.map(r => <div className="resolution-field" key={r.query}><label htmlFor={`meaning-${r.query}`}>“{r.query}”</label>{r.candidates.length ? <><select id={`meaning-${r.query}`} value={entities[r.query] || ''} disabled={loading} onChange={e => setEntities({ ...entities, [r.query]: e.target.value })}><option value="">Choose the intended entity…</option>{r.candidates.map(c => <option key={c.id} value={c.id}>{c.name} — {c.type.replace('urn:entity:', '')}</option>)}</select><p>{r.candidates.find(c => c.id === entities[r.query])?.description.slice(0, 300) || 'If none fits, edit or replace this name above.'}</p></> : <p>No match found. Edit this reference to a specific cultural name.</p>}</div>)}</div>}
        {directions.length > 0 && <SharedDirection candidates={directions} choice={direction} disabled={loading} onChange={choice => { setDirection(choice); setResult(null); setError(''); }} />}
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="workspace-action"><span className="step-note">Find a cultural thread → choose a direction → try it in your project.</span><button className="primary-button" disabled={loading || (Boolean(review) && !meaningsReady) || (directions.length > 0 && !direction?.quality)} onClick={review ? create : prepare}>{loading ? <><LoaderCircle size={16} className="spin" /> Checking your connections…</> : review ? <>{directions.length ? 'Create my composition' : 'Find my shared directions'} <ArrowRight size={15} /></> : <>Review my choices <ArrowRight size={15} /></>}</button></div>{loading && <div className="loading-panel" role="status">Checking names and individual Qloo scores, then validating your shared direction and practical needs.<button className="text-link" onClick={() => controller.current?.abort()}>Stop</button></div>}
      </section>
      {result && <section id="brief" ref={output} className="result section-anchor" tabIndex={-1} aria-label="Your composition"><Result key={result.createdAt} result={result} /></section>}
      <section className="how-section section-anchor" id="how-it-works"><span className="eyebrow">HOW THE MIX COMES TOGETHER</span><h2>Your choices. Real cultural connections.</h2><div className="how-grid"><article><span className="mono">01 / CHOOSE</span><h3>Tell us what you want to keep.</h3><p>Select your references, their qualities and your practical needs. Free-text notes stay as notes.</p></article><article><span className="mono">02 / CONNECT</span><h3>Check the cultural thread.</h3><p>Qloo resolves names and checks cross-domain candidates against each reference. Missing evidence stays missing.</p></article><article><span className="mono">03 / COMPOSE</span><h3>One plan, consistent outputs.</h3><p>A checked material catalog and authored composition rules produce the decisions, palette, download and image prompt from the same plan.</p></article></div></section>
    </main><footer className="site-footer"><a className="wordmark" href="#">harmonize</a><span>A taste-informed composition tool.<br />Built for the Qloo Agentic Hackathon 2026.</span></footer></div>;
}
