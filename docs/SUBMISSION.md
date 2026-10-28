# Harmonize — submission text

## Tagline
Different tastes. Find their common ground, then make it yours.

## Inspiration
Liking different things is easy. Bringing them together in one creative project is harder. Harmonize starts with that problem: a person might love an artist, a book and a fashion house without knowing where to begin combining those influences.

## What it does
Choose a project: living space, fashion capsule, object or visual artwork. Add two to four cultural references, select what you want to preserve from each, and confirm the practical needs.

Harmonize resolves the names through Qloo and asks when the meaning is ambiguous. It discovers brands, places and artists connected to the mix, then checks those same candidates against every original reference. Only candidates with positive individual scores for all inputs can become the shared direction. Missing scores are not filled in.

You choose a shared cultural reference and how you want to interpret it in your project. That decision becomes part of one checked composition plan: the common direction, each original influence's role, possible tensions, three practical decisions, material/color options and a small first experiment. The screen, Markdown download, image prompt and schematic all use that same plan.

## Why Qloo matters
The shared candidates, their identities, descriptions and individual affinity scores come from Qloo. They are not sample recommendations or answers from a language model. The application cannot complete without a verified shared candidate. A changed graph changes the available directions; a stale candidate cannot be submitted as a valid choice.

Cultural affinity does not tell us which shape or color belongs in a room. The user explicitly chooses the creative interpretation of the shared reference. That interpretation guides the main material-quality selection and experiment; the authored catalog checks surfaces and practical constraints. Harmonize does not claim to extract a visual style from an affinity score.

## How we built it
Next.js, React and TypeScript. A bounded server-side orchestration workflow resolves entities, discovers candidates across three domains, checks them against each input, requests a human decision, and validates the final plan. Qloo supplies the `/search` and `/v2/insights` tools. No additional language model, shopping service or image generator is used.

The catalog couples material name, intended surface, care, relative budget, everyday-use suitability and named color variants. Main color and mood are independent: dark and calm can coexist. Practical requirements are explicit selections; notes are retained without interpretation. Reference order is not an implicit priority.

## Challenges and lessons
A technically successful API call is not enough. Early versions kept Qloo discoveries beside a separate design generator. We changed the data flow so a verified Qloo candidate and an explicit user decision are required inputs to the composition. We also separated cultural evidence, creative interpretation and physical material suitability instead of treating them as the same kind of proof.

## Validation
The repository contains a category/needs acceptance matrix, graph-change and stale-choice tests, incomplete-evidence tests, output consistency checks, shared-request cancellation checks and request-body bounds. A separate browser script exercises the production application with real Qloo data, shared-direction selection, downloads, clipboard and mobile widths. See `docs/VALIDATION.md` for actual completed runs and remaining delivery gates.

## Testing instructions for judges
1. Open the public application; no account is needed.
2. Choose a category and add two to four specific cultural names. Optional starting mixes are available.
3. Choose what you want to preserve from each reference and set the project needs.
4. Review the summary and find shared directions. Confirm the intended entity if a name is ambiguous.
5. Read the returned connections, choose one, and select how you want to interpret it. Create the composition.
6. Check the shared direction, individual scores, original influence roles, practical decisions and first experiment. Save the brief or copy the image prompt.

The app does not generate a photograph. Its schematic is an illustrative palette study. Recommendations vary with Qloo's live data; there is no scripted winning candidate. If no checked common candidate exists in the bounded shortlist, the app asks for a revised mix rather than inventing a result.

## Limits
Five authored creative interpretations and a small material catalog. No general free-text understanding, measured layout, guaranteed price, certified material compatibility or professional design service. Affinity scores describe cultural connections, not a probability of liking the finished result. The shared shortlist is bounded, and caching/rate limits are per process.

## Delivery fields — fill only after publication
- Functional application URL: pending publication.
- Public source repository URL: pending publication.
- License: MIT, included in the source.
- Built with: Qloo API, Next.js, React, TypeScript, Tailwind CSS, Lucide.

## Verified event requirements
Checked 2026-10-28 against https://qloo.devpost.com/ and https://qloo.devpost.com/rules. A functional demo URL, public open-source repository and English project description are required. A video is not listed as a required submission item. Deadline: October 30, 2026 at 11:45 pm EDT, which is October 31 at 06:45 in Türkiye. The submitted application must remain available for judging. Publication and final Devpost submission have not been performed.
