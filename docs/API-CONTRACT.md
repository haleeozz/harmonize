# Qloo contract and planning boundary

Reviewed 2026-10-28. Primary reference: Qloo's public documentation repository, https://github.com/qloo/docs-public/blob/main/reference/insights-api-deep-dive.md . The primary docs.qloo.com pages were unavailable to the documentation reader, so the official mirror was used.

## Requests
- `GET /search?query=<name>&take=5`: name candidates; the user confirms ambiguous meanings.
- `GET /v2/insights?filter.type=urn:entity:<brand|place|artist>&signal.interests.entities=<confirmed IDs>&take=6`: bounded joint shortlist.
- `GET /v2/insights?filter.type=...&filter.results.entities=<same shortlist IDs>&signal.interests.entities=<one confirmed ID>&take=<shortlist size>`: score the same candidates against each input.
- Authentication: server-only `X-Api-Key`. Requests use the official HTTPS host assigned to the key.

The current documented candidate parameter is `filter.results.entities`. A four-request live diagnostic compared it with the legacy `filter.entities` parameter by requesting only the second candidate from a result set. Both returned only the requested candidate, with the same affinity, on the hackathon host. This ruled out an ignored legacy filter as the cause of the product issue. The application now uses the documented parameter. The reproducible diagnostic is `scripts/check-qloo-contract.mjs`; the local report is ignored at `artifacts/contract/qloo-filter.json`.

## What the evidence means
Ranking within each domain first favors complete coverage, then the highest weakest individual score. A shared direction requires a strictly positive, finite score for every original entity. Missing and zero values remain distinct; zero does not qualify as positive shared support. Scores are matched by entity ID, not display name. No calibrated comparison is claimed across result domains.

This is a search over a bounded shortlist, not an exhaustive intersection of Qloo's graph. An empty checked set means this operation has no supported candidate; it does not prove that no cultural connection exists.

## What enters the composition
The chosen candidate is revalidated server-side against current results. Its ID, name, description and per-input scores enter the CompositionPlan together with the user's chosen interpretation. That interpretation controls the main material quality and the first experiment. Original references each retain a stated role. Every renderer reads the same plan.

No code extracts design traits from description keywords. No affinity value is converted to a color, material, area ratio or visual compatibility score. The shared reference is a user-approved creative starting point, not a claim that Qloo certified its physical design suitability.

## Request lifecycle
Successful responses are cached for 15 minutes in a bounded per-process cache. Upstream concurrency is three and every fetch has an independent 10-second timeout. Subscribers may cancel their own wait without cancelling shared work for other users. A cancelled upstream task can finish and populate the cache; it is not retried. The full user operation has a 45-second deadline. These are demo process limits, not distributed hosting guarantees.
