# Harmonize

**How can the different things I love work together in one project?**

Harmonize combines explicit creative choices with Qloo cultural discovery. It supports living spaces, a fashion capsule, objects/decor and visual art. You choose what to keep from each reference and confirm the needs; the app does not pretend to understand free-text requirements.

## Use it

1. Choose what you are making. No category is selected for you.
2. Add two to four artists, brands, films, books or places.
3. Choose one quality to preserve from each: quiet structure, dramatic form, natural texture, technical order or cinematic atmosphere.
4. Select scale, budget approach, use, main color direction and atmosphere. Open needs can remain unspecified. Extra notes are saved, not interpreted.
5. Review the summary and find shared directions. Clarify ambiguous entity names when asked.
6. Choose a real Qloo connection supported by every input. Read its description and choose how you want to interpret it in your project; nothing is preselected.
7. Create the composition. Your shared interpretation guides the main decision while the original influences retain their roles.

The result explains your confirmed needs, each influence's role, possible friction, three concrete decisions, a main/support/accent palette, and a small first experiment. The Markdown download and image prompt come from the same checked plan. The schematic is not a completed design; no image generator is called.

## Run locally

Node.js 22.19.0 or newer, npm, and an individually issued Qloo key are required. No LLM or paid image key is used.

```sh
npm ci
```

Copy `.env.local.example` to `.env.local` and set `QLOO_API_KEY` privately. The hackathon host is `https://hackathon.api.qloo.com`; use the official host assigned to your credential. Never use a browser-exposed environment variable for the key.

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). Production:

```sh
npm run verify
npm run build
npm start
```

## One source of truth

```text
ProjectSpec v2 (explicit choices; notes are not parsed)
  → Qloo entity resolution and per-reference recommendation checks
  → fully scored shared candidates → user-selected bridge and interpretation
  → CompositionPlan from that bridge, explicit choices and the authored catalog
  → compatibility validation
  → screen / Markdown / image prompt / schematic
```

The material catalog declares category, role, intended surface, relative budget group, frequent-use suitability, application, care and named color variants. Colors are selected from those variants, not invented by blending arbitrary values. Main tone and atmosphere are independent of the qualities assigned to cultural references. A dark+calm project stays dark. Compact scale applies to every influence role.

Compatibility checks reject altered catalog fields, wrong category/surface, unrepresented influences and contradictions with confirmed needs. A missing compatible combination produces an explicit review error rather than silently relaxing the requirements. Budget groups are authored relative groupings, not current price quotes or a claim about every product sold under a material name.

## Qloo's role

Qloo `/search` resolves names. `/v2/insights` discovers brand/place/artist shortlists and checks those same candidates against each input with `filter.results.entities`. Candidates are ranked within each domain by complete evidence coverage, then their weakest individual affinity. Missing scores stay missing; zero stays zero. An input with no individual scores cannot silently disappear from a successful result.

Qloo is a required planning input: a composition cannot complete without a returned shared candidate with positive individual scores for every confirmed entity. Separate partial matches do not qualify. Candidates are ranked within each domain by weakest individual affinity; scores from different domains are not combined into a calibrated overall ranking. The first balanced candidate per available domain is shown, with further candidates under alternatives.

The user chooses one shared reference and its intended creative interpretation. The server checks that choice against the current Qloo results and carries the bridge ID, description, individual scores and approved transfer into the plan. The interpretation controls the main material-quality selection and the first experiment. Affinity does not supply colors, shapes or material suitability; those are explicit creative choices and bounded catalog decisions. The original inputs keep separate roles, with no implicit priority based on input order.

Cold two-reference requests need at most eleven Qloo calls; four references need at most nineteen. Successful responses are cached for fifteen minutes per process, concurrency is limited to three, and Retry-After is respected. Each upstream request has a ten-second timeout and the operation a 45-second deadline. The process-local eight-attempts-per-minute burst guard needs hosting-level support for larger deployments.

## API v2

`POST /api/harmonize`, JSON:

```json
{
  "version": 2,
  "mode": "spaces",
  "references": [
    { "query": "Rick Owens", "quality": "sculptural" },
    { "query": "Massive Attack", "quality": "cinematic" }
  ],
  "needs": {
    "scale": "compact",
    "budget": "economical",
    "use": "daily",
    "tone": "dark",
    "mood": "dramatic"
  },
  "notes": "Notes to retain; these do not override the selections."
}
```

Qualities: `minimal`, `sculptural`, `organic`, `technical`, `cinematic`. Needs are explicit enums; see the UI or types for the open/default choices. Two to four distinct references, at most 80 characters each; notes at most 600 characters.

Ambiguous names return HTTP 409 `RESOLUTION_REQUIRED` with candidate resolutions. Repeat with a returned `entityId` on the corresponding reference. Discovery then returns HTTP 409 `DIRECTION_REQUIRED` with fully scored candidates and confirmed resolutions. Repeat with `"direction": { "entityId": "<returned candidate ID>", "quality": "organic" }`. A stale or invented choice returns current candidates rather than completing a plan. If no fully scored positive candidate exists, HTTP 422 `NO_SHARED_DIRECTION` asks for a revised mix. These bounded shortlists do not prove that no connection exists anywhere in Qloo.

Success returns `{ success: true, data: { version, plan, evidence, brief, prompt, createdAt, elapsedMs } }`. Old v1 payloads receive HTTP 400 with `PROJECT_SPEC_REQUIRED` and a refresh message. No v1 text is reinterpreted into a v2 requirement. The body is bounded to 8 KiB while streaming, including requests without a Content-Length header.

## Checks and release

- `npm run verify`: types, lint, regression/acceptance tests and source secret scan.
- `scripts/smoke-browser.cjs`: real production-browser workflow with Qloo, shared-direction choice, downloads, clipboard, mobile layout, four categories and a three-reference mix. Playwright and a browser are external test prerequisites; the application itself does not require them. Optional environment variables: `PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE`, `TEST_BASE_URL`.
- `node scripts/check-qloo-contract.mjs`: optional four-request live check of legacy and current candidate-filter behavior; requires a Qloo key.
- Generated evidence and screenshots are saved to ignored `artifacts/`, never used as fallback application data.

See [validation](docs/VALIDATION.md), [product review](docs/PRODUCT-REVIEW.md), [deployment](docs/DEPLOYMENT.md), and [submission material](docs/SUBMISSION.md). A local build is not a public demo.

## Limits and license

This is an authored, bounded composition tool, not general language understanding or professional design certification. Qloo affinity is not visual compatibility. Check real samples, actual prices, dimensions, care, fabrication and material suitability before committing. The app does not produce floor plans, completed photographs or shopping baskets.

[MIT](LICENSE). Dependencies retain their own licenses.
